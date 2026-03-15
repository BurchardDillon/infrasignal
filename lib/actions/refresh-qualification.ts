"use server";

import { revalidatePath } from "next/cache";
import {
  fetchAccounts,
  fetchEvidence,
  fetchNewsItems,
  fetchProspects,
  updateAccountQualification,
  updateProspectQualification,
} from "@/lib/supabase/queries";
import { qualifyAccount } from "@/lib/engine/qualify-account";
import { qualifyProspect } from "@/lib/engine/qualify-prospect";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface QualificationRefreshResult {
  success: boolean;
  error?: string;
  accountsUpdated: number;
  accountsTotal: number;
  prospectsUpdated: number;
  prospectsTotal: number;
}

// ---------------------------------------------------------------------------
// Server Action: refreshQualification
// ---------------------------------------------------------------------------

export async function refreshQualification(): Promise<QualificationRefreshResult> {
  try {
    // 1. Fetch all data in parallel
    const [accounts, allEvidence, newsItems, prospects] = await Promise.all([
      fetchAccounts(),
      fetchEvidence(),
      fetchNewsItems(),
      fetchProspects(),
    ]);

    // 2. Qualify each account
    let accountsUpdated = 0;

    for (const account of accounts) {
      // Filter evidence and news for this account
      const accountEvidence = allEvidence.filter(
        (e) => e.account_id === account.id
      );
      const accountNews = newsItems.filter(
        (n) =>
          n.account_id === account.id ||
          n.linked_accounts.some((la) => la.account_id === account.id)
      );

      const qual = qualifyAccount(account, accountEvidence, accountNews);

      // Only update if something changed
      const changed =
        qual.direct_buy_likelihood !== account.direct_buy_likelihood ||
        qual.infra_ownership_verdict !== account.infra_ownership_verdict ||
        qual.evidence_strength !== account.evidence_strength ||
        qual.why_it_matters !== account.why_it_matters ||
        qual.negative_signals !== account.negative_signals ||
        JSON.stringify(qual.component_fit) !==
          JSON.stringify(account.component_fit);

      if (changed) {
        await updateAccountQualification(account.id, qual);
        accountsUpdated++;
      }
    }

    // 3. Qualify each prospect
    let prospectsUpdated = 0;

    for (const prospect of prospects) {
      const qual = qualifyProspect(prospect, newsItems);

      const changed =
        qual.proposed_direct_buy_likelihood !==
          prospect.proposed_direct_buy_likelihood ||
        qual.proposed_infra_ownership_verdict !==
          prospect.proposed_infra_ownership_verdict ||
        qual.priority_score !== prospect.priority_score;

      if (changed) {
        await updateProspectQualification(prospect.id, qual);
        prospectsUpdated++;
      }
    }

    // 4. Revalidate affected pages
    revalidatePath("/accounts");
    revalidatePath("/prospecting");
    revalidatePath("/dashboard");

    return {
      success: true,
      accountsUpdated,
      accountsTotal: accounts.length,
      prospectsUpdated,
      prospectsTotal: prospects.length,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
      accountsUpdated: 0,
      accountsTotal: 0,
      prospectsUpdated: 0,
      prospectsTotal: 0,
    };
  }
}
