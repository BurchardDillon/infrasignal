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
// Feed validation (used when adding a new feed source)
// ---------------------------------------------------------------------------

export interface FeedValidationResult {
  valid: boolean;
  error?: string;
  item_count?: number;
  detected_type?: "rss" | "atom";
}

// ---------------------------------------------------------------------------
// Feed Agent result
// ---------------------------------------------------------------------------

export interface FeedFetchDetail {
  name: string;
  status: "ok" | "error";
  articles_found: number;
  error?: string;
}

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
  feed_details: FeedFetchDetail[];
}
