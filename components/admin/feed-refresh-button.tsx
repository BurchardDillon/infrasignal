"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { triggerFeedAgent } from "@/lib/actions/feed-actions";
import type { FeedAgentResult } from "@/lib/types";

export function FeedRefreshButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FeedAgentResult | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await triggerFeedAgent();
      setResult(res);
    });
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Manual Feed Refresh
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Fetches all enabled feeds, parses new articles, and passes them
          through the news agent pipeline. Runs daily at 5:00 AM UTC via Vercel
          Cron.
        </p>

        <button
          onClick={handleClick}
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {isPending ? "Fetching feeds..." : "Refresh All Feeds"}
        </button>

        {result?.success && (
          <div className="space-y-3">
            {/* Aggregate summary */}
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Fetched {result.feeds_fetched} of {result.feeds_total} feeds
                {result.feeds_failed > 0 && (
                  <> ({result.feeds_failed} failed)</>
                )}
                . Found {result.articles_found} articles: {result.articles_new}{" "}
                new, {result.articles_duplicate} duplicate.
                {result.scores_refreshed > 0 && (
                  <> Refreshed {result.scores_refreshed} prospect scores.</>
                )}
              </p>
            </div>

            {/* Per-feed detail rows */}
            {result.feed_details && result.feed_details.length > 0 && (
              <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                        Feed
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                        Articles
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
                    {result.feed_details.map((detail, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                          {detail.name}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              detail.status === "ok" ? "success" : "danger"
                            }
                          >
                            {detail.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                          {detail.articles_found}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {detail.error ? (
                            <span className="text-red-600 dark:text-red-400">
                              {detail.error}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {result && !result.success && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {result.error ?? "An error occurred while fetching feeds."}
          </div>
        )}
      </div>
    </Card>
  );
}
