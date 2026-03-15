"use client";

import { useState, useTransition } from "react";
import {
  refreshQualification,
  type QualificationRefreshResult,
} from "@/lib/actions/refresh-qualification";
import { Card } from "@/components/ui/card";

export function QualifyButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<QualificationRefreshResult | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await refreshQualification();
      setResult(res);
    });
  }

  return (
    <Card>
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Recalculates qualification fields for all accounts (infra ownership
          verdict, direct buy likelihood, evidence strength, why it matters,
          negative signals, component fit) and all prospects (proposed buy
          likelihood, proposed infra verdict, priority score) using current
          evidence and news data.
        </p>

        <button
          onClick={handleClick}
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {isPending ? "Qualifying..." : "Refresh All Qualifications"}
        </button>

        {result?.success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Updated {result.accountsUpdated} of {result.accountsTotal} accounts
              and {result.prospectsUpdated} of {result.prospectsTotal} prospects.
              {(result.accountsUpdated > 0 || result.prospectsUpdated > 0) && (
                <>
                  {" "}
                  View changes on{" "}
                  <a
                    href="/accounts"
                    className="font-medium underline hover:text-emerald-800 dark:hover:text-emerald-200"
                  >
                    Accounts
                  </a>
                  {" and "}
                  <a
                    href="/prospecting"
                    className="font-medium underline hover:text-emerald-800 dark:hover:text-emerald-200"
                  >
                    Prospecting
                  </a>
                  .
                </>
              )}
            </p>
          </div>
        )}

        {result && !result.success && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {result.error ?? "An error occurred while refreshing qualifications."}
          </div>
        )}
      </div>
    </Card>
  );
}
