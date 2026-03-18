/**
 * Seed account_hardware_prefs for all accounts based on company_type.
 * Skips accounts that already have a row. Idempotent.
 *
 * Usage: node scripts/seed-hardware-prefs.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PREFS_BY_TYPE = {
  ai_infrastructure_provider: {
    buys_cpus: true, buys_gpus: true, buys_memory: true, buys_ssds: false,
    buys_networking: true, buys_systems: true, buys_frus: true,
    cpu_ecosystem: ["amd", "intel"], gpu_ecosystem: ["nvidia"],
    platforms: ["supermicro", "dell", "hpe"],
    account_type: "ai_cloud",
  },
  oem: {
    buys_cpus: true, buys_gpus: true, buys_memory: true, buys_ssds: true,
    buys_networking: true, buys_systems: true, buys_frus: false,
    cpu_ecosystem: ["amd", "intel"], gpu_ecosystem: ["nvidia"],
    platforms: ["supermicro", "dell", "hpe"],
    account_type: "oem_odm",
  },
  system_integrator: {
    buys_cpus: true, buys_gpus: true, buys_memory: true, buys_ssds: true,
    buys_networking: true, buys_systems: true, buys_frus: true,
    cpu_ecosystem: ["amd", "intel"], gpu_ecosystem: ["nvidia"],
    platforms: ["supermicro", "dell", "hpe"],
    account_type: "system_integrator",
  },
  private_cloud_provider: {
    buys_cpus: true, buys_gpus: true, buys_memory: true, buys_ssds: true,
    buys_networking: true, buys_systems: true, buys_frus: true,
    cpu_ecosystem: ["amd", "intel"], gpu_ecosystem: ["nvidia"],
    platforms: ["supermicro", "dell", "hpe"],
    account_type: "cloud_hosting",
  },
  bank_financial: {
    buys_cpus: true, buys_gpus: true, buys_memory: true, buys_ssds: false,
    buys_networking: true, buys_systems: false, buys_frus: false,
    cpu_ecosystem: ["intel", "amd"], gpu_ecosystem: ["nvidia"],
    platforms: ["dell", "hpe", "supermicro"],
    account_type: "finance_hft",
  },
  hyperscaler: {
    buys_cpus: true, buys_gpus: true, buys_memory: true, buys_ssds: true,
    buys_networking: true, buys_systems: false, buys_frus: false,
    cpu_ecosystem: ["amd", "intel"], gpu_ecosystem: ["nvidia"],
    platforms: ["custom"],
    account_type: "hyperscaler",
  },
  datacenter_operator: {
    buys_cpus: false, buys_gpus: false, buys_memory: false, buys_ssds: false,
    buys_networking: true, buys_systems: true, buys_frus: true,
    cpu_ecosystem: [], gpu_ecosystem: [],
    platforms: ["dell", "hpe", "supermicro"],
    account_type: "colocation",
  },
  gov_edu: {
    buys_cpus: true, buys_gpus: true, buys_memory: true, buys_ssds: false,
    buys_networking: false, buys_systems: true, buys_frus: false,
    cpu_ecosystem: ["intel", "amd"], gpu_ecosystem: ["nvidia"],
    platforms: ["dell", "hpe"],
    account_type: "defense",
  },
  enterprise_end_user: {
    buys_cpus: true, buys_gpus: false, buys_memory: true, buys_ssds: true,
    buys_networking: false, buys_systems: false, buys_frus: false,
    cpu_ecosystem: ["intel"], gpu_ecosystem: [],
    platforms: ["dell", "hpe"],
    account_type: "var",
  },
};

async function main() {
  // Fetch all accounts
  const { data: accounts, error: aErr } = await sb
    .from("accounts")
    .select("id, company_name, company_type");
  if (aErr) { console.error("Failed to fetch accounts:", aErr); process.exit(1); }

  // Fetch existing prefs to skip
  const { data: existing, error: eErr } = await sb
    .from("account_hardware_prefs")
    .select("account_id");
  if (eErr) { console.error("Failed to fetch existing prefs:", eErr); process.exit(1); }

  const existingIds = new Set((existing ?? []).map(r => r.account_id));
  console.log(`Accounts: ${accounts.length}`);
  console.log(`Already have prefs: ${existingIds.size}`);

  const toInsert = [];
  const typeBreakdown = {};
  let skipped = 0;
  let noMapping = 0;

  for (const acct of accounts) {
    if (existingIds.has(acct.id)) { skipped++; continue; }

    const mapping = PREFS_BY_TYPE[acct.company_type];
    if (!mapping) {
      noMapping++;
      continue;
    }

    typeBreakdown[acct.company_type] = (typeBreakdown[acct.company_type] || 0) + 1;

    toInsert.push({
      account_id: acct.id,
      ...mapping,
    });
  }

  console.log(`\nSkipped (already have prefs): ${skipped}`);
  console.log(`No mapping for company_type: ${noMapping}`);
  console.log(`To insert: ${toInsert.length}`);
  console.log(`Type breakdown:`, typeBreakdown);

  if (toInsert.length === 0) {
    console.log("\nNothing to insert.");
    return;
  }

  // Insert in batches of 50
  let inserted = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < toInsert.length; i += 50) {
    const batch = toInsert.slice(i, i + 50);
    const { error } = await sb.from("account_hardware_prefs").insert(batch);
    if (error) {
      // Fallback: insert one by one
      for (const row of batch) {
        const { error: sErr } = await sb.from("account_hardware_prefs").insert(row);
        if (sErr) { failed++; errors.push(sErr.message); }
        else { inserted++; }
      }
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\n========== RESULTS ==========`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Failed:   ${failed}`);
  if (errors.length) console.log(`Errors:`, [...new Set(errors)]);

  const { count } = await sb
    .from("account_hardware_prefs")
    .select("*", { count: "exact", head: true });
  console.log(`\nTotal account_hardware_prefs rows: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
