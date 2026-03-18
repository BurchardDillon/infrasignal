import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Account Discovery Agent — uses Claude Haiku for fast company listing,
// then optional per-company web verification with Sonnet.
// ---------------------------------------------------------------------------

const DISCOVERY_MODEL = "claude-haiku-4-5-20251001";

function getAnthropicClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not defined. Set it in environment variables."
    );
  }
  return new Anthropic({ apiKey: key, maxRetries: 1, timeout: 30_000 });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveryCompany {
  company_name: string;
  city: string;
  state: string;
  what_they_do: string;
  company_size: "small" | "medium" | "large";
  likely_needs: string[];
  existing_account_id: string | null;
  previously_discovered: boolean;
  verified: boolean;
  verification_evidence: string | null;
  verification_url: string | null;
}

export interface DiscoveryResult {
  search_type: string;
  state: string;
  companies: DiscoveryCompany[];
  new_count: number;
  existing_count: number;
  previously_discovered_count: number;
  total_discovered_in_category: number;
}

// ---------------------------------------------------------------------------
// Search category definitions
// ---------------------------------------------------------------------------

export const SEARCH_CATEGORIES: Record<
  string,
  { label: string; description: string }
> = {
  ai_gpu_cloud: {
    label: "AI / GPU Cloud",
    description:
      "Companies building AI/GPU cloud infrastructure, deploying NVIDIA GPU clusters, GPU-as-a-service",
  },
  hpc_integrators: {
    label: "HPC Integrators",
    description:
      "HPC system integrators, custom server builders, Supermicro/Dell/HPE solution sellers",
  },
  data_center_buildouts: {
    label: "Data Center Buildouts",
    description:
      "Companies building new data centers, expanding server infrastructure",
  },
  defense_hpc: {
    label: "Defense / HPC",
    description:
      "Defense contractors and national labs procuring HPC/AI compute",
  },
  finance_hft: {
    label: "Finance / HFT",
    description:
      "Financial firms, hedge funds, HFT shops with trading infrastructure",
  },
  server_component_buyers: {
    label: "Server Component Buyers",
    description:
      "Companies buying CPUs, GPUs, memory, SSDs from independent distributors",
  },
  supermicro_customers: {
    label: "Supermicro Customers",
    description: "Companies deploying or purchasing Supermicro servers",
  },
  amd_epyc_deployments: {
    label: "AMD EPYC Deployments",
    description: "Companies deploying AMD EPYC processors in data centers",
  },
  nvidia_gpu_deployments: {
    label: "NVIDIA GPU Deployments",
    description: "Companies deploying NVIDIA H100/H200/B200/L40S GPUs",
  },
  repair_refurb_houses: {
    label: "Repair / Refurb Houses",
    description:
      "Server repair shops, refurb companies, ITAD, hardware recyclers, board-level repair depots",
  },
  managed_service_providers: {
    label: "Managed Service Providers",
    description:
      "MSPs, managed hosting companies, IT service providers with server fleets",
  },
  colocation_bare_metal: {
    label: "Colocation / Bare Metal",
    description:
      "Colocation providers, bare metal hosting, dedicated server providers",
  },
};

