import type { RawArticleBatchInput, NewsAgentResult } from "@/lib/types";
import type { Json } from "@/lib/supabase/database.types";
import { interpretArticle } from "@/lib/engine/interpret-article";
import { linkToAccounts } from "@/lib/engine/link-accounts";
import { computeNewsBoost } from "@/lib/engine/news-boost";
import { computeProspectPriorityScore } from "@/lib/utils/scoring";
import {
  insertJobRun,
  completeJobRun,
  failJobRun,
  insertNewsItem,
  fetchAccountsForLinking,
  fetchNewsSourceUrls,
  fetchProspects,
  fetchNewsItems,
  updateProspectScore,
} from "@/lib/supabase/queries";

// ---------------------------------------------------------------------------
// News Agent orchestrator
// ---------------------------------------------------------------------------

export async function runNewsAgent(
  articles: RawArticleBatchInput[]
): Promise<NewsAgentResult> {
  const jobId = await insertJobRun("news");
  const startTime = Date.now();

  try {
    // 1. Load existing source URLs for deduplication
    const existingUrls = await fetchNewsSourceUrls();

    // 2. Load accounts for linking (once, shared across batch)
    const accounts = await fetchAccountsForLinking();

    let ingested = 0;
    let skippedDuplicate = 0;

    for (const article of articles) {
      // 3. Deduplicate by source_url
      if (existingUrls.has(article.source_url)) {
        skippedDuplicate++;
        continue;
      }

      // 4. Interpret article (pure function — reuse existing engine)
      const raw = {
        title: article.title,
        body: article.body,
        source_url: article.source_url,
        source_name: article.source_name,
        published_at: article.published_at,
        mentioned_companies: article.mentioned_companies,
      };
      const interpreted = interpretArticle(raw);

      // 5. Link to accounts (pure function — reuse existing engine)
      const linkResult = linkToAccounts(article.mentioned_companies, accounts);

      // 6. Assemble and insert (same pattern as ingest-news.ts server action)
      const insertPayload = {
        title: article.title,
        summary:
          article.body.length > 500
            ? article.body.slice(0, 497) + "..."
            : article.body,
        source_url: article.source_url,
        source_name: article.source_name,
        published_at: article.published_at,
        event_type: interpreted.event_type,
        urgency_score: interpreted.urgency_score,
        commercial_relevance_score: interpreted.commercial_relevance_score,
        confidence_score: interpreted.confidence_score,
        impact_summary: interpreted.impact_summary,
        recommended_outreach_department:
          interpreted.recommended_outreach_department,
        suggested_outreach_angle: interpreted.suggested_outreach_angle,
        component_impact: interpreted.component_impact as unknown as Json,
        hardware_categories: interpreted.hardware_categories,
        account_id: linkResult.account_id,
        linked_accounts: linkResult.linked_accounts as unknown as Json,
      };

      await insertNewsItem(insertPayload);
      existingUrls.add(article.source_url); // prevent batch-internal duplicates
      ingested++;
    }

    // 7. After batch: refresh prospect scores if any new articles ingested
    let scoresRefreshed = 0;
    if (ingested > 0) {
      const [prospects, newsItems] = await Promise.all([
        fetchProspects(),
        fetchNewsItems(),
      ]);

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
          scoresRefreshed++;
        }
      }
    }

    const result: NewsAgentResult = {
      success: true,
      ingested,
      skipped_duplicate: skippedDuplicate,
      total: articles.length,
      scores_refreshed: scoresRefreshed,
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
      ingested: 0,
      skipped_duplicate: 0,
      total: articles.length,
      scores_refreshed: 0,
    };
  }
}
