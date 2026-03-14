import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { MOCK_NEWS } from "@/lib/data/mock-news";
import { MOCK_ACCOUNTS } from "@/lib/data/mock-accounts";
import {
  NEWS_EVENT_LABELS,
  HARDWARE_CATEGORY_LABELS,
} from "@/lib/constants/labels";
import type { NewsEventType } from "@/lib/types";

const EVENT_TYPE_VARIANT: Record<
  NewsEventType,
  "default" | "success" | "danger" | "info" | "warning" | "neutral"
> = {
  acquisition: "danger",
  expansion: "success",
  earnings: "info",
  infrastructure_build: "success",
  partnership: "default",
  hiring_signal: "warning",
  product_launch: "neutral",
  shortage: "danger",
  price_movement: "warning",
  supply_disruption: "danger",
  cloud_migration: "info",
  on_prem_buildout: "success",
  regulatory: "neutral",
  compliance_or_tariff_issue: "neutral",
  government_contract: "neutral",
  other: "neutral",
};

function getAccountName(accountId: string): string {
  const account = MOCK_ACCOUNTS.find((a) => a.id === accountId);
  return account?.company_name ?? "Unknown";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function NewsFeed() {
  return (
    <div className="flex flex-col gap-6">
      {MOCK_NEWS.map((item) => {
        const allAccountIds = new Set<string>();
        if (item.account_id) {
          allAccountIds.add(item.account_id);
        }
        for (const link of item.linked_accounts) {
          allAccountIds.add(link.account_id);
        }
        const accountIds = Array.from(allAccountIds);

        return (
          <Card key={item.id}>
            {/* Header: Title + Event Type */}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {item.title}
              </h3>
              <Badge variant={EVENT_TYPE_VARIANT[item.event_type]}>
                {NEWS_EVENT_LABELS[item.event_type]}
              </Badge>
            </div>

            {/* Score Bars */}
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Urgency
                </p>
                <ScoreBar score={item.urgency_score} size="sm" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Commercial Relevance
                </p>
                <ScoreBar score={item.commercial_relevance_score} size="sm" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Confidence
                </p>
                <ScoreBar score={item.confidence_score} size="sm" />
              </div>
            </div>

            {/* Impact Summary */}
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
              {item.impact_summary}
            </p>

            {/* Suggested Outreach Angle */}
            {item.suggested_outreach_angle && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
                <p className="text-sm italic text-blue-800 dark:text-blue-300">
                  {item.suggested_outreach_angle}
                </p>
              </div>
            )}

            {/* Component Impact */}
            {item.component_impact.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Component Impact
                </p>
                <ul className="space-y-1">
                  {item.component_impact.map((ci, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <Badge variant="neutral">
                        {HARDWARE_CATEGORY_LABELS[ci.category]}
                      </Badge>
                      <span>{ci.impact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer: Linked Accounts + Date/Source */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <div className="flex flex-wrap items-center gap-2">
                {accountIds.map((accountId) => (
                  <Link
                    key={accountId}
                    href={`/accounts/${accountId}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {getAccountName(accountId)}
                  </Link>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(item.published_at)} &middot; {item.source_name}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