export const US_STATES: { code: string; name: string }[] = [
  { code: "ALL", name: "All US" },
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

// ---------------------------------------------------------------------------
// Fetch all known company names (accounts + discovery_log)
// ---------------------------------------------------------------------------

async function fetchKnownCompanyNames(searchType: string): Promise<string[]> {
  const known = new Set<string>();

  // From accounts table
  const { data: accounts } = await supabase
    .from("accounts")
    .select("company_name");
  if (accounts) {
    for (const a of accounts as unknown as Array<{ company_name: string }>) {
      known.add(a.company_name);
    }
  }

  // From discovery_log for this search type
  try {
    const { data: logs } = await supabase
      .from("discovery_log")
      .select("company_name")
      .eq("search_type", searchType);
    if (logs) {
      for (const l of logs as unknown as Array<{ company_name: string }>) {
        known.add(l.company_name);
      }
    }
  } catch {
    // Table may not exist
  }

  return Array.from(known);
}

// ---------------------------------------------------------------------------
// Main search — Haiku, 5 companies, fast
// ---------------------------------------------------------------------------

export async function runAccountDiscoverySearch(
  searchType: string,
  stateCode: string = "ALL"
): Promise<DiscoveryResult> {
  const category = SEARCH_CATEGORIES[searchType];
  if (!category) throw new Error(`Unknown search category: ${searchType}`);

  const stateName =
    stateCode === "ALL"
      ? "anywhere in the United States"
      : US_STATES.find((s) => s.code === stateCode)?.name || stateCode;

  console.log(`[discovery] Starting: ${searchType} in ${stateName}`);
  console.log(`[discovery] ${Date.now()} — fetching known companies...`);

  // Fetch ALL known companies to exclude from prompt
  const knownNames = await fetchKnownCompanyNames(searchType);

  console.log(`[discovery] ${Date.now()} — ${knownNames.length} known companies fetched`);

  // Build exclusion list (limit to 200 to keep prompt reasonable)
  const exclusionList = knownNames.slice(0, 200).join(", ");
  const exclusionClause = knownNames.length > 0
    ? `\n\nDo NOT include any of these companies, they are already known:\n${exclusionList}\n\nFind 5 NEW companies that are NOT on this list.`
    : "";

  const anthropic = getAnthropicClient();

  const prompt = `List 5 real companies ${stateCode === "ALL" ? "in the United States" : `in ${stateName}`} that match this profile:

"${category.description}"

Include companies of ALL sizes — small local shops (5-50 employees), mid-market (50-500), and large (500+). Small companies are the BEST customers.${exclusionClause}

Return ONLY a JSON array, no other text:
[{"company_name":"string","city":"string","state":"XX","what_they_do":"brief description","company_size":"small|medium|large","likely_needs":["cpus","gpus","memory","ssds","networking","systems","frus"]}]`;

  console.log(`[discovery] ${Date.now()} — calling Haiku API...`);
  const startTime = Date.now();

  const response = await anthropic.messages.create({
    model: DISCOVERY_MODEL,
    max_tokens: 1024,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  console.log(`[discovery] ${Date.now()} — API responded in ${Date.now() - startTime}ms`);

  const textBlock = response.content.find((b) => b.type === "text");
  const rawText = textBlock && "text" in textBlock ? textBlock.text : "[]";

  let parsed: Array<{
    company_name: string;
    city: string;
    state: string;
    what_they_do: string;
    company_size: string;
    likely_needs: string[];
  }> = [];

  try {
    const cleaned = rawText.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error("[discovery] JSON parse error:", e);
    console.error("[discovery] Raw text:", rawText.slice(0, 500));
    parsed = [];
  }

  // Cross-reference with existing accounts
  const { data: accountRows } = await supabase
    .from("accounts")
    .select("id, company_name");

  const acctMap = new Map<string, string>();
  const acctNormalizedMap = new Map<string, string>();
  if (accountRows) {
    for (const a of accountRows as unknown as Array<{ id: string; company_name: string }>) {
      acctMap.set(a.company_name.toLowerCase().trim(), a.id);
      acctNormalizedMap.set(normalizeForMatch(a.company_name), a.id);
    }
  }

  // Check previously discovered
  const previouslyDiscovered = new Set<string>();
  try {
    const { data: logs } = await supabase
      .from("discovery_log")
      .select("company_name")
      .eq("search_type", searchType);
    if (logs) {
      for (const l of logs as unknown as Array<{ company_name: string }>) {
        previouslyDiscovered.add(normalizeForMatch(l.company_name));
      }
    }
  } catch { /* table may not exist */ }

  const companies: DiscoveryCompany[] = parsed.map((p) => {
    const lower = p.company_name.toLowerCase().trim();
    const normalized = normalizeForMatch(p.company_name);

    let existingId = acctMap.get(lower) ?? acctNormalizedMap.get(normalized) ?? null;
    if (!existingId) {
      for (const [acctName, acctId] of acctMap.entries()) {
        if (lower.includes(acctName) || acctName.includes(lower)) {
          existingId = acctId;
          break;
        }
      }
    }

    const size = (["small", "medium", "large"].includes(p.company_size)
      ? p.company_size
      : "medium") as "small" | "medium" | "large";

    return {
      company_name: p.company_name,
      city: p.city || "Unknown",
      state: p.state || stateCode,
      what_they_do: p.what_they_do || "",
      company_size: size,
      likely_needs: p.likely_needs || [],
      existing_account_id: existingId,
      previously_discovered: previouslyDiscovered.has(normalized),
      verified: false,
      verification_evidence: null,
      verification_url: null,
    };
  });

  // Get total discovered count for this category
  let totalDiscoveredInCategory = knownNames.length;
  try {
    const { count } = await supabase
      .from("discovery_log")
      .select("id", { count: "exact", head: true })
      .eq("search_type", searchType);
    if (count !== null) totalDiscoveredInCategory = count;
  } catch { /* table may not exist */ }

  console.log(
    `[discovery] Done: ${companies.length} companies in ${Date.now() - startTime}ms total`
  );

  return {
    search_type: searchType,
    state: stateCode,
    companies,
    new_count: companies.filter((c) => !c.existing_account_id && !c.previously_discovered).length,
    existing_count: companies.filter((c) => c.existing_account_id).length,
    previously_discovered_count: companies.filter((c) => c.previously_discovered && !c.existing_account_id).length,
    total_discovered_in_category: totalDiscoveredInCategory,
  };
}

// ---------------------------------------------------------------------------
// Verify a single company with web search (Sonnet — stays on Sonnet)
// ---------------------------------------------------------------------------

export async function verifyCompanyWithWebSearch(
  companyName: string,
  whatTheyDo: string
): Promise<{ evidence: string; url: string | null; verified: boolean }> {
  console.log(`[discovery] ${Date.now()} — verifying: ${companyName}`);
  const anthropic = getAnthropicClient();

  const prompt = `Search the web to verify that "${companyName}" is a real, operating company that ${whatTheyDo}. Find their website, any recent news, or evidence they exist and are active. Provide:
1. A brief summary of evidence found (1-2 sentences)
2. The most relevant URL

Reply in this EXACT format:
EVIDENCE: [summary]
URL: [url or "none"]
VERIFIED: [yes/no]`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [
      { type: "web_search_20250305" as const, name: "web_search" },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  let finalResponse = response;
  if (finalResponse.stop_reason === "pause_turn") {
    finalResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: [
        { type: "web_search_20250305" as const, name: "web_search" },
      ],
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: finalResponse.content },
      ],
    });
  }

  const textBlock = finalResponse.content.find((b) => b.type === "text");
  const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

  const evidenceMatch = rawText.match(/EVIDENCE:\s*(.+)/i);
  const urlMatch = rawText.match(/URL:\s*(.+)/i);
  const verifiedMatch = rawText.match(/VERIFIED:\s*(.+)/i);

  const url = urlMatch?.[1]?.trim();

  console.log(`[discovery] ${Date.now()} — verify done for ${companyName}`);

  return {
    evidence: evidenceMatch?.[1]?.trim() || "No evidence found",
    url: url && url.toLowerCase() !== "none" ? url : null,
    verified: verifiedMatch?.[1]?.trim().toLowerCase() === "yes",
  };
}

