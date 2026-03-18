import { XMLParser } from "fast-xml-parser";
import type { RawArticleBatchInput, FeedValidationResult } from "@/lib/types";

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
  link?:
    | { "@_href"?: string }
    | Array<{ "@_href"?: string; "@_rel"?: string }>;
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

/**
 * Extract the dedup key for an RSS item.
 * Prefer link (a real URL); fall back to guid if link is missing.
 */
function extractRssDedup(item: RssItem): string {
  const link = (item.link ?? "").trim();
  if (link) return link;
  // guid fallback
  return extractText(item.guid).trim();
}

function extractAtomLink(link: AtomEntry["link"]): string {
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
// Bot mitigation / HTML detection
// ---------------------------------------------------------------------------

const BOT_MITIGATION_MARKERS = [
  "just a moment",
  "checking your browser",
  "cf-browser-verification",
  "cloudflare",
  "ddos-guard",
  "sucuri",
  "incapsula",
  "access denied",
  "enable javascript",
  "ray id",
];

/**
 * Detect if response body is an HTML page rather than XML feed.
 * Checks for HTML doctype/tags and bot mitigation markers.
 */
function detectHtmlOrBotMitigation(
  body: string
): { isHtml: boolean; isBotMitigation: boolean } {
  const lower = body.slice(0, 5000).toLowerCase();

  // Check if it's HTML at all
  const isHtml =
    lower.includes("<!doctype html") ||
    lower.includes("<html") ||
    (lower.includes("<head") && lower.includes("<body"));

  if (!isHtml) return { isHtml: false, isBotMitigation: false };

  // Check for bot mitigation markers
  const isBotMitigation = BOT_MITIGATION_MARKERS.some((marker) =>
    lower.includes(marker)
  );

  return { isHtml: true, isBotMitigation };
}

/**
 * Detect whether parsed XML is RSS or Atom format.
 */
function detectFeedType(
  parsed: Record<string, unknown>
): "rss" | "atom" | null {
  if (parsed.rss || parsed["RDF"]) return "rss";
  if (parsed.feed) return "atom";
  return null;
}

// ---------------------------------------------------------------------------
// Public API: Validation
// ---------------------------------------------------------------------------

/**
 * Validate a feed URL by fetching it and checking:
 * 1. HTTP status is 200
 * 2. Response is XML, not HTML
 * 3. No bot mitigation / Cloudflare challenge
 * 4. Parses as valid RSS or Atom with at least one item
 *
 * NOT a pure function — performs a network fetch. Used only at feed-add time.
 */
export async function validateFeedUrl(
  url: string
): Promise<FeedValidationResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": "InfraSignal/1.0 (RSS Reader)" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("timeout") || msg.includes("abort")) {
      return { valid: false, error: "Feed request timed out after 15 seconds" };
    }
    return { valid: false, error: `Failed to fetch feed: ${msg}` };
  }

  if (!response.ok) {
    return { valid: false, error: `Feed returned HTTP ${response.status}` };
  }

  let body: string;
  try {
    body = await response.text();
  } catch {
    return { valid: false, error: "Failed to read feed response body" };
  }

  if (!body.trim()) {
    return { valid: false, error: "Feed returned an empty response" };
  }

  // Check for HTML / bot mitigation
  const { isHtml, isBotMitigation } = detectHtmlOrBotMitigation(body);
  if (isBotMitigation) {
    return {
      valid: false,
      error:
        "Feed is protected by bot mitigation and cannot be used for unattended ingestion",
    };
  }
  if (isHtml) {
    return {
      valid: false,
      error: "Feed returned HTML instead of RSS/Atom XML",
    };
  }

  // Try to parse as XML
  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(body) as Record<string, unknown>;
  } catch {
    return {
      valid: false,
      error: "Feed content is not valid XML",
    };
  }

  // Detect feed type
  const feedType = detectFeedType(parsed);
  if (!feedType) {
    return {
      valid: false,
      error:
        "Content is valid XML but not a recognized RSS or Atom feed",
    };
  }

  // Try to parse items
  const articles = parseFeed(body, "validation");
  if (articles.length === 0) {
    return {
      valid: false,
      error: "Feed parsed successfully but contains no items",
    };
  }

  return {
    valid: true,
    item_count: articles.length,
    detected_type: feedType,
  };
}

// ---------------------------------------------------------------------------
// Public API: Parsing
// ---------------------------------------------------------------------------

/**
 * Parse an RSS 2.0 or Atom XML string into normalized article records.
 *
 * Pure function — no side effects, no DB calls.
 * Returns an empty array if the XML cannot be parsed or contains no items.
 *
 * Dedup key strategy:
 * - RSS: uses link as source_url; falls back to guid if link is missing
 * - Atom: uses link[rel=alternate] href; falls back to entry id
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
    return normalizeRssItems(
      Array.isArray(items) ? items : [items],
      sourceName
    );
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
    const sourceUrl = extractRssDedup(item);
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
    // Prefer link; fall back to entry id
    const sourceUrl =
      extractAtomLink(entry.link).trim() || (entry.id ?? "").trim();
    if (!title || !sourceUrl) continue;

    const rawBody = extractText(entry.content) || (entry.summary ?? "");
    const body = truncate(
      stripHtml(typeof rawBody === "string" ? rawBody : ""),
      2000
    );

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
