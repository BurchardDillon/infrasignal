"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { addFeedSource } from "@/lib/actions/feed-actions";

interface AddResult {
  success: boolean;
  error?: string;
  item_count?: number;
}

export function FeedSourceForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AddResult | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const url = (formData.get("url") as string).trim();
    const sourceType = ((formData.get("source_type") as string) || "rss") as
      | "rss"
      | "atom";

    if (!name || !url) {
      setResult({ success: false, error: "Name and URL are required." });
      return;
    }

    startTransition(async () => {
      const res = await addFeedSource(name, url, sourceType);
      setResult(res);
      if (res.success) {
        form.reset();
      }
    });
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Add Feed Source
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="feed-name"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Name
            </label>
            <input
              id="feed-name"
              name="name"
              type="text"
              required
              placeholder="DataCenter Knowledge"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="feed-url"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Feed URL
            </label>
            <input
              id="feed-url"
              name="url"
              type="url"
              required
              placeholder="https://example.com/rss"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="feed-type"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Type
            </label>
            <select
              id="feed-type"
              name="source_type"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="rss">RSS</option>
              <option value="atom">Atom</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            {isPending ? "Validating & adding..." : "Add Feed"}
          </button>
          {isPending && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Fetching and validating the feed URL...
            </span>
          )}
        </div>

        {result?.success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Feed source added successfully.
              {result.item_count != null && (
                <> Validated with {result.item_count} items found.</>
              )}
            </p>
          </div>
        )}

        {result && !result.success && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {result.error}
          </div>
        )}
      </form>
    </Card>
  );
}
