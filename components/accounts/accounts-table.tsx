import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { MOCK_ACCOUNTS } from "@/lib/data/mock-accounts";
import {
  COMPANY_TYPE_LABELS,
  ACCOUNT_STATUS_LABELS,
  EVIDENCE_STRENGTH_LABELS,
  LIKELIHOOD_LABELS,
  HARDWARE_CATEGORY_LABELS,
} from "@/lib/constants/labels";
import type { AccountStatus, EvidenceStrength } from "@/lib/types";

const STATUS_VARIANT: Record<
  AccountStatus,
  "success" | "info" | "danger" | "warning"
> = {
  active: "success",
  nurturing: "info",
  churned: "danger",
  on_hold: "warning",
};

const STRENGTH_VARIANT: Record<
  EvidenceStrength,
  "success" | "default" | "warning" | "neutral"
> = {
  strong: "success",
  moderate: "default",
  weak: "warning",
  none: "neutral",
};

const columns = [
  { key: "company_name", label: "Company Name" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "evidence_strength", label: "Evidence Strength" },
  { key: "buy_likelihood", label: "Buy Likelihood" },
  { key: "hardware", label: "Hardware" },
  { key: "last_reviewed", label: "Last Reviewed", className: "text-right" },
];

export function AccountsTable() {
  return (
    <DataTable columns={columns}>
      {MOCK_ACCOUNTS.map((account) => (
        <tr
          key={account.id}
          className="group hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <td className="px-4 py-3">
            <Link
              href={`/accounts/${account.id}`}
              className="font-medium text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400"
            >
              {account.company_name}
            </Link>
          </td>
          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
            {COMPANY_TYPE_LABELS[account.company_type]}
          </td>
          <td className="px-4 py-3">
            <Badge variant={STATUS_VARIANT[account.status]}>
              {ACCOUNT_STATUS_LABELS[account.status]}
            </Badge>
          </td>
          <td className="px-4 py-3">
            <Badge variant={STRENGTH_VARIANT[account.evidence_strength]}>
              {EVIDENCE_STRENGTH_LABELS[account.evidence_strength]}
            </Badge>
          </td>
          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
            {LIKELIHOOD_LABELS[account.direct_buy_likelihood]}
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-1">
              {account.hardware_categories.map((cat) => (
                <Badge key={cat} variant="neutral">
                  {HARDWARE_CATEGORY_LABELS[cat]}
                </Badge>
              ))}
            </div>
          </td>
          <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
            {account.last_reviewed_at
              ? account.last_reviewed_at.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Never"}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
