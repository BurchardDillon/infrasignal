import type { HardwareCategory, NewsItem } from "@/lib/types";
import { computeNewsCompositeScore } from "@/lib/utils/scoring";

// ---------------------------------------------------------------------------
// News boost for prospect scoring
// ---------------------------------------------------------------------------
// Computes a bonus (0-15 points) to add to a prospect's priority_score
// based on recent news activity mentioning the company.
//
// Factors:
//   1. Volume: number of relevant news items (up to 5 pts)
//   2. Quality: average composite score of those items (up to 5 pts)
//   3. Hardware overlap: shared categories between prospect and news (up to 5 pts)

export function computeNewsBoost(
  companyName: string,
  prospectHardwareCategories: HardwareCategory[],
  allNewsItems: NewsItem[]
): number {
  // 1. Filter news items that mention this company
  const normalizedName = companyName.toLowerCase();
  const relevant = allNewsItems.filter((n) => {
    const text = `${n.title} ${n.impact_summary}`.toLowerCase();
    return text.includes(normalizedName);
  });

  if (relevant.length === 0) return 0;

  // 2. Activity volume bonus: 1 item = 2pts, 2 items = 4pts, 3+ = 5pts (max 5)
  const volumeBonus = Math.min(relevant.length * 2, 5);

  // 3. Quality bonus: average composite score / 20 (max 5)
  const avgComposite =
    relevant.reduce(
      (sum, n) => sum + computeNewsCompositeScore(n).composite_score,
      0
    ) / relevant.length;
  const qualityBonus = Math.min(Math.round(avgComposite / 20), 5);

  // 4. Hardware overlap bonus: shared categories (max 5)
  const newsHardware = new Set(relevant.flatMap((n) => n.hardware_categories));
  const overlap = prospectHardwareCategories.filter((cat) =>
    newsHardware.has(cat)
  ).length;
  const overlapBonus = Math.min(overlap * 2, 5);

  return Math.min(volumeBonus + qualityBonus + overlapBonus, 15);
}
