import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ScoreBar } from "@/components/ui/score-bar";
import { MOCK_PROSPECTS } from "@/lib/data/mock-prospects";
import {
  COMPANY_TYPE_LABELS,
  HARDWARE_CATEGORY_LABELS,
  LIKELIHOOD_LABELS,
} from "@/lib/constants/labels";
import type { Likelihood, ProspectStatus } from "@/lib/types";

const STATUS_VARIANT: Record<
  ProspectStatus,
  "info" | "warning" | "success" | "danger"
> = {
  new: "info",
  reviewing: "warning",
  qualified: "success",
  dismissed: "danger",
};

const LIKELIHOOD_VARIANT: Record<
  Likelihood,
  "success" | "warning" | "danger" | "neutral"
> = {
  high: "success",
  medium: "warning",
  low: "danger",
  unknown: "neutral",
};

const columns = [
  { key: "company", label: "Company" },
  { key: "score", label: "Score" },
  { key: "type", label: "Proposed Type" },
  { key: "likelihood", label: "Buy Likelihood" },
  { key: "hardware", label: "Hardware" },
  { key: "status", label: "Status" },
];

const sortedProspects = [...MOCK_PROSPECTS].sort(
  (a, b) => b.priority_score - a.priority_score,
);

export function ProspectingQueue() {
  return (
    <DataTable columns={columns}>
      {sortedProspects.map((prospect) => (
        <tr key={prospect.id}>
          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
            {prospect.company_name}
          </td>
          <td className="px-4 py-3">
            <ScoreBar score={prospect.priority_score} size="sm" />
          </td>
          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
            {prospect.proposed_company_type
              ? COMPANY_TYPE_LABELS[prospect.proposed_company_type]
              : "--"}
          </td>
          <td className="px-4 py-3">
            <Badge
              variant={
                LIKELIHOOD_VARIANT[prospect.proposed_direct_buy_likelihood]
              }
            >
              {LIKELIHOOD_LABELS[prospect.proposed_direct_buy_likelihood]}
            </Badge>
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {prospect.hardware_categories.map((cat) => (
                <Badge key={cat} variant="neutral">
                  {HARDWARE_CATEGORY_LABELS[cat]}
                </Badge>
              ))}
            </div>
          </td>
          <td className="px-4 py-3">
            <Badge variant={STATUS_VARIANT[prospect.status]}>
              {prospect.status.charAt(0).toUpperCase() +
                prospect.status.slice(1)}
            </Badge>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
