/**
 * Import accounts from SD_Account_Master.xlsx into Supabase accounts table.
 *
 * Usage: node scripts/import-accounts.mjs
 *
 * Reads both "System-Level Accounts" and "Industrial & Other" tabs,
 * deduplicates by company_name, maps Category → company_type,
 * detects country from Location, and inserts into Supabase.
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Supabase client (reads from .env.local)
// ---------------------------------------------------------------------------
import { config } from "dotenv";
config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key);

// ---------------------------------------------------------------------------
// Category → company_type mapping
// Valid company_type values:
//   hyperscaler, oem, system_integrator, datacenter_operator, colo_provider,
//   private_cloud_provider, ai_infrastructure_provider, storage_vendor,
//   rugged_computing_vendor, enterprise_end_user, bank_financial,
//   gov_edu, reseller, other
// ---------------------------------------------------------------------------
const CATEGORY_MAP = {
  "AI Cloud / GPU Cloud": "ai_infrastructure_provider",
  "Cloud / Hosting": "private_cloud_provider",
  "Crypto / HPC Mining": "enterprise_end_user",
  "Data Center Infrastructure": "datacenter_operator",
  "Defense / Aerospace / Gov": "gov_edu",
  "Finance / HFT": "bank_financial",
  "GPU Server Builder": "oem",
  "Hyperscaler / Big Tech": "hyperscaler",
  "Networking / Telecom": "enterprise_end_user",
  "Semiconductor": "oem",
  "Server OEM / ODM": "oem",
  "System Integrator / VAR": "system_integrator",
  "Industrial / HVAC / Auto / Medical": "enterprise_end_user",
  "Unclassified": "other",
};

// ---------------------------------------------------------------------------
// Category → industry label (human-readable)
// ---------------------------------------------------------------------------
const INDUSTRY_MAP = {
  "AI Cloud / GPU Cloud": "AI / GPU Cloud",
  "Cloud / Hosting": "Cloud / Hosting",
  "Crypto / HPC Mining": "Crypto / HPC Mining",
  "Data Center Infrastructure": "Data Center Infrastructure",
  "Defense / Aerospace / Gov": "Defense / Aerospace / Government",
  "Finance / HFT": "Finance / HFT",
  "GPU Server Builder": "GPU Server Manufacturing",
  "Hyperscaler / Big Tech": "Hyperscaler / Big Tech",
  "Networking / Telecom": "Networking / Telecom",
  "Semiconductor": "Semiconductor",
  "Server OEM / ODM": "Server OEM / ODM",
  "System Integrator / VAR": "System Integrator / VAR",
  "Industrial / HVAC / Auto / Medical": "Industrial / Manufacturing",
  "Unclassified": null,
};

// ---------------------------------------------------------------------------
// Category → hardware_categories hints
// ---------------------------------------------------------------------------
const HARDWARE_MAP = {
  "AI Cloud / GPU Cloud": ["gpu", "server", "memory", "networking"],
  "Cloud / Hosting": ["server", "storage", "networking"],
  "Crypto / HPC Mining": ["gpu", "server"],
  "Data Center Infrastructure": ["server", "storage", "networking"],
  "Defense / Aerospace / Gov": ["server", "storage"],
  "Finance / HFT": ["server", "networking", "memory"],
  "GPU Server Builder": ["gpu", "server", "memory"],
  "Hyperscaler / Big Tech": ["server", "storage", "networking", "gpu", "memory"],
  "Networking / Telecom": ["networking"],
  "Semiconductor": [],
  "Server OEM / ODM": ["server", "memory", "storage"],
  "System Integrator / VAR": ["server", "storage", "networking"],
  "Industrial / HVAC / Auto / Medical": [],
  "Unclassified": [],
};

// ---------------------------------------------------------------------------
// US state abbreviations
// ---------------------------------------------------------------------------
const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

const US_FULL_STATES = new Set([
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming",
]);

// Canadian provinces
const CA_PROVINCES = new Set(["QC","ON","BC","AB","SK","MB","NB","NS","PE","NL","NT","YT","NU"]);

function detectCountry(location) {
  if (!location) return "United States"; // default
  const loc = location.trim();
  if (loc === "Not listed" || loc === "Location not set" || loc === "") return "United States";

  // Explicit country suffixes
  if (loc.includes("USA") || loc.includes("U.S.")) return "United States";
  if (loc.includes("Canada")) return "Canada";
  if (loc.includes("Mexico")) return "Mexico";
  if (loc.includes("Malaysia")) return "Malaysia";
  if (loc.includes("Singapore")) return "Singapore";
  if (loc.includes("Ireland")) return "Ireland";
  if (loc.includes("India")) return "India";
  if (loc.includes("Portugal")) return "Portugal";
  if (loc.includes("Sweden")) return "Sweden";
  if (loc.includes("Shanghai") || loc.includes("China")) return "China";

  // Check last part: "City, ST" pattern
  const parts = loc.split(",").map(p => p.trim());
  const lastPart = parts[parts.length - 1];

  // US state abbreviation as last part
  if (US_STATES.has(lastPart)) return "United States";
  // US full state name
  if (US_FULL_STATES.has(lastPart)) return "United States";
  // Canadian province
  if (CA_PROVINCES.has(lastPart)) return "Canada";

  // Mexican state patterns (Nuevo León, Baja California, Chihuahua, etc.)
  const mexicanStates = [
    "Nuevo León", "Baja California", "Chihuahua", "Querétaro",
    "Tamaulipas", "Sonora", "Jalisco", "San Luis Potosí",
  ];
  for (const state of mexicanStates) {
    if (loc.includes(state)) return "Mexico";
  }

  // "City, ST" where ST is 2 letters — likely US
  if (parts.length >= 2) {
    const stateCandidate = parts[parts.length - 1];
    if (stateCandidate.length === 2 && /^[A-Z]{2}$/.test(stateCandidate) && US_STATES.has(stateCandidate)) {
      return "United States";
    }
  }

  // Quebec city names without province tag
  if (loc.includes("Quebec") || loc.includes("Québec")) return "Canada";
  if (loc.includes("Alberta") || loc.includes("Ontario")) return "Canada";

  // Default to US if unrecognized
  return "United States";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const filePath = "/Users/SergioDillon/Downloads/SD_Account_Master.xlsx";
  const wb = XLSX.readFile(filePath);

  // Collect all companies, keyed by normalized company_name for dedup
  const companyMap = new Map(); // normalized_name → { company_name, hq_location, category, source_tab }

  for (const sheetName of ["System-Level Accounts", "Industrial & Other"]) {
    const ws = wb.Sheets[sheetName];
    if (!ws) { console.warn(`Sheet "${sheetName}" not found`); continue; }
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !row[0]) continue;

      const companyName = row[0].toString().trim();
      const location = (row[1] || "").toString().trim();
      const category = (row[2] || "").toString().trim();

      if (!companyName) continue;

      const key = companyName.toLowerCase();

      // Keep first occurrence (dedup by name). If already seen, skip
      // (multiple rows = multiple locations for same company)
      if (!companyMap.has(key)) {
        companyMap.set(key, {
          company_name: companyName,
          hq_location: (location && location !== "Not listed" && location !== "Location not set")
            ? location : null,
          category,
          source_tab: sheetName,
        });
      }
    }
  }

  console.log(`\nParsed ${companyMap.size} unique companies from Excel`);

  // Fetch existing account names for dedup
  const { data: existingAccounts, error: fetchErr } = await supabase
    .from("accounts")
    .select("company_name");
  if (fetchErr) {
    console.error("Failed to fetch existing accounts:", fetchErr);
    process.exit(1);
  }

  const existingNames = new Set(
    (existingAccounts || []).map(a => a.company_name.toLowerCase().trim())
  );
  console.log(`Existing accounts in DB: ${existingNames.size}`);

  // Build insert rows
  const toInsert = [];
  let skippedDuplicate = 0;
  let skippedNoName = 0;
  const countryBreakdown = {};

  for (const [key, co] of companyMap) {
    if (existingNames.has(key)) {
      skippedDuplicate++;
      continue;
    }

    const country = detectCountry(co.hq_location);
    countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;

    const companyType = CATEGORY_MAP[co.category] || "other";
    const industry = INDUSTRY_MAP[co.category] || null;
    const hardwareCategories = HARDWARE_MAP[co.category] || [];

    toInsert.push({
      company_name: co.company_name,
      hq_location: co.hq_location,
      country,
      company_type: companyType,
      industry,
      hardware_categories: hardwareCategories,
      status: "active",
      direct_buy_likelihood: "unknown",
      infra_ownership_verdict: "unknown",
      evidence_strength: "none",
      notes: `Imported from SD_Account_Master.xlsx [${co.source_tab}] — Category: ${co.category || "none"}`,
    });
  }

  console.log(`\nTo insert: ${toInsert.length}`);
  console.log(`Skipped (duplicate in DB): ${skippedDuplicate}`);
  console.log(`Country breakdown:`, countryBreakdown);

  if (toInsert.length === 0) {
    console.log("\nNothing to insert. Done.");
    return;
  }

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("accounts")
      .insert(batch)
      .select("id");

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      // Try one by one
      for (const row of batch) {
        const { error: singleErr } = await supabase
          .from("accounts")
          .insert(row)
          .select("id");
        if (singleErr) {
          failed++;
          errors.push({ company: row.company_name, error: singleErr.message });
        } else {
          inserted++;
        }
      }
    } else {
      inserted += (data || batch).length;
    }
  }

  console.log(`\n========== RESULTS ==========`);
  console.log(`Total unique companies in Excel: ${companyMap.size}`);
  console.log(`Already in DB (skipped):         ${skippedDuplicate}`);
  console.log(`Successfully inserted:           ${inserted}`);
  console.log(`Failed to insert:                ${failed}`);
  if (errors.length > 0) {
    console.log(`\nFailed rows:`);
    for (const e of errors) {
      console.log(`  ${e.company}: ${e.error}`);
    }
  }

  // Verify final count
  const { count } = await supabase
    .from("accounts")
    .select("*", { count: "exact", head: true });
  console.log(`\nTotal accounts in DB now: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });
