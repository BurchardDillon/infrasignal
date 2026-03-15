"use server";

import { revalidatePath } from "next/cache";
import {
  fetchProspects,
  fetchNewsItems,
  updateProspectScore,
} from "@/lib/supabase/queries";
import { computeProspectPriorityScore } from "@/lib/utils/scoring";
import { computeNewsBoost } from "@/lib/engine/news-boost";

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
// ---------------------------------------------------------------------------

export async function refreshProspectScores(): Promise<RefreshResult> {
  try {
    // 1. Fetch all prospects and news items
    const [prospects, newsItems] = await Promise.all([
      fetchProspects(),
      fetchNewsItems(),
    ]);

    // 2. For each prospect, compute base score + news boost
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

    // 3. Revalidate affected pages
    revalidatePath("/prospecting");
    revalidatePath("/dashboard");

    return {
      success: true,
      updated,
      total: prospects.length,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
      updated: 0,
      total: 0,
    };
  }
}
