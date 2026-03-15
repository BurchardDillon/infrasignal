"use client";

import { useActionState } from "react";
import { ingestArticle, type IngestResult } from "@/lib/actions/ingest-news";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import {
  NEWS_EVENT_LABELS,
  HARDWARE_CATEGORY_LABELS,
} from "@/lib/constants/labels";
import type { NewsEventType, HardwareCategory } from "@/lib/types";

const EVENT_TYPE_VARIANT: Record<
  string,
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

const inputClasses =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500";

const labelClasses =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function IngestForm() {
  const [state, formAction, isPending] = useActionState<
    IngestResult | null,
    FormData
  >(ingestArticle, null);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: Input form */}
      <Card>
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Raw Article Input
        </h3>
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="title" className={labelClasses}>
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. CoreWeave Breaks Ground on New Texas Data Center"
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="body" className={labelClasses}>
              Article Body / Summary
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={6}
              placeholder="Paste the article text or a summary of the key points..."
              className={inputClasses}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="source_url" className={labelClasses}>
                Source URL
              </label>
              <input
                id="source_url"
                name="source_url"
                type="url"
                required
                placeholder="https://..."
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="source_name" className={labelClasses}>
                Source Name
              </label>
              <input
                id="source_name"
                name="source_name"
                type="text"
                required
                placeholder="e.g. Reuters, TechCrunch"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="published_at" className={labelClasses}>
                Published Date
              </label>
              <input
                id="published_at"
                name="published_at"
                type="date"
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="mentioned_companies" className={labelClasses}>
                Mentioned Companies
              </label>
              <input
                id="mentioned_companies"
                name="mentioned_companies"
                type="text"
                placeholder="CoreWeave, NVIDIA (comma-separated)"
                className={inputClasses}
              />
            </div>
          </div>

          {state?.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            {isPending ? "Processing..." : "Ingest & Interpret"}
          </button>
        </form>
      </Card>

      {/* Right: Interpretation results */}
      <div className="space-y-6">
        {state?.success && state.interpretation && (
          <Card>
            <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Interpretation Results
            </h3>

            <div className="space-y-4">
              {/* Event Type */}
              <div>
                <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Event Type
                </p>
                <Badge
                  variant={
                    EVENT_TYPE_VARIANT[state.interpretation.event_type] ??
                    "neutral"
                  }
                >
                  {NEWS_EVENT_LABELS[
                    state.interpretation.event_type as NewsEventType
                  ] ?? state.interpretation.event_type}
                </Badge>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Urgency
                  </p>
                  <ScoreBar
                    score={state.interpretation.urgency_score}
                    size="sm"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Commercial Relevance
                  </p>
                  <ScoreBar
                    score={state.interpretation.commercial_relevance_score}
                    size="sm"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Confidence
                  </p>
                  <ScoreBar
                    score={state.interpretation.confidence_score}
                    size="sm"
                  />
                </div>
              </div>

              {/* Hardware Categories */}
              {state.interpretation.hardware_categories.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Detected Hardware
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {state.interpretation.hardware_categories.map((cat) => (
                      <Badge key={cat} variant="neutral">
                        {HARDWARE_CATEGORY_LABELS[cat as HardwareCategory] ??
                          cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Linking */}
              <div>
                <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Linked Accounts
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {state.interpretation.linked_account_count > 0
                    ? `${state.interpretation.linked_account_count} account(s) auto-linked`
                    : "No matching accounts found"}
                </p>
              </div>

              {/* Success indicator */}
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  News item created successfully. View it on the{" "}
                  <a
                    href="/intelligence"
                    className="font-medium underline hover:text-emerald-800 dark:hover:text-emerald-200"
                  >
                    Intelligence
                  </a>{" "}
                  page.
                </p>
              </div>
            </div>
          </Card>
        )}

        {!state && (
          <Card>
            <div className="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              <p className="mb-2 text-lg">Submit an article to see results</p>
              <p>
                The interpretation engine will classify the event type, compute
                scores, detect hardware categories, and auto-link to existing
                accounts.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
