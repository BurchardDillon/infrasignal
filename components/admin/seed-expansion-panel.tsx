"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { DiscoveryResults } from "@/components/admin/discovery-results";
import {
  runSeedExpansion,
  getSeedExpansionStats,
} from "@/lib/actions/discovery-actions";
import type { DiscoveryAgentResult } from "@/lib/types";

interface SeedStats {
  total: number;
  already_in_system: number;
  net_new: number;
}

export function SeedExpansionPanel({
  initialStats,
}: {
  initialStats: SeedStats;
}) {
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  const [result, setResult] = useState<DiscoveryAgentResult | null>(null);
  const [stats, setStats] = useState<SeedStats>(initialStats);

  function handleRun() {
    setResult(null);
    startTransition(async () => {
      const res = await runSeedExpansion();
      setResult(res);
      // Refresh stats after run
      const updated = await getSeedExpansionStats();
      setStats(updated);
    });
  }

  function handleRefreshStats() {
    startRefresh(async () => {
      const updated = await getSeedExpansionStats();
      setStats(updated);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            Seed Expansion
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Run the curated seed dataset of US infrastructure companies through
            the discovery agent. Already-known companies are skipped
            automatically. Runs weekly via Vercel Cron (Mon 4:00 AM UTC).
          </p>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Total Curated
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                {stats.total}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Already in System
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                {stats.already_in_system}
              </p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Net-New Candidates
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {stats.net_new}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={isPending}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              {isPending ? "Running seed expansion..." : "Run Seed Expansion"}
            </button>
            <button
              onClick={handleRefreshStats}
              disabled={isRefreshing}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Stats"}
            </button>
          </div>
        </div>
      </Card>

      {result && <DiscoveryResults result={result} />}
    </div>
  );
}
