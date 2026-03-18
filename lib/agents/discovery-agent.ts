import type { CompanyDiscoveryInput, DiscoveryAgentResult } from "@/lib/types";
import {
  classifyCompanyType,
  detectHardwareCategoriesFromHints,
} from "@/lib/engine/classify-company";
import {
  computeProspectPriorityScore,
  computeDirectBuyLikelihood,
} from "@/lib/utils/scoring";
import { COMPANY_TYPE_INFRA_DEFAULT } from "@/lib/engine/infra-defaults";
import {
  insertJobRun,
  completeJobRun,
  failJobRun,
  insertProspect,
  fetchProspectDomains,
  fetchAccountDomains,
  fetchAccountCompanyNames,
} from "@/lib/supabase/queries";

// ---------------------------------------------------------------------------
// Company name / domain normalization
// ---------------------------------------------------------------------------

const COMPANY_SUFFIXES = [
  " inc", " inc.", " corp", " corp.", " llc", " ltd", " ltd.",
  " gmbh", " ag", " sa", " plc", " co.", " co",
];

function normalizeName(name: string): string {
  let lower = name.toLowerCase().trim();
  for (const suffix of COMPANY_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      lower = lower.slice(0, -suffix.length).trim();
    }
  }
  return lower;
}

function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// USA-only gate
// ---------------------------------------------------------------------------

const US_INDICATORS = [
  "united states", "usa", "us", "u.s.", "u.s.a.",
];

function isUSLocation(country?: string): boolean {
  if (!country) return true; // default to US if omitted
  const lower = country.toLowerCase().trim();
  return US_INDICATORS.includes(lower) || lower === "";
}

// ---------------------------------------------------------------------------
// Discovery Agent orchestrator
// ---------------------------------------------------------------------------

export async function runDiscoveryAgent(
  inputs: CompanyDiscoveryInput[]
): Promise<DiscoveryAgentResult> {
  const jobId = await insertJobRun("discovery");
  const startTime = Date.now();

  try {
    // 1. Load existing domains/names for deduplication
    const [existingProspectDomains, existingAccountDomains, existingAccountNames] =
      await Promise.all([
        fetchProspectDomains(),
        fetchAccountDomains(),
        fetchAccountCompanyNames(),
      ]);

    let created = 0;
    let skippedNonUs = 0;
    let skippedDuplicate = 0;
    const details: DiscoveryAgentResult["details"] = [];

    for (const input of inputs) {
      // 2. USA-only gate
      const country = input.country ?? "United States";
      if (!isUSLocation(country)) {
        skippedNonUs++;
        details.push({
          company_name: input.company_name,
          outcome: "skipped_non_us",
          reason: `Country "${country}" is outside USA scope`,
        });
        continue;
      }

      // 3. Normalize
      const normalizedName = normalizeName(input.company_name);
      const normalizedDomain = input.domain
        ? normalizeDomain(input.domain)
        : null;

      // 4. Deduplicate by domain against prospects AND accounts
      if (normalizedDomain) {
        if (
          existingProspectDomains.has(normalizedDomain) ||
          existingAccountDomains.has(normalizedDomain)
        ) {
          skippedDuplicate++;
          details.push({
            company_name: input.company_name,
            outcome: "skipped_duplicate",
            reason: `Domain "${normalizedDomain}" already exists`,
          });
          continue;
        }
      }

      // 5. Deduplicate by normalized name against accounts
      if (existingAccountNames.has(normalizedName)) {
        skippedDuplicate++;
        details.push({
          company_name: input.company_name,
          outcome: "skipped_duplicate",
          reason: `Company name "${normalizedName}" already exists as an account`,
        });
        continue;
      }

      // 6. Classify company type
      const proposedCompanyType = classifyCompanyType(
        input.company_name,
        input.industry ?? null
      );

      // 7. Detect hardware categories from hints
      const hardwareCategories = detectHardwareCategoriesFromHints(
        input.hardware_hints ?? []
      );

      // 8. Derive initial infra verdict and buy likelihood
      const infraVerdict = COMPANY_TYPE_INFRA_DEFAULT[proposedCompanyType];
      const buyLikelihood = computeDirectBuyLikelihood(
        proposedCompanyType,
        infraVerdict
      );

      // 9. Compute initial priority score
      const { priority_score } = computeProspectPriorityScore({
        proposed_direct_buy_likelihood: buyLikelihood,
        proposed_company_type: proposedCompanyType,
        proposed_infra_ownership_verdict: infraVerdict,
        hardware_categories: hardwareCategories,
      });

      // 10. Insert prospect
      const prospect = await insertProspect({
        company_name: input.company_name,
        domain: normalizedDomain,
        industry: input.industry ?? null,
        hq_location: input.hq_location ?? null,
        country: "United States",
        source: input.source ?? "import",
        notes: input.notes ?? null,
        proposed_company_type: proposedCompanyType,
        proposed_direct_buy_likelihood: buyLikelihood,
        proposed_infra_ownership_verdict: infraVerdict,
        hardware_categories: hardwareCategories,
        priority_score,
        status: "new",
      });

      // 11. Add to dedup sets so subsequent items in same batch don't duplicate
      if (normalizedDomain) {
        existingProspectDomains.add(normalizedDomain);
      }

      created++;
      details.push({
        company_name: input.company_name,
        outcome: "created",
        prospect_id: prospect.id,
      });
    }

    const result: DiscoveryAgentResult = {
      success: true,
      created,
      skipped_non_us: skippedNonUs,
      skipped_duplicate: skippedDuplicate,
      total: inputs.length,
      details,
    };

    const durationMs = Date.now() - startTime;
    await completeJobRun(
      jobId,
      result as unknown as Record<string, unknown>,
      durationMs
    );
    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await failJobRun(jobId, errorMessage, durationMs);
    return {
      success: false,
      error: errorMessage,
      created: 0,
      skipped_non_us: 0,
      skipped_duplicate: 0,
      total: inputs.length,
      details: [],
    };
  }
}
