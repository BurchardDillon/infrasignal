"use server";

import { revalidatePath } from "next/cache";
import { runDiscoveryAgent } from "@/lib/agents/discovery-agent";
import { parseCsv } from "@/lib/engine/parse-csv";
import { parsePastedList } from "@/lib/engine/parse-pasted-list";
import { SEED_COMPANIES } from "@/lib/data/seed-companies";
import {
  upsertDiscoverySource,
  updateDiscoverySourceRunStatus,
  fetchLatestJobRunId,
  fetchProspectDomains,
  fetchAccountDomains,
  fetchAccountCompanyNames,
} from "@/lib/supabase/queries";
import type {
  CompanyDiscoveryInput,
  DiscoveryAgentResult,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSourceKey(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${date}_${rand}`;
}

/**
 * Normalize seed company entries into CompanyDiscoveryInput[].
 * Seed data uses `hardware_hints` as a single string; convert to string[].
 */
function normalizeSeedCompanies(): CompanyDiscoveryInput[] {
  return SEED_COMPANIES.map((s) => ({
    company_name: s.company_name,
    domain: s.domain ?? null,
    country: s.country,
    hq_location: s.hq_location ?? null,
    industry: s.industry ?? null,
    hardware_hints: s.hardware_hints
      ? [s.hardware_hints]
      : [],
    notes: s.notes ?? null,
    source: s.source as CompanyDiscoveryInput["source"],
  }));
}

/** Link a discovery source to the most recent discovery job_run. */
async function linkSourceToLatestJob(sourceId: string): Promise<void> {
  const jobId = await fetchLatestJobRunId("discovery");
  if (jobId) {
    await updateDiscoverySourceRunStatus(sourceId, jobId);
  }
}

function revalidateDiscoveryPaths(): void {
  revalidatePath("/admin/discovery");
  revalidatePath("/admin/agents");
  revalidatePath("/prospecting");
}

// ---------------------------------------------------------------------------
// CSV Discovery
// ---------------------------------------------------------------------------

export async function runCsvDiscovery(
  csvText: string,
  name: string
): Promise<DiscoveryAgentResult> {
  const parseResult = parseCsv(csvText);

  if (parseResult.companies.length === 0) {
    return {
      success: false,
      error: `No valid companies found in CSV. ${parseResult.errors.length} errors, ${parseResult.skipped} skipped.`,
      created: 0,
      skipped_non_us: 0,
      skipped_duplicate: 0,
      total: 0,
      details: [],
    };
  }

  // Create discovery source record before processing
  const sourceKey = generateSourceKey("csv");
  const sourceId = await upsertDiscoverySource({
    name: name || `CSV Upload ${new Date().toISOString().slice(0, 10)}`,
    source_type: "csv_upload",
    source_key: sourceKey,
    record_count: parseResult.companies.length,
    notes: parseResult.errors.length > 0
      ? `${parseResult.errors.length} parse errors, ${parseResult.skipped} skipped`
      : null,
  });

  // Delegate to discovery agent
  const result = await runDiscoveryAgent(parseResult.companies);

  // Update source with run status — link to the job_run created by runDiscoveryAgent
  await linkSourceToLatestJob(sourceId);

  revalidateDiscoveryPaths();
  return result;
}

// ---------------------------------------------------------------------------
// Pasted List Discovery
// ---------------------------------------------------------------------------

export async function runPastedListDiscovery(
  text: string,
  name: string
): Promise<DiscoveryAgentResult> {
  const parseResult = parsePastedList(text);

  if (parseResult.companies.length === 0) {
    return {
      success: false,
      error: `No valid companies found in pasted text. ${parseResult.errors.length} errors, ${parseResult.skipped} skipped.`,
      created: 0,
      skipped_non_us: 0,
      skipped_duplicate: 0,
      total: 0,
      details: [],
    };
  }

  // Create discovery source record before processing
  const sourceKey = generateSourceKey("paste");
  const sourceId = await upsertDiscoverySource({
    name: name || `Pasted List ${new Date().toISOString().slice(0, 10)}`,
    source_type: "pasted_list",
    source_key: sourceKey,
    record_count: parseResult.companies.length,
    notes: parseResult.errors.length > 0
      ? `${parseResult.errors.length} parse errors, ${parseResult.skipped} skipped`
      : null,
  });

  // Delegate to discovery agent
  const result = await runDiscoveryAgent(parseResult.companies);

  // Update source with run status — link to the job_run created by runDiscoveryAgent
  await linkSourceToLatestJob(sourceId);

  revalidateDiscoveryPaths();
  return result;
}

// ---------------------------------------------------------------------------
// Seed Expansion
// ---------------------------------------------------------------------------

export async function runSeedExpansion(): Promise<DiscoveryAgentResult> {
  const companies = normalizeSeedCompanies();

  // Upsert seed expansion source (always same source_key)
  const sourceId = await upsertDiscoverySource({
    name: "Curated Seed Companies",
    source_type: "seed_expansion",
    source_key: "seed_expansion_v1",
    record_count: companies.length,
    notes: `${companies.length} curated US infrastructure companies`,
  });

  // Delegate to discovery agent
  const result = await runDiscoveryAgent(companies);

  // Update source with run status — link to the job_run created by runDiscoveryAgent
  await linkSourceToLatestJob(sourceId);

  revalidateDiscoveryPaths();
  return result;
}

// ---------------------------------------------------------------------------
// Seed Expansion Stats (for UI display)
// ---------------------------------------------------------------------------

export async function getSeedExpansionStats(): Promise<{
  total: number;
  already_in_system: number;
  net_new: number;
}> {
  const companies = normalizeSeedCompanies();

  const [prospectDomains, accountDomains, accountNames] = await Promise.all([
    fetchProspectDomains(),
    fetchAccountDomains(),
    fetchAccountCompanyNames(),
  ]);

  let alreadyInSystem = 0;

  for (const company of companies) {
    const normalizedDomain = company.domain
      ? company.domain
          .toLowerCase()
          .trim()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/+$/, "")
      : null;

    const normalizedName = company.company_name.toLowerCase().trim();

    // Check domain match against prospects and accounts
    if (normalizedDomain) {
      if (
        prospectDomains.has(normalizedDomain) ||
        accountDomains.has(normalizedDomain)
      ) {
        alreadyInSystem++;
        continue;
      }
    }

    // Check name match against accounts
    if (accountNames.has(normalizedName)) {
      alreadyInSystem++;
      continue;
    }
  }

  return {
    total: companies.length,
    already_in_system: alreadyInSystem,
    net_new: companies.length - alreadyInSystem,
  };
}
