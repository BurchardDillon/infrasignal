"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DiscoveryAgentResult } from "@/lib/types";

const outcomeBadgeVariant: Record<
  string,
  "success" | "warning" | "danger" | "neutral"
> = {
  created: "success",
  skipped_non_us: "warning",
  skipped_duplicate: "neutral",
};

export function DiscoveryResults({
  result,
}: {
  result: DiscoveryAgentResult;
}) {
  if (!result.success && result.error) {
    return (
      <Card>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {result.error}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Discovery Results
        </h3>

        {/* Summary banner */}
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Processed {result.total} companies: {result.created} created,{" "}
            {result.skipped_duplicate} duplicate, {result.skipped_non_us}{" "}
            non-US rejected.
          </p>
        </div>

        {/* Per-company detail table */}
        {result.details.length > 0 && (
          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Company
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Outcome
                  </th>
                  <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
                {result.details.map((d, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                      {d.company_name}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={outcomeBadgeVariant[d.outcome] ?? "neutral"}
                      >
                        {d.outcome}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {d.reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
