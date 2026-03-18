import type { QueueAgentResult } from "@/lib/types";
import {
  insertJobRun,
  completeJobRun,
  failJobRun,
  fetchProspects,
  fetchNewsItems,
  updateProspectScore,
} from "@/lib/supabase/queries";
import { computeProspectPriorityScore } from "@/lib/utils/scoring";
import { computeNewsBoost } from "@/lib/engine/news-boost";

// ---------------------------------------------------------------------------
// Queue Agent orchestrator
// ---------------------------------------------------------------------------

export async function runQueueAgent(): Promise<QueueAgentResult> {
  const jobId = await insertJobRun("queue");
  const startTime = Date.now();

  try {
    const [prospects, newsItems] = await Promise.all([
      fetchProspects(),
      fetchNewsItems(),
    ]);

    let updated = 0;

    for (const prospect of prospects) {
      const base = computeProspectPriorityScore(prospect);
      const newsBoost = computeNewsBoost(
        prospect.company_name,
        prospect.hardware_categories,
        newsItems
      );
      const newScore = Math.min(100, base.priority_score + newsBoost);

      if (newScore !== prospect.priority_score) {
        await updateProspectScore(prospect.id, newScore);
        updated++;
      }
    }

    const result: QueueAgentResult = {
      success: true,
      updated,
      total: prospects.length,
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
      updated: 0,
      total: 0,
    };
  }
}
