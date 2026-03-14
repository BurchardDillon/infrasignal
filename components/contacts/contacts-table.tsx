import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { MOCK_CONTACTS } from "@/lib/data/mock-contacts";
import { MOCK_ACCOUNTS } from "@/lib/data/mock-accounts";
import {
  DEPARTMENT_LABELS,
  SENIORITY_LABELS,
  ROLE_CATEGORY_LABELS,
  CONTACT_PRIORITY_LABELS,
  OUTREACH_STATUS_LABELS,
} from "@/lib/constants/labels";
import type { ContactPriority, OutreachStatus } from "@/lib/types";

const PRIORITY_VARIANT: Record<
  ContactPriority,
  "success" | "info" | "neutral"
> = {
  primary: "success",
  secondary: "info",
  monitor: "neutral",
};

const OUTREACH_VARIANT: Record<
  OutreachStatus,
  "neutral" | "info" | "success" | "danger"
> = {
  not_contacted: "neutral",
  contacted: "info",
  responded: "success",
  meeting_set: "success",
  not_interested: "danger",
};

const columns = [
  { key: "name", label: "Name" },
  { key: "title", label: "Title" },
  { key: "account", label: "Account" },
  { key: "department", label: "Department" },
  { key: "seniority", label: "Seniority" },
  { key: "role", label: "Role" },
  { key: "priority", label: "Priority" },
  { key: "outreach", label: "Outreach Status" },
];

function getAccountName(accountId: string): string {
  const account = MOCK_ACCOUNTS.find((a) => a.id === accountId);
  return account?.company_name ?? "Unknown";
}

export function ContactsTable() {
  return (
    <DataTable columns={columns}>
      {MOCK_CONTACTS.map((contact) => (
        <tr key={contact.id}>
          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
            {contact.full_name}
          </td>
          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
            {contact.title ?? "--"}
          </td>
          <td className="px-4 py-3">
            <Link
              href={`/accounts/${contact.account_id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              {getAccountName(contact.account_id)}
            </Link>
          </td>
          <td className="px-4 py-3">
            <Badge variant="default">
              {DEPARTMENT_LABELS[contact.department]}
            </Badge>
          </td>
          <td className="px-4 py-3">
            <Badge variant="default">
              {SENIORITY_LABELS[contact.seniority_tier]}
            </Badge>
          </td>
          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
            {ROLE_CATEGORY_LABELS[contact.role_category]}
          </td>
          <td className="px-4 py-3">
            <Badge variant={PRIORITY_VARIANT[contact.contact_priority]}>
              {CONTACT_PRIORITY_LABELS[contact.contact_priority]}
            </Badge>
          </td>
          <td className="px-4 py-3">
            <Badge variant={OUTREACH_VARIANT[contact.outreach_status]}>
              {OUTREACH_STATUS_LABELS[contact.outreach_status]}
            </Badge>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
