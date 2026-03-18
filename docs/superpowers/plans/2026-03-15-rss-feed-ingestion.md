# RSS/Atom Feed Ingestion Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an unattended RSS/Atom feed ingestion pipeline that fetches enabled feeds, parses XML, normalizes articles, deduplicates, and passes new items through the existing news agent pipeline.

**Architecture:** One new table (`feed_sources`) stores RSS/Atom feed URLs with enable/disable state. A new `feed-agent` orchestrator fetches all enabled feeds, parses XML with `fast-xml-parser`, normalizes entries into `RawArticleBatchInput[]`, and delegates to `runNewsAgent()`. An admin page manages feed sources and allows manual refresh. Vercel Cron triggers the feed agent on schedule.

**Tech Stack:** Next.js 16 App Router, Supabase, TypeScript, fast-xml-parser v5, Vercel Cron

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/004_create_feed_sources.sql` | feed_sources table, indexes, trigger |
| Modify | `lib/supabase/database.types.ts` | Add feed_sources Row/Insert/Update types |
| Create | `lib/types/feeds.ts` | FeedSource domain type, FeedAgentResult |
| Modify | `lib/types/agents.ts` | Add `"feed"` to AgentName union |
| Modify | `lib/types/index.ts` | Re-export feeds types |
| Modify | `lib/supabase/queries.ts` | CRUD for feed_sources, update last_fetched_at |
| Create | `lib/engine/parse-feed.ts` | Pure function: XML string -> normalized article array |
| Create | `lib/agents/feed-agent.ts` | Feed agent orchestrator |
| Create | `lib/actions/feed-actions.ts` | Server actions: add/toggle/delete feed, trigger refresh |
| Create | `app/api/agents/feeds/route.ts` | GET route for Vercel Cron |
| Create | `components/admin/feed-source-form.tsx` | Client component: add feed form |
| Create | `components/admin/feed-source-list.tsx` | Client component: list/toggle/delete feeds |
| Create | `components/admin/feed-refresh-button.tsx` | Client component: manual refresh trigger |
| Create | `app/(crm)/admin/feeds/page.tsx` | Admin page: feed source management |
| Modify | `lib/constants/navigation.ts` | Add "Feed Sources" nav item |
| Modify | `vercel.json` | Add feed agent cron schedule |
| Create | `supabase/migrations/005_add_feed_agent_name.sql` | Add 'feed' to job_runs agent_name CHECK |

---

## Chunk 1: Database, Types, and Queries

### Task 1: Create the feed_sources migration

**Files:**
- Create: `supabase/migrations/004_create_feed_sources.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Feed sources for RSS/Atom ingestion
CREATE TABLE feed_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  url             text NOT NULL UNIQUE,
  source_type     text NOT NULL DEFAULT 'rss' CHECK (source_type IN ('rss', 'atom')),
  is_enabled      boolean NOT NULL DEFAULT true,
  last_fetched_at timestamptz,
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_feed_sources_updated_at
  BEFORE UPDATE ON feed_sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_feed_sources_is_enabled ON feed_sources (is_enabled);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/004_create_feed_sources.sql
