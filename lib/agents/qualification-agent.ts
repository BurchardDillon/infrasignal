import type { QualificationAgentResult } from "@/lib/types";
import {
  insertJobRun,
  completeJobRun,
  failJobRun,
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
// Qualification Agent orchestrator
// ---------------------------------------------------------------------------

export async function runQualificationAgent(): Promise<QualificationAgentResult> {
  const jobId = await insertJobRun("qualification");
  const startTime = Date.now();

  try {
    const [accounts, allEvidence, newsItems, prospects] = await Promise.all([
      fetchAccounts(),
      fetchEvidence(),
      fetchNewsItems(),
      fetchProspects(),
    ]);

    // Re-qualify each account
    let accountsUpdated = 0;

    for (const account of accounts) {
      const accountEvidence = allEvidence.filter(
        (e) => e.account_id === account.id
      );
      const accountNews = newsItems.filter(
        (n) =>
          n.account_id === account.id ||
          n.linked_accounts.some((la) => la.account_id === account.id)
      );

      const qual = qualifyAccount(account, accountEvidence, accountNews);

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

    // Re-qualify each prospect
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

    const result: QualificationAgentResult = {
      success: true,
      accounts_updated: accountsUpdated,
      accounts_total: accounts.length,
      prospects_updated: prospectsUpdated,
      prospects_total: prospects.length,
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
      accounts_updated: 0,
      accounts_total: 0,
      prospects_updated: 0,
      prospects_total: 0,
    };
  }
}
