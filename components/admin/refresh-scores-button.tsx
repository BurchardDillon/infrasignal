"use client";

import { useState, useTransition } from "react";
import {
  refreshProspectScores,
  type RefreshResult,
} from "@/lib/actions/refresh-scores";
import { Card } from "@/components/ui/card";

export function RefreshScoresButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RefreshResult | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await refreshProspectScores();
      setResult(res);
    });
  }

  return (
    <Card>
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Recalculates every prospect&apos;s priority score using the base
          scoring formula plus a news-signal boost (0-15 points) derived from
          recent news item volume, quality, and hardware overlap.
        </p>

        <button
          onClick={handleClick}
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {isPending ? "Refreshing..." : "Refresh All Prospect Scores"}
        </button>

        {result?.success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Updated {result.updated} of {result.total} prospect scores.
              {result.updated > 0 && (
                <>
                  {" "}
                  View changes on the{" "}
                  <a
                    href="/prospecting"
                    className="font-medium underline hover:text-emerald-800 dark:hover:text-emerald-200"
                  >
                    Prospecting Queue
                  </a>
                  .
                </>
              )}
            </p>
          </div>
        )}

        {result && !result.success && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {result.error ?? "An error occurred while refreshing scores."}
          </div>
        )}
      </div>
    </Card>
  );
}
