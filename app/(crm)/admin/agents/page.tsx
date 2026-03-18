import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  QualificationTriggerButton,
  QueueTriggerButton,
} from "@/components/admin/agent-trigger-buttons";
import { fetchJobRuns } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE_VARIANT: Record<
  string,
  "success" | "warning" | "danger"
> = {
  completed: "success",
  running: "warning",
  failed: "danger",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1_000) return `${ms}ms`;
  return `${(ms / 1_000).toFixed(1)}s`;
}

function formatDate(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function summarize(summary: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(summary)) {
    if (key === "success" || key === "error" || key === "details") continue;
    parts.push(`${key.replace(/_/g, " ")}: ${value}`);
  }
  return parts.join(", ") || "—";
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns = [
  { key: "agent", label: "Agent" },
  { key: "status", label: "Status" },
  { key: "started", label: "Started" },
  { key: "duration", label: "Duration", className: "text-right" },
  { key: "summary", label: "Summary" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgentRunsPage() {
  const runs = await fetchJobRuns(undefined, 50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Runs"
        description="Execution history and manual triggers for automated agents"
      />

      {/* Manual trigger buttons */}
      <div className="grid gap-4 sm:grid-cols-2">
        <QualificationTriggerButton />
        <QueueTriggerButton />
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Discovery and News agents require structured input and can be triggered
        via the API (POST /api/agents/discovery, POST /api/agents/news).
      </p>

      {/* Run history table */}
      <DataTable columns={columns}>
        {runs.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              No agent runs recorded yet.
            </td>
          </tr>
        ) : (
          runs.map((run) => (
            <tr key={run.id}>
              <td className="px-4 py-3 font-medium capitalize text-gray-900 dark:text-gray-100">
                {run.agent_name}
              </td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_BADGE_VARIANT[run.status] ?? "neutral"}>
                  {run.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {formatDate(run.started_at)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                {formatDuration(run.duration_ms)}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {run.error ? (
                  <span className="text-red-600 dark:text-red-400">
                    {run.error}
                  </span>
                ) : (
                  summarize(run.summary)
                )}
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
