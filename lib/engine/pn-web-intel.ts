import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase/client";
import type { ComponentLookup, PnMatchResult, WebIntelResult } from "@/lib/types/pn-lookup";

// ---------------------------------------------------------------------------
// Web-powered account investigation: researches each matched account
// individually via Anthropic web search and writes findings back to DB.
// ---------------------------------------------------------------------------

function getAnthropicClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key, maxRetries: 1, timeout: 30_000 });
}

// ---------------------------------------------------------------------------
// Progress callback type
// ---------------------------------------------------------------------------

export type ProgressCallback = (progress: {
  account: string;
  status: "done" | "error";
  score: number;
  total: number;
  completed: number;
}) => void;

// ---------------------------------------------------------------------------
// Parsed research result for a single account
// ---------------------------------------------------------------------------

interface ResearchResult {
  infra_ownership: string;
  cpu_ecosystem: string;
  infra_scale: string;
  expanding: string;
  direct_buy: string;
  relevance_score: number;
  summary: string;
  evidence_strength: string;
}

// ---------------------------------------------------------------------------
// Main investigation function
// ---------------------------------------------------------------------------

export async function investigateAccounts(
  component: ComponentLookup,
  matches: PnMatchResult[],
  onProgress?: ProgressCallback
): Promise<{ updatedMatches: PnMatchResult[]; intel: WebIntelResult }> {
  // Only research the top 25 matches; the rest are returned as-is
  const toResearch = matches.slice(0, 25);
  const total = toResearch.length;
  let completed = 0;
  let accountsUpdated = 0;

  const componentDesc = [
    component.manufacturer,
    component.description || component.subcategory,
    component.category ? `(${component.category})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  // Process in batches of 10 to avoid rate limits
  const BATCH_SIZE = 10;
  const results: PromiseSettledResult<PnMatchResult>[] = [];

  for (let i = 0; i < toResearch.length; i += BATCH_SIZE) {
    const batch = toResearch.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(async (match) => {
        try {
          const research = await researchAccount(
            match.company_name,
            match.domain,
            componentDesc
          );
          completed++;

          // Write back to DB if relevance score ≥ 50
          if (research.relevance_score >= 50) {
            await writeResearchToDb(match.account_id, research);
            accountsUpdated++;
          }

          onProgress?.({
            account: match.company_name,
            status: "done",
            score: research.relevance_score,
            total,
            completed,
          });

          return {
            ...match,
            was_researched: true,
            research_summary: research.summary,
            relevance_score: research.relevance_score,
            infra_scale: research.infra_scale,
            expanding: research.expanding === "yes" ? true : research.expanding === "no" ? false : null,
            direct_buy_signal: research.direct_buy,
            // Boost match score based on relevance
            match_score: Math.min(
              match.match_score + Math.floor(research.relevance_score / 5),
              100
            ),
            match_reasons: [
              ...match.match_reasons,
              ...(research.relevance_score >= 70
                ? ["Web: high relevance"]
                : research.relevance_score >= 50
                  ? ["Web: relevant"]
                  : []),
              ...(research.expanding === "yes"
                ? ["Actively expanding infrastructure"]
                : []),
            ],
          } satisfies PnMatchResult;
        } catch (err) {
          completed++;
          console.error(
            `[pn-web-intel] Error researching ${match.company_name}:`,
            err
          );
          onProgress?.({
            account: match.company_name,
            status: "error",
            score: 0,
            total,
            completed,
          });
          return match;
        }
      })
    );
    results.push(...batchResults);
  }

  // Collect researched results, keeping fulfilled values or original on rejection
  const researchedResults = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : toResearch[i]
  );

  // Combine researched top-25 with remaining unresearched accounts, sorted
  const updatedMatches = [
    ...researchedResults,
    ...matches.slice(25),
  ].sort((a, b) => b.match_score - a.match_score);

  return {
    updatedMatches,
    intel: {
      accounts_researched: total,
      accounts_updated: accountsUpdated,
    },
  };
}

// ---------------------------------------------------------------------------
// Research a single account via Anthropic web search
// ---------------------------------------------------------------------------

async function researchAccount(
  companyName: string,
  domain: string | null,
  componentDesc: string
): Promise<ResearchResult> {
  const client = getAnthropicClient();
  const domainStr = domain ? ` (${domain})` : "";

  const prompt = `Research this company for a hardware sales qualification:
Company: ${companyName}${domainStr}
Component being evaluated: ${componentDesc}

Answer these specific questions:
1. Does this company own/operate their own servers, or do they outsource compute?
2. Do they use AMD EPYC processors specifically, or Intel Xeon, or ARM, or unknown?
3. What is their infrastructure scale — small (under 100 servers), medium (100-1000), large (1000+), or hyperscale?
4. Are they actively expanding their infrastructure right now (any news from last 12 months)?
5. Would they buy components directly from a distributor, or only through OEM/Dell/HPE channels?

Respond in this EXACT format:
INFRA_OWNERSHIP: [owned/leased/hybrid/outsourced/unknown]
CPU_ECOSYSTEM: [amd/intel/arm/mixed/unknown]
INFRA_SCALE: [small/medium/large/hyperscale]
EXPANDING: [yes/no/unknown]
DIRECT_BUY: [likely/unlikely/unknown]
RELEVANCE_SCORE: [0-100]
SUMMARY: [2-3 sentences, specific findings only, no generic statements]
EVIDENCE_STRENGTH: [strong/moderate/weak/none]`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
    messages: [{ role: "user", content: prompt }],
  });

  // Handle continuation for web search
  let finalResponse = response;
  let continuations = 0;
  while (finalResponse.stop_reason === "pause_turn" && continuations < 3) {
    continuations++;
    finalResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: finalResponse.content },
      ],
    });
  }

  const textBlock = finalResponse.content.find((b) => b.type === "text");
  const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

  return parseResearchResponse(rawText);
}

// ---------------------------------------------------------------------------
// Parse research response
// ---------------------------------------------------------------------------

function parseResearchResponse(text: string): ResearchResult {
  const extract = (key: string): string => {
    const match = text.match(new RegExp(`${key}:\\s*(.+)`, "i"));
    return match?.[1]?.trim() || "unknown";
  };

  const scoreRaw = extract("RELEVANCE_SCORE");
  const score = parseInt(scoreRaw, 10);

  return {
    infra_ownership: extract("INFRA_OWNERSHIP").toLowerCase(),
    cpu_ecosystem: extract("CPU_ECOSYSTEM").toLowerCase(),
    infra_scale: extract("INFRA_SCALE").toLowerCase(),
    expanding: extract("EXPANDING").toLowerCase(),
    direct_buy: extract("DIRECT_BUY").toLowerCase(),
    relevance_score: isNaN(score) ? 0 : Math.min(Math.max(score, 0), 100),
    summary: extract("SUMMARY"),
    evidence_strength: extract("EVIDENCE_STRENGTH").toLowerCase(),
  };
}

// ---------------------------------------------------------------------------
// Write research findings back to DB
// ---------------------------------------------------------------------------

async function writeResearchToDb(
  accountId: string,
  research: ResearchResult
): Promise<void> {
  // Update accounts table
  const accountUpdate: Record<string, unknown> = {
    why_it_matters: research.summary,
    evidence_strength: research.evidence_strength,
  };

  // Only update infra_ownership_verdict if definitive
  if (["owned", "leased", "hybrid", "outsourced"].includes(research.infra_ownership)) {
    accountUpdate.infra_ownership_verdict = research.infra_ownership;
  }

  // Only update direct_buy_likelihood if definitive
  if (research.direct_buy === "likely") {
    accountUpdate.direct_buy_likelihood = "high";
  } else if (research.direct_buy === "unlikely") {
    accountUpdate.direct_buy_likelihood = "low";
  }

  await supabase
    .from("accounts")
    .update(accountUpdate as never)
    .eq("id", accountId);

  // Update account_hardware_prefs cpu_ecosystem if definitive
  if (["amd", "intel", "arm"].includes(research.cpu_ecosystem)) {
    const { data: existing } = await supabase
      .from("account_hardware_prefs")
      .select("id, cpu_ecosystem")
      .eq("account_id", accountId)
      .single();

    if (existing) {
      const row = existing as unknown as {
        id: string;
        cpu_ecosystem: string[];
      };
      const currentEco = row.cpu_ecosystem ?? [];
      if (!currentEco.includes(research.cpu_ecosystem)) {
        await supabase
          .from("account_hardware_prefs")
          .update({
            cpu_ecosystem: [...currentEco, research.cpu_ecosystem],
          } as never)
          .eq("id", row.id);
      }
    }
  }
}