git commit -m "feat: add feed_sources table migration"
```

---

### Task 2: Add feed_sources to database.types.ts

**Files:**
- Modify: `lib/supabase/database.types.ts`

- [ ] **Step 1: Add the feed_sources table types**

Add inside `Tables` (after `evidence` block, before `job_runs`), following the exact pattern of other table types:

```typescript
feed_sources: {
  Row: {
    id: string;
    name: string;
    url: string;
    source_type: string;
    is_enabled: boolean;
    last_fetched_at: string | null;
    last_error: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    url: string;
    source_type?: string;
    is_enabled?: boolean;
    last_fetched_at?: string | null;
    last_error?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    url?: string;
    source_type?: string;
    is_enabled?: boolean;
    last_fetched_at?: string | null;
    last_error?: string | null;
    created_at?: string;
    updated_at?: string;
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "feat: add feed_sources to database types"
```

---

### Task 3: Create feed domain types and update AgentName

**Files:**
- Create: `lib/types/feeds.ts`
- Modify: `lib/types/agents.ts`
- Modify: `lib/types/index.ts`

- [ ] **Step 1: Create lib/types/feeds.ts**

```typescript
// ---------------------------------------------------------------------------
// Feed Source (domain type, mirrors the DB table)
// ---------------------------------------------------------------------------

export type FeedSourceType = "rss" | "atom";

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  source_type: FeedSourceType;
  is_enabled: boolean;
  last_fetched_at: Date | null;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Feed Agent result
// ---------------------------------------------------------------------------

export interface FeedAgentResult {
  success: boolean;
  error?: string;
  feeds_fetched: number;
  feeds_failed: number;
  feeds_total: number;
  articles_found: number;
  articles_new: number;
  articles_duplicate: number;
  scores_refreshed: number;
}
```

- [ ] **Step 2: Update AgentName in lib/types/agents.ts**

Change the `AgentName` union type to include `"feed"`:

```typescript
export type AgentName = "discovery" | "news" | "qualification" | "queue" | "feed";
```

- [ ] **Step 3: Re-export from index.ts**

Add to `lib/types/index.ts`:

```typescript
export type * from "./feeds";
```

- [ ] **Step 4: Commit**

```bash
git add lib/types/feeds.ts lib/types/agents.ts lib/types/index.ts
git commit -m "feat: add FeedSource and FeedAgentResult types, update AgentName"
```

---

### Task 4: Add feed_sources query functions

**Files:**
- Modify: `lib/supabase/queries.ts`

- [ ] **Step 1: Add type aliases and mapper**

Add the row type alias alongside the others at the top:

```typescript
type FeedSourceRow = Database["public"]["Tables"]["feed_sources"]["Row"];
```

Add `FeedSource` to the existing type import from `@/lib/types`:

```typescript
import type {
  Account,
  Contact,
  Evidence,
  FeedSource,
  JobRun,
  NewsItem,
  Prospect,
} from "@/lib/types";
```

Add the mapper function alongside the others:

```typescript
function mapFeedSource(row: FeedSourceRow): FeedSource {
  return {
    ...row,
    last_fetched_at: row.last_fetched_at
      ? new Date(row.last_fetched_at)
      : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  } as FeedSource;
}
```

- [ ] **Step 2: Add CRUD functions**

Add at end of file:

```typescript
// ---------------------------------------------------------------------------
// Feed Sources
// ---------------------------------------------------------------------------

/** Fetch all feed sources, ordered by name. */
export async function fetchFeedSources(): Promise<FeedSource[]> {
  const { data, error } = await supabase
    .from("feed_sources")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapFeedSource);
}

/** Fetch only enabled feed sources. */
export async function fetchEnabledFeedSources(): Promise<FeedSource[]> {
  const { data, error } = await supabase
    .from("feed_sources")
    .select("*")
    .eq("is_enabled", true)
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapFeedSource);
}

/** Insert a new feed source. */
export async function insertFeedSource(
  name: string,
  url: string,
  sourceType: "rss" | "atom"
): Promise<FeedSource> {
  const { data, error } = await supabase
    .from("feed_sources")
    .insert({ name, url, source_type: sourceType } as never)
    .select("*")
    .single();
  if (error) throw error;
  return mapFeedSource(data as unknown as FeedSourceRow);
}

/** Toggle is_enabled for a feed source. */
export async function toggleFeedSource(
  id: string,
  isEnabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from("feed_sources")
    .update({ is_enabled: isEnabled } as never)
    .eq("id", id);
  if (error) throw error;
}

/** Delete a feed source. */
export async function deleteFeedSource(id: string): Promise<void> {
  const { error } = await supabase
    .from("feed_sources")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** Update last_fetched_at and optionally last_error for a feed source. */
export async function updateFeedSourceFetchStatus(
  id: string,
  lastError: string | null
): Promise<void> {
  const { error } = await supabase
    .from("feed_sources")
    .update({
      last_fetched_at: new Date().toISOString(),
      last_error: lastError,
    } as never)
    .eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/queries.ts
git commit -m "feat: add feed_sources CRUD queries"
```

---

## Chunk 2: Feed Parser Engine and Agent Orchestrator

### Task 5: Create the feed parser (pure function)

**Files:**
- Create: `lib/engine/parse-feed.ts`

- [ ] **Step 1: Write the feed parser**

This is a pure function — zero side effects, no DB calls. It takes raw XML and a source name, returns normalized article records.

```typescript
import { XMLParser } from "fast-xml-parser";
import type { RawArticleBatchInput } from "@/lib/types";

// ---------------------------------------------------------------------------
// XML Parser (configured once, reused)
// ---------------------------------------------------------------------------

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  isArray: (_name: string) => ["item", "entry"].includes(_name),
});

