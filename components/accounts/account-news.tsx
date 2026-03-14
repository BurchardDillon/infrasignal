import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { MOCK_NEWS } from "@/lib/data/mock-news";
import { NEWS_EVENT_LABELS } from "@/lib/constants/labels";
import { Newspaper, ExternalLink } from "lucide-react";

export function AccountNews({ accountId }: { accountId: string }) {
  const news = MOCK_NEWS.filter(
    (item) =>
      item.account_id === accountId ||
      item.linked_accounts.some((link) => link.account_id === accountId)
  );

  if (news.length === 0) {
    return (
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Newspaper className="h-5 w-5 text-gray-400" />
          Linked News
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No news items linked to this account.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        <Newspaper className="h-5 w-5 text-gray-400" />
        Linked News
        <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
          {news.length} {news.length === 1 ? "article" : "articles"}
        </span>
      </h2>
      <div className="space-y-4">
        {news.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-100 p-4 dark:border-gray-800"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {item.title}
              </h3>
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-gray-400 hover:text-blue-500"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="default">
                {NEWS_EVENT_LABELS[item.event_type]}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.source_name}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Urgency
                </span>
                <ScoreBar score={item.urgency_score} size="sm" />
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Commercial
                </span>
                <ScoreBar score={item.commercial_relevance_score} size="sm" />
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Confidence
                </span>
                <ScoreBar score={item.confidence_score} size="sm" />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {item.impact_summary}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
