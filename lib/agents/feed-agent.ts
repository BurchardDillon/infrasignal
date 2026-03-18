import type { FeedAgentResult, FeedFetchDetail } from "@/lib/types";
import { parseFeed } from "@/lib/engine/parse-feed";
import { runNewsAgent } from "@/lib/agents/news-agent";
import {
  insertJobRun,
  completeJobRun,
  failJobRun,
  fetchEnabledFeedSources,
  updateFeedSourceFetchStatus,
} from "@/lib/supabase/queries";

// ---------------------------------------------------------------------------
// Bot mitigation / HTML detection (same markers as parse-feed.ts validation)
// ---------------------------------------------------------------------------

const BOT_MITIGATION_MARKERS = [
  "just a moment",
  "checking your browser",
  "cf-browser-verification",
  "cloudflare",
  "ddos-guard",
  "sucuri",
  "incapsula",
  "access denied",
  "enable javascript",
  "ray id",
];

function detectHtmlOrBotMitigation(body: string): string | null {
  const lower = body.slice(0, 5000).toLowerCase();
  const isHtml =
    lower.includes("<!doctype html") ||
    lower.includes("<html") ||
    (lower.includes("<head") && lower.includes("<body"));

  if (!isHtml) return null;

  const isBotMitigation = BOT_MITIGATION_MARKERS.some((marker) =>
    lower.includes(marker)
  );

  if (isBotMitigation) {
    return "Feed is protected by bot mitigation and cannot be fetched";
  }
  return "Feed returned HTML instead of RSS/Atom XML";
}

// ---------------------------------------------------------------------------
// Feed Agent orchestrator
// ---------------------------------------------------------------------------

/**
 * Fetches all enabled RSS/Atom feeds, parses them, deduplicates,
 * and passes new articles into the existing news agent pipeline.
 *
 * Idempotent: re-running produces zero new inserts if feeds haven't changed,
 * because the news agent deduplicates by source_url.
 *
 * Feed safety:
 * - Strict per-feed error isolation: one bad feed cannot fail the whole run.
 * - Per-feed failures are logged in both the feed_source.last_error column
 *   and the job_runs.summary.feed_details array.
 * - HTML and bot mitigation responses are detected and reported clearly.
 *
 * USA-scope:
 * - Feed ingestion is news-only. Non-US articles are ingested if they
 *   materially affect US infrastructure buyers. The news agent links
 *   articles only to existing US-only accounts (linkToAccounts).
 *   No new accounts or prospects are created by this pipeline.
 *
 * Note: This creates TWO job_runs entries per execution — one "feed" run
 * (this orchestrator) and one "news" run (from runNewsAgent). This is
 * intentional: the feed run tracks fetch/parse activity, while the news
 * run tracks interpretation/linking/scoring. Both are visible on the
 * Agent Runs admin page.
 */
export async function runFeedAgent(): Promise<FeedAgentResult> {
  const jobId = await insertJobRun("feed");
  const startTime = Date.now();

  try {
    const feeds = await fetchEnabledFeedSources();

    let feedsFetched = 0;
    let feedsFailed = 0;
    let articlesFound = 0;
    const feedDetails: FeedFetchDetail[] = [];
    const allArticles: Array<{
      title: string;
      body: string;
      source_url: string;
      source_name: string;
      published_at: string;
      mentioned_companies: string[];
    }> = [];

    for (const feed of feeds) {
      try {
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "InfraSignal/1.0 (RSS Reader)" },
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const xml = await response.text();

        // Detect HTML / bot mitigation before parsing
        const htmlError = detectHtmlOrBotMitigation(xml);
        if (htmlError) {
          throw new Error(htmlError);
        }

        const articles = parseFeed(xml, feed.name);

        articlesFound += articles.length;
        allArticles.push(...articles);
        feedsFetched++;
        feedDetails.push({
          name: feed.name,
          status: "ok",
          articles_found: articles.length,
        });
        await updateFeedSourceFetchStatus(feed.id, null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        feedsFailed++;
        feedDetails.push({
          name: feed.name,
          status: "error",
          articles_found: 0,
          error: msg,
        });
        await updateFeedSourceFetchStatus(feed.id, msg);
      }
    }

    // Delegate to news agent for dedup + interpretation + linking + scoring
    let articlesNew = 0;
    let articlesDuplicate = 0;
    let scoresRefreshed = 0;

    if (allArticles.length > 0) {
      const newsResult = await runNewsAgent(allArticles);
      articlesNew = newsResult.ingested;
      articlesDuplicate = newsResult.skipped_duplicate;
      scoresRefreshed = newsResult.scores_refreshed;
    }

    const result: FeedAgentResult = {
      success: true,
      feeds_fetched: feedsFetched,
      feeds_failed: feedsFailed,
      feeds_total: feeds.length,
      articles_found: articlesFound,
      articles_new: articlesNew,
      articles_duplicate: articlesDuplicate,
      scores_refreshed: scoresRefreshed,
      feed_details: feedDetails,
    };

    // Include per-feed details in the job summary for admin visibility
    const summary: Record<string, unknown> = { ...result };

    const durationMs = Date.now() - startTime;
    await completeJobRun(jobId, summary, durationMs);
    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await failJobRun(jobId, errorMessage, durationMs);
    return {
      success: false,
      error: errorMessage,
      feeds_fetched: 0,
      feeds_failed: 0,
      feeds_total: 0,
      articles_found: 0,
      articles_new: 0,
      articles_duplicate: 0,
      scores_refreshed: 0,
      feed_details: [],
    };
  }
}
