"use server";

import { revalidatePath } from "next/cache";
import { runQualificationAgent } from "@/lib/agents/qualification-agent";

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
// Delegates to the Qualification Agent orchestrator. Preserves the same
// return type so existing admin components continue to work unchanged.
// ---------------------------------------------------------------------------

export async function refreshQualification(): Promise<QualificationRefreshResult> {
  const result = await runQualificationAgent();
  revalidatePath("/accounts");
  revalidatePath("/prospecting");
  revalidatePath("/dashboard");
  return {
    success: result.success,
    error: result.error,
    accountsUpdated: result.accounts_updated,
    accountsTotal: result.accounts_total,
    prospectsUpdated: result.prospects_updated,
    prospectsTotal: result.prospects_total,
  };
}