// ---------------------------------------------------------------------------
// Internal types for parsed XML structures
// ---------------------------------------------------------------------------

interface RssChannel {
  title?: string;
  item?: RssItem[];
}

interface RssItem {
  title?: string;
  link?: string;
  guid?: string | { "#text": string };
  pubDate?: string;
  description?: string;
  encoded?: string; // content:encoded (ns prefix stripped)
}

interface AtomEntry {
  title?: string | { "#text": string };
  link?: { "@_href"?: string } | Array<{ "@_href"?: string; "@_rel"?: string }>;
  id?: string;
  updated?: string;
  published?: string;
  summary?: string;
  content?: string | { "#text": string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractText(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && "#text" in val) {
    return String((val as Record<string, unknown>)["#text"]);
  }
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAtomLink(
  link: AtomEntry["link"]
): string {
  if (!link) return "";
  if (Array.isArray(link)) {
    const alt = link.find((l) => l["@_rel"] === "alternate");
    return (alt ?? link[0])?.["@_href"] ?? "";
  }
  return link["@_href"] ?? "";
}

function parseDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an RSS 2.0 or Atom XML string into normalized article records.
 *
 * Pure function — no side effects, no DB calls.
 * Returns an empty array if the XML cannot be parsed or contains no items.
 *
 * @param xml       The raw XML string from the feed
 * @param sourceName  Human-readable feed name (e.g. "DataCenter Knowledge")
 * @returns Normalized article batch inputs ready for the news agent
 */
export function parseFeed(
  xml: string,
  sourceName: string
): RawArticleBatchInput[] {
  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return [];
  }

  // Detect feed format and delegate
  if (parsed.rss) {
    return parseRss(parsed.rss as Record<string, unknown>, sourceName);
  }
  if (parsed.feed) {
    return parseAtom(parsed.feed as Record<string, unknown>, sourceName);
  }

  // Also handle RDF (RSS 1.0) — rare but possible
  if (parsed["RDF"]) {
    const rdf = parsed["RDF"] as Record<string, unknown>;
    const items = (rdf.item ?? []) as RssItem[];
    return normalizeRssItems(Array.isArray(items) ? items : [items], sourceName);
  }

  return [];
}

// ---------------------------------------------------------------------------
// RSS 2.0
// ---------------------------------------------------------------------------

function parseRss(
  rss: Record<string, unknown>,
  sourceName: string
): RawArticleBatchInput[] {
  const channel = rss.channel as RssChannel | undefined;
  if (!channel?.item) return [];
  const items = Array.isArray(channel.item) ? channel.item : [channel.item];
  return normalizeRssItems(items, sourceName);
}

function normalizeRssItems(
  items: RssItem[],
  sourceName: string
): RawArticleBatchInput[] {
  const results: RawArticleBatchInput[] = [];

  for (const item of items) {
    const title = (item.title ?? "").trim();
    const sourceUrl = (item.link ?? "").trim();
    if (!title || !sourceUrl) continue;

    const rawBody = item.encoded ?? item.description ?? "";
    const body = truncate(stripHtml(rawBody), 2000);

    results.push({
      title,
      body,
      source_url: sourceUrl,
      source_name: sourceName,
      published_at: parseDate(item.pubDate),
      mentioned_companies: [],
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Atom
// ---------------------------------------------------------------------------

function parseAtom(
  feed: Record<string, unknown>,
  sourceName: string
): RawArticleBatchInput[] {
  const entries = (feed.entry ?? []) as AtomEntry[];
  const items = Array.isArray(entries) ? entries : [entries];
  const results: RawArticleBatchInput[] = [];

  for (const entry of items) {
    const title = extractText(entry.title).trim();
    const sourceUrl = extractAtomLink(entry.link).trim();
    if (!title || !sourceUrl) continue;

    const rawBody = extractText(entry.content) || (entry.summary ?? "");
    const body = truncate(stripHtml(typeof rawBody === "string" ? rawBody : ""), 2000);

    results.push({
      title,
      body: body || "",
      source_url: sourceUrl,
      source_name: sourceName,
      published_at: parseDate(entry.published ?? entry.updated),
      mentioned_companies: [],
    });
  }

  return results;
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add lib/engine/parse-feed.ts
git commit -m "feat: add pure RSS/Atom feed parser engine"
```

---

### Task 6: Create the feed agent orchestrator

**Files:**
- Create: `lib/agents/feed-agent.ts`

- [ ] **Step 1: Write the feed agent**

```typescript
import type { FeedAgentResult } from "@/lib/types";
import { parseFeed } from "@/lib/engine/parse-feed";
import { runNewsAgent } from "@/lib/agents/news-agent";
import {
  insertJobRun,
  completeJobRun,
  failJobRun,
  fetchEnabledFeedSources,
  updateFeedSourceFetchStatus,
} from "@/lib/supabase/queries";

// ---------------------------------------------------------------------------
// Feed Agent orchestrator
// ---------------------------------------------------------------------------

/**
 * Fetches all enabled RSS/Atom feeds, parses them, deduplicates,
 * and passes new articles into the existing news agent pipeline.
 *
 * Idempotent: re-running produces zero new inserts if feeds haven't changed,
 * because the news agent deduplicates by source_url.
 *
 * Note: This creates TWO job_runs entries per execution — one "feed" run
 * (this orchestrator) and one "news" run (from runNewsAgent). This is
 * intentional: the feed run tracks fetch/parse activity, while the news
 * run tracks interpretation/linking/scoring. Both are visible on the
 * Agent Runs admin page.
 */
export async function runFeedAgent(): Promise<FeedAgentResult> {
  const jobId = await insertJobRun("feed");
  const startTime = Date.now();

  try {
    const feeds = await fetchEnabledFeedSources();

    let feedsFetched = 0;
    let feedsFailed = 0;
    let articlesFound = 0;
    const allArticles: Array<{
      title: string;
      body: string;
      source_url: string;
      source_name: string;
      published_at: string;
      mentioned_companies: string[];
    }> = [];

    for (const feed of feeds) {
      try {
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "InfraSignal/1.0 (RSS Reader)" },
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const xml = await response.text();
        const articles = parseFeed(xml, feed.name);

        articlesFound += articles.length;
        allArticles.push(...articles);
        feedsFetched++;
        await updateFeedSourceFetchStatus(feed.id, null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        feedsFailed++;
        await updateFeedSourceFetchStatus(feed.id, msg);
      }
    }

    // Delegate to news agent for dedup + interpretation + linking + scoring
    let articlesNew = 0;
    let articlesDuplicate = 0;
    let scoresRefreshed = 0;

    if (allArticles.length > 0) {
      const newsResult = await runNewsAgent(allArticles);
      articlesNew = newsResult.ingested;
      articlesDuplicate = newsResult.skipped_duplicate;
      scoresRefreshed = newsResult.scores_refreshed;
    }

    const result: FeedAgentResult = {
      success: true,
      feeds_fetched: feedsFetched,
      feeds_failed: feedsFailed,
      feeds_total: feeds.length,
      articles_found: articlesFound,
      articles_new: articlesNew,
      articles_duplicate: articlesDuplicate,
      scores_refreshed: scoresRefreshed,
    };

    const durationMs = Date.now() - startTime;
    await completeJobRun(
      jobId,
      result as unknown as Record<string, unknown>,
      durationMs
    );
    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await failJobRun(jobId, errorMessage, durationMs);
    return {
      success: false,
      error: errorMessage,
      feeds_fetched: 0,
      feeds_failed: 0,
      feeds_total: 0,
      articles_found: 0,
      articles_new: 0,
      articles_duplicate: 0,
      scores_refreshed: 0,
    };
  }
}
```

- [ ] **Step 2: Update the agent_name CHECK constraint**

The `job_runs.agent_name` CHECK constraint currently only allows `'discovery','news','qualification','queue'`. We need to add `'feed'`.

Create migration `supabase/migrations/005_add_feed_agent_name.sql`:

```sql
-- Allow 'feed' as an agent_name in job_runs
ALTER TABLE job_runs DROP CONSTRAINT job_runs_agent_name_check;
ALTER TABLE job_runs ADD CONSTRAINT job_runs_agent_name_check
  CHECK (agent_name IN ('discovery', 'news', 'qualification', 'queue', 'feed'));
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add lib/agents/feed-agent.ts supabase/migrations/005_add_feed_agent_name.sql
git commit -m "feat: add feed agent orchestrator and agent_name constraint update"
```

---

## Chunk 3: Server Actions, API Route, and Scheduling

### Task 7: Create feed server actions

**Files:**
- Create: `lib/actions/feed-actions.ts`

- [ ] **Step 1: Write the server actions**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { runFeedAgent } from "@/lib/agents/feed-agent";
import {
  insertFeedSource,
  toggleFeedSource,
  deleteFeedSource,
} from "@/lib/supabase/queries";
import type { FeedAgentResult, FeedSource } from "@/lib/types";

// ---------------------------------------------------------------------------
// Feed source management
// ---------------------------------------------------------------------------

export async function addFeedSource(
  name: string,
  url: string,
  sourceType: "rss" | "atom"
): Promise<{ success: boolean; error?: string; feedSource?: FeedSource }> {
  try {
    const feedSource = await insertFeedSource(name, url, sourceType);
    revalidatePath("/admin/feeds");
    return { success: true, feedSource };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function toggleFeedSourceEnabled(
  id: string,
  isEnabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await toggleFeedSource(id, isEnabled);
    revalidatePath("/admin/feeds");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function removeFeedSource(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteFeedSource(id);
    revalidatePath("/admin/feeds");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Feed refresh
// ---------------------------------------------------------------------------

export async function triggerFeedAgent(): Promise<FeedAgentResult> {
  const result = await runFeedAgent();
  revalidatePath("/intelligence");
  revalidatePath("/prospecting");
  revalidatePath("/dashboard");
  revalidatePath("/admin/agents");
  revalidatePath("/admin/feeds");
  return result;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/feed-actions.ts
git commit -m "feat: add feed source management server actions"
```

---

### Task 8: Create API route and update cron schedule

**Files:**
- Create: `app/api/agents/feeds/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/agents/auth";
import { runFeedAgent } from "@/lib/agents/feed-agent";

// ---------------------------------------------------------------------------
// GET /api/agents/feeds
// Triggered by Vercel Cron (daily at 5:00 AM UTC) or manual invocation.
// Auth: CRON_SECRET (Bearer header or ?token= query param)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runFeedAgent();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
```

- [ ] **Step 2: Update vercel.json**

Replace the existing `vercel.json` with:

```json
{
  "crons": [
    {
      "path": "/api/agents/feeds",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/agents/qualification",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/agents/queue",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Note the ordering: feeds at 5am UTC (fetches news first), then qualification at 6am, then queue at 7am. This ensures new news items are ingested before qualification and scoring run.

- [ ] **Step 3: Commit**

```bash
git add app/api/agents/feeds/route.ts vercel.json
git commit -m "feat: add feed agent API route and cron schedule"
```

---

## Chunk 4: Admin UI

### Task 9: Create the feed source form component

**Files:**
- Create: `components/admin/feed-source-form.tsx`

- [ ] **Step 1: Write the form component**

```typescript
"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { addFeedSource } from "@/lib/actions/feed-actions";

export function FeedSourceForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const url = (formData.get("url") as string).trim();
    const sourceType = ((formData.get("source_type") as string) || "rss") as "rss" | "atom";

    if (!name || !url) {
      setError("Name and URL are required.");
      return;
    }

    startTransition(async () => {
      const result = await addFeedSource(name, url, sourceType);
      if (result.success) {
        setSuccess(true);
        form.reset();
      } else {
        setError(result.error ?? "Failed to add feed source.");
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

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          {isPending ? "Adding..." : "Add Feed"}
        </button>

        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Feed source added successfully.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
      </form>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/feed-source-form.tsx
git commit -m "feat: add feed source form component"
```

---

### Task 10: Create the feed source list component

**Files:**
- Create: `components/admin/feed-source-list.tsx`

- [ ] **Step 1: Write the list component**

```typescript
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
      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
        {formatDate(feed.last_fetched_at)}
        {feed.last_error && (
          <span className="ml-2 text-xs text-red-500" title={feed.last_error}>
            (error)
          </span>
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
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/feed-source-list.tsx
git commit -m "feat: add feed source list component"
```

---

### Task 11: Create the feed refresh button component

**Files:**
- Create: `components/admin/feed-refresh-button.tsx`

- [ ] **Step 1: Write the refresh button**

```typescript
"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { triggerFeedAgent } from "@/lib/actions/feed-actions";
import type { FeedAgentResult } from "@/lib/types";

export function FeedRefreshButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FeedAgentResult | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await triggerFeedAgent();
      setResult(res);
    });
  }

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          Manual Feed Refresh
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Fetches all enabled feeds, parses new articles, and passes them
          through the news agent pipeline. Runs daily at 5:00 AM UTC via Vercel
          Cron.
        </p>

        <button
          onClick={handleClick}
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {isPending ? "Fetching feeds..." : "Refresh All Feeds"}
        </button>

        {result?.success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Fetched {result.feeds_fetched} of {result.feeds_total} feeds
              {result.feeds_failed > 0 && (
                <> ({result.feeds_failed} failed)</>
              )}
              . Found {result.articles_found} articles: {result.articles_new}{" "}
              new, {result.articles_duplicate} duplicate.
              {result.scores_refreshed > 0 && (
                <> Refreshed {result.scores_refreshed} prospect scores.</>
              )}
            </p>
          </div>
        )}

        {result && !result.success && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {result.error ?? "An error occurred while fetching feeds."}
          </div>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/feed-refresh-button.tsx
git commit -m "feat: add feed refresh button component"
```

---

### Task 12: Create the admin feeds page and update navigation

**Files:**
- Create: `app/(crm)/admin/feeds/page.tsx`
- Modify: `lib/constants/navigation.ts`

- [ ] **Step 1: Create the admin feeds page**

```typescript
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { FeedSourceForm } from "@/components/admin/feed-source-form";
import { FeedSourceList } from "@/components/admin/feed-source-list";
import { FeedRefreshButton } from "@/components/admin/feed-refresh-button";
import { fetchFeedSources } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const columns = [
  { key: "name", label: "Name" },
  { key: "url", label: "Feed URL" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "last_fetched", label: "Last Fetched" },
  { key: "actions", label: "" },
];

export default async function FeedSourcesPage() {
  const feeds = await fetchFeedSources();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feed Sources"
        description="Manage RSS and Atom feed sources for automated news ingestion"
      />

      <FeedSourceForm />

      <FeedRefreshButton />

      <DataTable columns={columns}>
        {feeds.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              No feed sources configured yet.
            </td>
          </tr>
        ) : (
          <FeedSourceList feeds={feeds} />
        )}
      </DataTable>
    </div>
  );
}
```

- [ ] **Step 2: Update navigation**

In `lib/constants/navigation.ts`:

1. Add `Rss` to the lucide-react import (alongside the existing icons).
2. The final `ADMIN_NAV_ITEMS` array should be:

```typescript
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "News Ingestion", href: "/admin/ingest", icon: Wrench },
  { label: "Feed Sources", href: "/admin/feeds", icon: Rss },
  { label: "Refresh Scores", href: "/admin/scores", icon: RefreshCw },
  { label: "Qualification", href: "/admin/qualify", icon: ShieldCheck },
  { label: "Agent Runs", href: "/admin/agents", icon: Bot },
];
```

- [ ] **Step 3: Run type check and build**

```bash
npx tsc --noEmit
npx next build
```

Expected: zero errors, all routes visible including `f /admin/feeds` and `f /api/agents/feeds`.

- [ ] **Step 4: Commit**

```bash
git add "app/(crm)/admin/feeds/page.tsx" lib/constants/navigation.ts
git commit -m "feat: add feed sources admin page and navigation"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 | 1-4 | Database table, types, queries — the data layer |
| 2 | 5-6 | Pure feed parser + agent orchestrator — the processing layer |
| 3 | 7-8 | Server actions, API route, cron schedule — the trigger layer |
| 4 | 9-12 | Admin UI (form, list, refresh, page, nav) — the management layer |

**Total new files:** 11 (includes migration 005)
**Modified files:** 6 (`database.types.ts`, `types/agents.ts`, `types/index.ts`, `queries.ts`, `navigation.ts`, `vercel.json`)