// ---------------------------------------------------------------------------
// Find similar companies — Haiku, 5 companies, fast
// ---------------------------------------------------------------------------

export async function findSimilarCompanies(
  companyName: string,
  whatTheyDo: string
): Promise<DiscoveryCompany[]> {
  console.log(`[discovery] ${Date.now()} — finding similar to: ${companyName}`);
  const anthropic = getAnthropicClient();

  const prompt = `List 5 US companies similar to "${companyName}" which ${whatTheyDo}. Include competitors and companies in the same niche. Include small, medium, and large businesses.

Return ONLY a JSON array, no other text:
[{"company_name":"string","city":"string","state":"XX","what_they_do":"brief description","company_size":"small|medium|large","likely_needs":["cpus","gpus","memory","ssds","networking","systems","frus"]}]`;

  const startTime = Date.now();
  const response = await anthropic.messages.create({
    model: DISCOVERY_MODEL,
    max_tokens: 1024,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  console.log(`[discovery] ${Date.now()} — similar API responded in ${Date.now() - startTime}ms`);

  const textBlock = response.content.find((b) => b.type === "text");
  const rawText = textBlock && "text" in textBlock ? textBlock.text : "[]";

  let parsed: Array<{
    company_name: string;
    city: string;
    state: string;
    what_they_do: string;
    company_size: string;
    likely_needs: string[];
  }> = [];

  try {
    const cleaned = rawText.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = [];
  }

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, company_name");

  const acctMap = new Map<string, string>();
  if (accounts) {
    for (const a of accounts as unknown as Array<{ id: string; company_name: string }>) {
      acctMap.set(a.company_name.toLowerCase().trim(), a.id);
    }
  }

  return parsed.map((p) => {
    const lower = p.company_name.toLowerCase().trim();
    let existingId = acctMap.get(lower) ?? null;
    if (!existingId) {
      for (const [acctName, acctId] of acctMap.entries()) {
        if (lower.includes(acctName) || acctName.includes(lower)) {
          existingId = acctId;
          break;
        }
      }
    }

    return {
      company_name: p.company_name,
      city: p.city || "Unknown",
      state: p.state || "US",
      what_they_do: p.what_they_do || "",
      company_size: (["small", "medium", "large"].includes(p.company_size)
        ? p.company_size
        : "medium") as "small" | "medium" | "large",
      likely_needs: p.likely_needs || [],
      existing_account_id: existingId,
      previously_discovered: false,
      verified: false,
      verification_evidence: null,
      verification_url: null,
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(inc|corp|llc|ltd|gmbh|ag|sa|plc|co)$/, "");
}

export function searchCategoryToCompanyType(searchType: string): string {
  const map: Record<string, string> = {
    ai_gpu_cloud: "ai_infrastructure_provider",
    hpc_integrators: "system_integrator",
    data_center_buildouts: "datacenter_operator",
    defense_hpc: "gov_edu",
    finance_hft: "bank_financial",
    server_component_buyers: "enterprise_end_user",
    supermicro_customers: "enterprise_end_user",
    amd_epyc_deployments: "enterprise_end_user",
    nvidia_gpu_deployments: "ai_infrastructure_provider",
    repair_refurb_houses: "repair_refurb",
    managed_service_providers: "msp",
    colocation_bare_metal: "colo_bare_metal",
  };
  return map[searchType] || "other";
}

export function buildHardwarePrefsFromNeeds(needs: string[]) {
  const lower = needs.map((n) => n.toLowerCase());
  return {
    buys_cpus: lower.includes("cpus"),
    buys_gpus: lower.includes("gpus"),
    buys_memory: lower.includes("memory"),
    buys_ssds: lower.includes("ssds"),
    buys_networking: lower.includes("networking"),
    buys_systems: lower.includes("systems"),
    buys_frus: lower.includes("frus"),
  };
}

// ---------------------------------------------------------------------------
// Log discovered companies to discovery_log
// ---------------------------------------------------------------------------

export async function logDiscoveredCompanies(
  companies: DiscoveryCompany[],
  searchType: string,
  stateCode: string,
  jobRunId: string | null
): Promise<void> {
  if (companies.length === 0) return;
  try {
    const rows = companies.map((c) => ({
      company_name: c.company_name,
      search_type: searchType,
      state: stateCode,
      added_to_accounts: !!c.existing_account_id,
      job_run_id: jobRunId,
    }));

    await supabase
      .from("discovery_log")
      .upsert(rows as never[], { onConflict: "company_name,search_type" });
  } catch {
    console.log("[discovery] Could not log to discovery_log (table may not exist)");
  }
}

// ---------------------------------------------------------------------------
// Get discovery counts per category
// ---------------------------------------------------------------------------

export async function getDiscoveryCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  try {
    for (const key of Object.keys(SEARCH_CATEGORIES)) {
      const { count } = await supabase
        .from("discovery_log")
        .select("id", { count: "exact", head: true })
        .eq("search_type", key);
      counts[key] = count ?? 0;
    }
  } catch {
    // Table may not exist
  }
  return counts;
}

export async function getSearchedStates(
  searchType: string
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("discovery_log")
      .select("state")
      .eq("search_type", searchType);
    if (!data) return [];
    const states = new Set<string>();
    for (const row of data as unknown as Array<{ state: string | null }>) {
      if (row.state) states.add(row.state);
    }
    return Array.from(states);
  } catch {
    return [];
  }
}
