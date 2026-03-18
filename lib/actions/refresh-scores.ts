"use server";

import { revalidatePath } from "next/cache";
import { runQueueAgent } from "@/lib/agents/queue-agent";

// ---------------------------------------------------------------------------
// Refresh result type
// ---------------------------------------------------------------------------

export interface RefreshResult {
  success: boolean;
  error?: string;
  updated: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Server Action: refreshProspectScores
// Delegates to the Queue Agent orchestrator. Preserves the same return type
// so existing admin components continue to work unchanged.
// ---------------------------------------------------------------------------

export async function refreshProspectScores(): Promise<RefreshResult> {
  const result = await runQueueAgent();
  revalidatePath("/prospecting");
  revalidatePath("/dashboard");
  return {
    success: result.success,
    error: result.error,
    updated: result.updated,
    total: result.total,
  };
}
