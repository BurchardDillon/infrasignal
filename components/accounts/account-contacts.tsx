import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_CONTACTS } from "@/lib/data/mock-contacts";
import {
  DEPARTMENT_LABELS,
  SENIORITY_LABELS,
  CONTACT_PRIORITY_LABELS,
  OUTREACH_STATUS_LABELS,
  EMAIL_CONFIDENCE_LABELS,
} from "@/lib/constants/labels";
import type { ContactPriority, EmailConfidence } from "@/lib/types";
import { Users, Mail, Linkedin } from "lucide-react";

const PRIORITY_VARIANT: Record<
  ContactPriority,
  "success" | "info" | "neutral"
> = {
  primary: "success",
  secondary: "info",
  monitor: "neutral",
};

const CONFIDENCE_COLOR: Record<EmailConfidence, string> = {
  verified: "text-green-600 dark:text-green-400",
  likely: "text-blue-600 dark:text-blue-400",
  guess: "text-amber-600 dark:text-amber-400",
  unknown: "text-gray-400 dark:text-gray-500",
};

export function AccountContacts({ accountId }: { accountId: string }) {
  const contacts = MOCK_CONTACTS.filter((c) => c.account_id === accountId);

  if (contacts.length === 0) {
    return (
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Users className="h-5 w-5 text-gray-400" />
          Contacts
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No contacts found for this account.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        <Users className="h-5 w-5 text-gray-400" />
        Contacts
        <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
          {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
        </span>
      </h2>
      <div className="space-y-4">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="rounded-lg border border-gray-100 p-4 dark:border-gray-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {contact.full_name}
                </h3>
                {contact.title && (
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                    {contact.title}
                  </p>
                )}
              </div>
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-gray-400 hover:text-blue-500"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="default">
                {DEPARTMENT_LABELS[contact.department]}
              </Badge>
              <Badge variant="neutral">
                {SENIORITY_LABELS[contact.seniority_tier]}
              </Badge>
              <Badge variant={PRIORITY_VARIANT[contact.contact_priority]}>
                {CONTACT_PRIORITY_LABELS[contact.contact_priority]}
              </Badge>
              <Badge variant="info">
                {OUTREACH_STATUS_LABELS[contact.outreach_status]}
              </Badge>
            </div>
            {contact.email && (
              <div className="mt-3 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {contact.email}
                </span>
                <span
                  className={`text-xs font-medium ${CONFIDENCE_COLOR[contact.email_confidence]}`}
                >
                  ({EMAIL_CONFIDENCE_LABELS[contact.email_confidence]})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
