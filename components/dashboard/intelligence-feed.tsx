import Link from "next/link";
import { Lightbulb, Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchRecentIntelligence } from "@/lib/supabase/queries";
import {
  EVIDENCE_SOURCE_LABELS,
  NEWS_EVENT_LABELS,
} from "@/lib/constants/labels";
import type { Evidence, NewsItem } from "@/lib/types";

type FeedItem =
  | {
      kind: "evidence";
      id: string;
      title: string;
      badgeLabel: string;
      date: Date;
      accountId: string;
    }
  | {
      kind: "news";
      id: string;
      title: string;
      badgeLabel: string;
      date: Date;
      accountId: string | null;
    };

function isEvidence(item: Evidence | NewsItem): item is Evidence {
  return "headline" in item;
}

function buildFeed(items: Array<Evidence | NewsItem>): FeedItem[] {
  return items.map((item) => {
    if (isEvidence(item)) {
      return {
        kind: "evidence" as const,
        id: item.id,
        title: item.headline,
        badgeLabel: EVIDENCE_SOURCE_LABELS[item.source_type],
        date: item.created_at,
        accountId: item.account_id,
      };
    }
    return {
      kind: "news" as const,
      id: item.id,
      title: item.title,
      badgeLabel: NEWS_EVENT_LABELS[item.event_type],
      date: item.created_at,
      accountId: item.account_id,
    };
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function IntelligenceFeed() {
  const recentItems = await fetchRecentIntelligence(5);
  const feedItems = buildFeed(recentItems);

  return (
    <Card>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
        Recent Intelligence
      </h3>
      <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
        {feedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500">
              {item.kind === "evidence" ? (
                <Lightbulb className="h-4 w-4" />
              ) : (
                <Newspaper className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                {item.accountId ? (
                  <Link
                    href={`/accounts/${item.accountId}`}
                    className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                  >
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge
                  variant={item.kind === "evidence" ? "info" : "default"}
                >
                  {item.badgeLabel}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(item.date)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
