"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import {
  triggerQualificationAgent,
  triggerQueueAgent,
} from "@/lib/actions/run-agent";
import type {
  QualificationAgentResult,
  QueueAgentResult,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Qualification trigger
// ---------------------------------------------------------------------------

export function QualificationTriggerButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<QualificationAgentResult | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await triggerQualificationAgent();
      setResult(res);
    });
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Qualification Agent
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Recomputes account and prospect qualification fields from evidence and
          news signals. Runs daily at 6:00 AM UTC via Vercel Cron.
        </p>

        <button
          onClick={handleClick}
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          {isPending ? "Running..." : "Run Qualification Agent"}
        </button>

        {result?.success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Accounts: {result.accounts_updated} of {result.accounts_total}{" "}
              updated. Prospects: {result.prospects_updated} of{" "}
              {result.prospects_total} updated.
            </p>
          </div>
        )}

        {result && !result.success && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {result.error ?? "An error occurred while running the agent."}
          </div>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Queue trigger
// ---------------------------------------------------------------------------

export function QueueTriggerButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<QueueAgentResult | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await triggerQueueAgent();
      setResult(res);
    });
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Queue Agent
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Recalculates every prospect&apos;s priority score using base scoring
          plus news-signal boost. Runs daily at 7:00 AM UTC via Vercel Cron.
        </p>

        <button
          onClick={handleClick}
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {isPending ? "Running..." : "Run Queue Agent"}
        </button>

        {result?.success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Updated {result.updated} of {result.total} prospect scores.
            </p>
          </div>
        )}

        {result && !result.success && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {result.error ?? "An error occurred while running the agent."}
          </div>
        )}
      </div>
    </Card>
  );
}
