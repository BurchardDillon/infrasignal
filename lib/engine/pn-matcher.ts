import { supabase } from "@/lib/supabase/client";
import type { ComponentLookup, PnMatchResult } from "@/lib/types/pn-lookup";

// ---------------------------------------------------------------------------
// Account type interface for the enriched query
// ---------------------------------------------------------------------------

interface AccountRow {
  id: string;
  company_name: string;
  domain: string | null;
  hq_location: string | null;
  company_type: string;
  direct_buy_likelihood: string;
  evidence_strength: string;
  hardware_categories: string[];
  why_it_matters: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Score accounts for a resolved component
// ---------------------------------------------------------------------------

export async function matchAccountsForComponent(
  component: ComponentLookup
): Promise<PnMatchResult[]> {
  // Fetch accounts with the fields we need for scoring
  const { data: accounts } = await supabase
    .from("accounts")
    .select(
      "id, company_name, domain, hq_location, company_type, direct_buy_likelihood, evidence_strength, hardware_categories, why_it_matters, notes"
    )
    .order("company_name");

  const { data: prefs } = await supabase
    .from("account_hardware_prefs")
    .select("*");

  const { data: deals } = await supabase
    .from("deal_history")
    .select("account_id, part_number, deal_date")
    .order("deal_date", { ascending: false });

  if (!accounts) return [];

  // Build prefs map
  const prefsMap = new Map<
    string,
    {
      cpu_ecosystem: string[];
      gpu_ecosystem: string[];
      platforms: string[];
    }
  >();
  if (prefs) {
    for (const p of prefs) {
      const row = p as unknown as {
        account_id: string;
        cpu_ecosystem: string[];
        gpu_ecosystem: string[];
        platforms: string[];
      };
      prefsMap.set(row.account_id, {
        cpu_ecosystem: row.cpu_ecosystem ?? [],
        gpu_ecosystem: row.gpu_ecosystem ?? [],
        platforms: row.platforms ?? [],
      });
    }
  }

  // Build deal history index
  const dealsByAccount = new Map<
    string,
    { count: number; lastDate: string | null; hasSamePn: boolean }
  >();
  if (deals) {
    for (const d of deals as unknown as Array<{
      account_id: string;
      part_number: string;
      deal_date: string | null;
    }>) {
      const existing = dealsByAccount.get(d.account_id) ?? {
        count: 0,
        lastDate: null,
        hasSamePn: false,
      };
      existing.count++;
      if (!existing.lastDate) existing.lastDate = d.deal_date;
      if (d.part_number === component.part_number) existing.hasSamePn = true;
      dealsByAccount.set(d.account_id, existing);
    }
  }

  const cat = component.category ?? "";
  const eco = component.ecosystem ?? "";
  const mfr = component.manufacturer ?? "";
  const results: PnMatchResult[] = [];

  for (const raw of accounts) {
    const acct = raw as unknown as AccountRow;
    const pref = prefsMap.get(acct.id);
    const hwCats = acct.hardware_categories ?? [];
    const companyType = acct.company_type;

    let score = 0;
    const reasons: string[] = [];

    // ---------------------------------------------------------------
    // 1. Base type match
    // ---------------------------------------------------------------
    const isCpuGpuMem = ["cpu", "gpu", "memory"].includes(cat);
    const isCpuServerMem = ["cpu", "server", "memory"].includes(cat);
    const isServerNetworking = ["server", "networking"].includes(cat);

    const catLabel = cat.toUpperCase();
    const typeLabels: Record<string, string> = {
      ai_infrastructure_provider: "AI infrastructure provider",
      hyperscaler: "Hyperscaler",
      system_integrator: "System integrator",
      oem: "OEM",
      private_cloud_provider: "Private cloud provider",
      datacenter_operator: "Datacenter operator",
      colo_provider: "Colocation provider",
      colo_bare_metal: "Bare metal provider",
    };
    const typeLabel = typeLabels[companyType] || companyType;

    if (
      ["ai_infrastructure_provider", "hyperscaler"].includes(companyType) &&
      isCpuGpuMem
    ) {
      score += 35;
      reasons.push(`${typeLabel} — high priority ${catLabel} buyer`);
    } else if (
      ["system_integrator", "oem"].includes(companyType) &&
      isCpuGpuMem
    ) {
      score += 30;
      reasons.push(`${typeLabel} — builds with ${catLabel} components`);
    } else if (companyType === "private_cloud_provider" && isCpuServerMem) {
      score += 25;
      reasons.push(`${typeLabel} — deploys own ${catLabel} infrastructure`);
    } else if (
      ["datacenter_operator", "colo_provider", "colo_bare_metal"].includes(
        companyType
      ) &&
      isServerNetworking
    ) {
      score += 20;
      reasons.push(`${typeLabel} — operates ${catLabel} infrastructure`);
    }

    // hardware_categories contains the component category — stackable
    if (hwCats.includes(cat)) {
      score += 20;
      reasons.push(`Known ${catLabel} buyer`);
    }

    // Skip enterprise_end_user with empty hardware_categories for core components
    if (
      companyType === "enterprise_end_user" &&
      hwCats.length === 0 &&
      ["cpu", "gpu", "server", "memory"].includes(cat)
    ) {
      continue;
    }

    // ---------------------------------------------------------------
    // 2. Ecosystem match from account_hardware_prefs
    // ---------------------------------------------------------------
    if (pref && eco) {
      const cpuEco = pref.cpu_ecosystem ?? [];
      if (cpuEco.some((e) => e.toLowerCase() === eco.toLowerCase())) {
        score += 20;
        reasons.push(`Confirmed ${eco.toUpperCase()} ecosystem`);
      }

      const platforms = pref.platforms ?? [];
      if (
        mfr &&
        platforms.some((p) => p.toLowerCase() === mfr.toLowerCase())
      ) {
        score += 15;
        reasons.push(`Uses ${mfr} platform`);
      }
    }

    // ---------------------------------------------------------------
    // 3. Direct buy signals
    // ---------------------------------------------------------------
    if (acct.direct_buy_likelihood === "high") {
      score += 15;
      reasons.push("High direct buy likelihood");
    } else if (acct.direct_buy_likelihood === "medium") {
      score += 8;
      reasons.push("Medium direct buy likelihood");
    }

    // ---------------------------------------------------------------
    // 4. Evidence quality
    // ---------------------------------------------------------------
    if (acct.evidence_strength === "strong") {
      score += 10;
      reasons.push("Strong evidence on file");
    } else if (acct.evidence_strength === "moderate") {
      score += 5;
      reasons.push("Moderate evidence on file");
    }

    // ---------------------------------------------------------------
    // 5. Deal history
    // ---------------------------------------------------------------
    const dealInfo = dealsByAccount.get(acct.id);
    if (dealInfo) {
      if (dealInfo.hasSamePn) {
        score += 25;
        reasons.push("Has dealt this exact PN");
      } else if (dealInfo.count > 0) {
        score += 8;
        reasons.push(`${dealInfo.count} prior deals`);
      }
    }

    // ---------------------------------------------------------------
    // Threshold: only include accounts scoring ≥ 20
    // ---------------------------------------------------------------
    if (score < 20) continue;

    results.push({
      account_id: acct.id,
      company_name: acct.company_name,
      domain: acct.domain,
      hq_location: acct.hq_location,
      company_type: acct.company_type,
      direct_buy_likelihood: acct.direct_buy_likelihood,
      evidence_strength: acct.evidence_strength,
      hardware_categories: acct.hardware_categories,
      why_it_matters: acct.why_it_matters,
      notes: acct.notes,
      match_score: score,
      match_reasons: reasons,
      deal_history_count: dealInfo?.count ?? 0,
      last_deal_date: dealInfo?.lastDate ?? null,
      // Not yet researched
      was_researched: false,
      research_summary: null,
      relevance_score: null,
      infra_scale: null,
      expanding: null,
      direct_buy_signal: null,
    });
  }

  results.sort((a, b) => b.match_score - a.match_score);
  return results;
}
