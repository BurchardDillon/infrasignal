"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import type {
  PnLookupResponseWithWebIntel,
  PnMatchResult,
  InvestigationProgressEvent,
  InvestigationCompleteEvent,
} from "@/lib/types/pn-lookup";

const CATEGORY_LABELS: Record<string, string> = {
  cpu: "CPU",
  gpu: "GPU",
  memory: "Memory",
  ssd: "SSD/Storage",
  networking: "Networking",
  system: "System",
  fru: "FRU",
  other: "Other",
};

const SCALE_VARIANT: Record<string, "success" | "info" | "warning" | "neutral"> = {
  hyperscale: "success",
  large: "success",
  medium: "info",
  small: "warning",
  unknown: "neutral",
};

export function PnLookupForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PnLookupResponseWithWebIntel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webSearch, setWebSearch] = useState(false);

  // Streaming investigation state
  const [investigating, setInvestigating] = useState(false);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressCompleted, setProgressCompleted] = useState(0);
  const [progressAccount, setProgressAccount] = useState<string | null>(null);

  const handleStreamingResponse = useCallback(
    async (res: Response) => {
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      setInvestigating(true);
      setProgressCompleted(0);
      setProgressTotal(0);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line) as InvestigationProgressEvent | InvestigationCompleteEvent;
              if (event.type === "progress") {
                setProgressTotal(event.total);
                setProgressCompleted(event.completed);
                setProgressAccount(event.account);
              } else if (event.type === "complete") {
                setResult(event.result);
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer) as InvestigationProgressEvent | InvestigationCompleteEvent;
            if (event.type === "complete") {
              setResult(event.result);
            }
          } catch {
            // ignore
          }
        }
      } finally {
        setInvestigating(false);
        setProgressAccount(null);
      }
    },
    []
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    setError(null);
    setProgressCompleted(0);
    setProgressTotal(0);

    const formData = new FormData(e.currentTarget);
    const pn = (formData.get("part_number") as string).trim();

    if (!pn) {
      setError("Please enter a part number.");
      return;
    }

    if (webSearch) {
      // Streaming mode for web investigation
      startTransition(async () => {
        try {
          const res = await fetch("/api/pn-lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ part_number: pn, web: true }),
          });
          if (!res.ok) {
            let data;
            try {
              data = await res.json();
            } catch {
              throw new Error(`Server returned ${res.status}`);
            }
            throw new Error(data.error ?? `HTTP ${res.status}`);
          }
          await handleStreamingResponse(res);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Investigation failed"
          );
          setInvestigating(false);
        }
      });
    } else {
      // Standard JSON mode
      startTransition(async () => {
        try {
          const res = await fetch("/api/pn-lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ part_number: pn, web: false }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? "Lookup failed");
            return;
          }
          setResult(data as PnLookupResponseWithWebIntel);
        } catch {
          setError("Network error. Please try again.");
        }
      });
    }
  }

  const progressPct =
    progressTotal > 0
      ? Math.round((progressCompleted / progressTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Search form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            Part Number Lookup
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter a part number to resolve the component and find matching
            accounts. Supports AMD EPYC, Intel Xeon, NVIDIA GPUs, Supermicro
            systems/FRUs, Mellanox NICs, and memory modules. Unknown PNs are
            resolved via AI web search.
          </p>

          <div className="flex gap-3">
            <input
              name="part_number"
              type="text"
              placeholder="e.g. 100-000000478, PK8072205559800, GPU-NVHGX-H100-88"
              className="block flex-1 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={isPending || investigating}
              className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              {isPending || investigating ? "Searching..." : "Lookup"}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={webSearch}
              onChange={(e) => setWebSearch(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
            />
            Investigate accounts (researches all relevant matches, writes
            findings to DB)
          </label>
        </form>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Investigation progress */}
      {investigating && progressTotal > 0 && (
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                Investigating Accounts
              </h3>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {progressCompleted} of {progressTotal}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {progressAccount && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Researching: {progressAccount}...
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Unresolved message */}
      {result && !result.component && (
        <Card>
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <p className="font-medium">Part number not recognized</p>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {result.message ??
                "This PN didn't match any known pattern and AI couldn't identify it. You can add it manually at "}
              <Link
                href="/admin/components"
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Admin &gt; Components
              </Link>
              .
            </p>
          </div>
        </Card>
      )}

      {/* Resolved component */}
      {result?.component && (
        <>
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Resolved Component
                </h3>
                <Badge variant="info">{result.resolved_by}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Part Number
                  </p>
                  <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                    {result.component.part_number}
                  </p>
                </div>
                {result.component.manufacturer && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Manufacturer
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {result.component.manufacturer}
                    </p>
                  </div>
                )}
                {result.component.description && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Description
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {result.component.description}
                    </p>
                  </div>
                )}
                {result.component.category && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Category
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {CATEGORY_LABELS[result.component.category] ??
                        result.component.category}
                    </p>
                  </div>
                )}
                {result.component.subcategory && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Subcategory
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {result.component.subcategory.toUpperCase()}
                    </p>
                  </div>
                )}
                {result.component.socket_platform && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Socket / Platform
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {result.component.socket_platform}
                    </p>
                  </div>
                )}
                {result.component.ecosystem && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ecosystem
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {result.component.ecosystem.toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
              {/* Specs */}
              {result.component.specs &&
                Object.keys(result.component.specs).length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Specifications
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(result.component.specs).map(
                        ([key, val]) => (
                          <span
                            key={key}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {key.replace(/_/g, " ")}: {String(val)}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </Card>

          {/* Web intel summary */}
          {result.web_intel && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-800 dark:bg-blue-950">
              <span className="font-medium text-blue-700 dark:text-blue-300">
                Investigation complete:
              </span>{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {result.web_intel.accounts_researched} accounts researched,{" "}
                {result.web_intel.accounts_updated} updated in database
              </span>
            </div>
          )}

          {/* Match results */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Account Matches
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {result.matches.length} of {result.total_accounts_searched}{" "}
                  accounts matched
                </span>
              </div>

              {result.message && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {result.message}
                </p>
              )}

              {result.matches.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No accounts scored ≥ 20 for this component. Accounts need
                  matching company_type, hardware_categories, or deal history.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                      <tr>
                        <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          Company
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          Type
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          Match Score
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          Reasons
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          Summary
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          Scale
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                          Deals
                        </th>
                        <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          Last Deal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
                      {result.matches.map((m) => (
                        <MatchRow key={m.account_id} match={m} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match row component
// ---------------------------------------------------------------------------

function MatchRow({ match: m }: { match: PnMatchResult }) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900">
      <td className="px-3 py-2">
        <Link
          href={`/accounts/${m.account_id}`}
          className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          {m.company_name}
        </Link>
        {m.hq_location && (
          <p className="text-[10px] text-gray-400">{m.hq_location}</p>
        )}
      </td>
      <td className="px-3 py-2">
        {m.company_type ? (
          <Badge variant="neutral">{m.company_type.replace(/_/g, " ")}</Badge>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2">
        <ScoreBar score={m.match_score} size="sm" />
      </td>
      <td className="max-w-[180px] px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {m.match_reasons.map((r, i) => (
            <Badge
              key={i}
              variant={
                r.startsWith("Web:")
                  ? "success"
                  : r === "Has dealt this exact PN"
                    ? "info"
                    : "default"
              }
            >
              {r}
            </Badge>
          ))}
        </div>
      </td>
      <td className="max-w-[220px] px-3 py-2 text-gray-600 dark:text-gray-400">
        {m.was_researched && m.research_summary ? (
          <p className="text-[11px] leading-tight">{m.research_summary}</p>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        {m.infra_scale ? (
          <Badge variant={SCALE_VARIANT[m.infra_scale] || "neutral"}>
            {m.infra_scale}
          </Badge>
        ) : (
          <span className="text-gray-300 dark:text-gray-600">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
        {m.deal_history_count}
      </td>
      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
        {m.last_deal_date ?? "—"}
      </td>
    </tr>
  );
}
