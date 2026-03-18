"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  toggleFeedSourceEnabled,
  removeFeedSource,
} from "@/lib/actions/feed-actions";
import type { FeedSource } from "@/lib/types";

function formatDate(d: Date | null): string {
  if (!d) return "Never";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function FeedSourceRow({ feed }: { feed: FeedSource }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleFeedSourceEnabled(feed.id, !feed.is_enabled);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete feed "${feed.name}"?`)) return;
    startTransition(async () => {
      await removeFeedSource(feed.id);
    });
  }

  return (
    <tr className={isPending ? "opacity-50" : ""}>
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
        {feed.name}
      </td>
      <td className="max-w-xs truncate px-4 py-3 text-gray-600 dark:text-gray-400">
        <a
          href={feed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {feed.url}
        </a>
      </td>
      <td className="px-4 py-3 uppercase text-gray-600 dark:text-gray-400">
        {feed.source_type}
      </td>
      <td className="px-4 py-3">
        <Badge variant={feed.is_enabled ? "success" : "neutral"}>
          {feed.is_enabled ? "Enabled" : "Disabled"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="text-gray-600 dark:text-gray-400">
          {formatDate(feed.last_fetched_at)}
        </div>
        {feed.last_error && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-400">
            {feed.last_error}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {feed.is_enabled ? "Disable" : "Enable"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export function FeedSourceList({ feeds }: { feeds: FeedSource[] }) {
  return (
    <>
      {feeds.map((feed) => (
        <FeedSourceRow key={feed.id} feed={feed} />
      ))}
    </>
  );
}
