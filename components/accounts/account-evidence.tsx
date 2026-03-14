import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { MOCK_EVIDENCE } from "@/lib/data/mock-evidence";
import {
  SIGNAL_DIRECTION_LABELS,
  EVIDENCE_SOURCE_LABELS,
} from "@/lib/constants/labels";
import type { SignalDirection } from "@/lib/types";
import { FileText, ExternalLink } from "lucide-react";

const DIRECTION_VARIANT: Record<
  SignalDirection,
  "success" | "danger" | "neutral"
> = {
  positive: "success",
  negative: "danger",
  neutral: "neutral",
};

export function AccountEvidence({ accountId }: { accountId: string }) {
  const evidence = MOCK_EVIDENCE.filter((e) => e.account_id === accountId);

  if (evidence.length === 0) {
    return (
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <FileText className="h-5 w-5 text-gray-400" />
          Evidence
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No evidence items found for this account.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        <FileText className="h-5 w-5 text-gray-400" />
        Evidence
        <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
          {evidence.length} {evidence.length === 1 ? "item" : "items"}
        </span>
      </h2>
      <div className="space-y-4">
        {evidence.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-gray-100 p-4 dark:border-gray-800"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {item.headline}
              </h3>
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-gray-400 hover:text-blue-500"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={DIRECTION_VARIANT[item.signal_direction]}>
                {SIGNAL_DIRECTION_LABELS[item.signal_direction]}
              </Badge>
              <Badge variant="info">
                {EVIDENCE_SOURCE_LABELS[item.source_type]}
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Reliability
              </span>
              <ScoreBar score={item.reliability_score} size="sm" />
            </div>
            {item.raw_excerpt && (
              <blockquote className="mt-3 border-l-2 border-gray-300 pl-3 text-sm italic text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {item.raw_excerpt}
              </blockquote>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
