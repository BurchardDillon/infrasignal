import { supabase } from "./client";
import type { Database, Json } from "./database.types";
import type {
  Account,
  Contact,
  DiscoverySource,
  DiscoverySourceType,
  Evidence,
  FeedSource,
  JobRun,
  NewsItem,
  Prospect,
} from "@/lib/types";
import type { ComponentFit, ComponentImpact, NewsAccountLink } from "@/lib/types";

// ---------------------------------------------------------------------------
// Row type aliases
// ---------------------------------------------------------------------------
type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type EvidenceRow = Database["public"]["Tables"]["evidence"]["Row"];
type NewsRow = Database["public"]["Tables"]["news_items"]["Row"];
type ProspectRow = Database["public"]["Tables"]["prospects"]["Row"];
type JobRunRow = Database["public"]["Tables"]["job_runs"]["Row"];
type FeedSourceRow = Database["public"]["Tables"]["feed_sources"]["Row"];
type DiscoverySourceRow = Database["public"]["Tables"]["discovery_sources"]["Row"];
type ProspectInsertRow = Database["public"]["Tables"]["prospects"]["Insert"];

// ---------------------------------------------------------------------------
// Row → Domain mappers
// ---------------------------------------------------------------------------
// Supabase returns strings for dates and enum columns, and Json for jsonb.
// These mappers cast back to our strict domain types.

function toDate(v: string | null): Date | null {
  return v ? new Date(v) : null;
}

function mapAccount(row: AccountRow): Account {
  return {
    ...row,
    component_fit: row.component_fit as unknown as ComponentFit[],
    hardware_categories: row.hardware_categories,
    last_reviewed_at: toDate(row.last_reviewed_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  } as Account;
}

function mapContact(row: ContactRow): Contact {
  return {
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  } as Contact;
}

function mapEvidence(row: EvidenceRow): Evidence {
  return {
    ...row,
    hardware_categories: row.hardware_categories,
    detected_at: new Date(row.detected_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  } as Evidence;
}

function mapNewsItem(row: NewsRow): NewsItem {
  return {
    ...row,
    component_impact: row.component_impact as unknown as ComponentImpact[],
    hardware_categories: row.hardware_categories,
    linked_accounts: row.linked_accounts as unknown as NewsAccountLink[],
    published_at: new Date(row.published_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  } as NewsItem;
}

function mapProspect(row: ProspectRow): Prospect {
  return {
    ...row,
    hardware_categories: row.hardware_categories,
    promoted_at: toDate(row.promoted_at),
    dismissed_at: toDate(row.dismissed_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  } as Prospect;
}

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

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("company_name");
  if (error) throw error;
  return (data ?? []).map(mapAccount);
}

export async function fetchAccountById(id: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data ? mapAccount(data) : null;
}

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map(mapContact);
}

export async function fetchContactsByAccountId(
  accountId: string
): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("account_id", accountId)
    .order("contact_priority");
  if (error) throw error;
  return (data ?? []).map(mapContact);
}

export async function fetchEvidence(): Promise<Evidence[]> {
  const { data, error } = await supabase
    .from("evidence")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapEvidence);
}

export async function fetchEvidenceByAccountId(
  accountId: string
): Promise<Evidence[]> {
  const { data, error } = await supabase
    .from("evidence")
    .select("*")
    .eq("account_id", accountId)
    .order("detected_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapEvidence);
}

export async function fetchNewsItems(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapNewsItem);
}

export async function fetchNewsByAccountId(
  accountId: string
): Promise<NewsItem[]> {
  // News items linked to an account via account_id OR via linked_accounts jsonb
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .or(
      `account_id.eq.${accountId},linked_accounts.cs.[{"account_id":"${accountId}"}]`
    )
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapNewsItem);
}

export async function fetchProspects(): Promise<Prospect[]> {
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("priority_score", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProspect);
}

// ---------------------------------------------------------------------------
// Dashboard aggregates
// ---------------------------------------------------------------------------

export async function fetchDashboardStats(): Promise<{
  totalAccounts: number;
  prospectsInQueue: number;
  evidenceCount: number;
  newsCount: number;
}> {
  const [accounts, prospects, evidence, news] = await Promise.all([
    supabase.from("accounts").select("id", { count: "exact", head: true }),
    supabase
      .from("prospects")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "reviewing"]),
    supabase.from("evidence").select("id", { count: "exact", head: true }),
    supabase.from("news_items").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalAccounts: accounts.count ?? 0,
    prospectsInQueue: prospects.count ?? 0,
    evidenceCount: evidence.count ?? 0,
    newsCount: news.count ?? 0,
  };
}

export async function fetchTopProspects(limit = 3): Promise<Prospect[]> {
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("priority_score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapProspect);
}

export async function fetchRecentIntelligence(
  limit = 5
): Promise<Array<Evidence | NewsItem>> {
  const [evidenceResult, newsResult] = await Promise.all([
    supabase
      .from("evidence")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("news_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (evidenceResult.error) throw evidenceResult.error;
  if (newsResult.error) throw newsResult.error;

  const evidenceItems = (evidenceResult.data ?? []).map(mapEvidence);
  const newsItems = (newsResult.data ?? []).map(mapNewsItem);

  // Merge and sort by created_at descending, take top N
  return [...evidenceItems, ...newsItems]
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

type NewsInsertRow = Database["public"]["Tables"]["news_items"]["Insert"];

/** Insert a fully-prepared news item into the news_items table. */
export async function insertNewsItem(
  item: NewsInsertRow
): Promise<NewsItem> {
  const { data, error } = await supabase
    .from("news_items")
    .insert(item as never)
    .select("*")
    .single();
  if (error) throw error;
  return mapNewsItem(data as unknown as NewsRow);
}

/** Update a prospect's priority_score. */
export async function updateProspectScore(
  id: string,
  priority_score: number
): Promise<void> {
  const { error } = await supabase
    .from("prospects")
    .update({ priority_score } as never)
    .eq("id", id);
  if (error) throw error;
}

/** Fetch accounts (id, company_name, domain) for auto-linking news items. */
export async function fetchAccountsForLinking(): Promise<
  Array<{ id: string; company_name: string; domain: string | null }>
> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("company_name");
  if (error) throw error;
  const rows = (data ?? []) as AccountRow[];
  return rows.map((r) => ({
    id: r.id,
    company_name: r.company_name,
    domain: r.domain,
  }));
}

/** Update an account's qualification fields. */
export async function updateAccountQualification(
  id: string,
  fields: {
    direct_buy_likelihood: string;
    infra_ownership_verdict: string;
    evidence_strength: string;
    why_it_matters: string | null;
    negative_signals: string | null;
    component_fit: ComponentFit[];
  }
): Promise<void> {
  const { error } = await supabase
    .from("accounts")
    .update({
      direct_buy_likelihood: fields.direct_buy_likelihood,
      infra_ownership_verdict: fields.infra_ownership_verdict,
      evidence_strength: fields.evidence_strength,
      why_it_matters: fields.why_it_matters,
      negative_signals: fields.negative_signals,
      component_fit: fields.component_fit as unknown as Json,
    } as never)
    .eq("id", id);
  if (error) throw error;
}

/** Update a prospect's qualification fields. */
export async function updateProspectQualification(
  id: string,
  fields: {
    proposed_direct_buy_likelihood: string;
    proposed_infra_ownership_verdict: string;
    priority_score: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from("prospects")
    .update(fields as never)
    .eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Account name lookup (for contacts table, news feed)
// ---------------------------------------------------------------------------

export async function fetchAccountNameMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("company_name");
  if (error) throw error;
  const rows = (data ?? []) as AccountRow[];
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.id, row.company_name);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Job Run queries
// ---------------------------------------------------------------------------

function mapJobRun(row: JobRunRow): JobRun {
  return {
    ...row,
    summary: row.summary as Record<string, unknown>,
    started_at: new Date(row.started_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  } as JobRun;
}

/** Create a new job_run record with status 'running'. Returns the row id. */
export async function insertJobRun(agentName: string): Promise<string> {
  const { data, error } = await supabase
    .from("job_runs")
    .insert({ agent_name: agentName } as never)
    .select("id")
    .single();
  if (error) throw error;
  return (data as unknown as { id: string }).id;
}

/** Mark a job_run as completed with summary. */
export async function completeJobRun(
  id: string,
  summary: Record<string, unknown>,
  durationMs: number
): Promise<void> {
  const { error } = await supabase
    .from("job_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      summary: summary as unknown as Json,
    } as never)
    .eq("id", id);
  if (error) throw error;
}

/** Mark a job_run as failed with error message. */
export async function failJobRun(
  id: string,
  errorMessage: string,
  durationMs: number
): Promise<void> {
  const { error } = await supabase
    .from("job_runs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      error: errorMessage,
    } as never)
    .eq("id", id);
  if (error) throw error;
}

/** Fetch recent job runs, optionally filtered by agent_name. */
export async function fetchJobRuns(
  agentName?: string,
  limit = 20
): Promise<JobRun[]> {
  let query = supabase
    .from("job_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (agentName) {
    query = query.eq("agent_name", agentName);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapJobRun);
}

// ---------------------------------------------------------------------------
// Deduplication lookups
// ---------------------------------------------------------------------------

/** Fetch all existing prospect domains (non-null) for deduplication. */
export async function fetchProspectDomains(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("prospects")
    .select("domain")
    .not("domain", "is", null);
  if (error) throw error;
  const rows = (data ?? []) as unknown as { domain: string }[];
  return new Set(rows.map((r) => r.domain.toLowerCase()));
}

/** Fetch all existing account domains (non-null) for deduplication. */
export async function fetchAccountDomains(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("accounts")
    .select("domain")
    .not("domain", "is", null);
  if (error) throw error;
  const rows = (data ?? []) as unknown as { domain: string }[];
  return new Set(rows.map((r) => r.domain.toLowerCase()));
}

/** Fetch all existing account company names (normalized lowercase). */
export async function fetchAccountCompanyNames(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("accounts")
    .select("company_name");
  if (error) throw error;
  const rows = (data ?? []) as unknown as { company_name: string }[];
  return new Set(rows.map((r) => r.company_name.toLowerCase().trim()));
}

/** Fetch all existing news_items source_urls for deduplication. */
export async function fetchNewsSourceUrls(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("news_items")
    .select("source_url");
  if (error) throw error;
  const rows = (data ?? []) as unknown as { source_url: string }[];
  return new Set(rows.map((r) => r.source_url));
}

// ---------------------------------------------------------------------------
// Prospect insert (for Discovery Agent)
// ---------------------------------------------------------------------------

/** Insert a new prospect. Returns the created prospect. */
export async function insertProspect(
  item: ProspectInsertRow
): Promise<Prospect> {
  const { data, error } = await supabase
    .from("prospects")
    .insert(item as never)
    .select("*")
    .single();
  if (error) throw error;
  return mapProspect(data as unknown as ProspectRow);
}

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

// ---------------------------------------------------------------------------
// Discovery Sources
// ---------------------------------------------------------------------------

function mapDiscoverySource(row: DiscoverySourceRow): DiscoverySource {
  return {
    ...row,
    source_type: row.source_type as DiscoverySourceType,
    last_run_at: row.last_run_at ? new Date(row.last_run_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

/** Fetch all discovery sources, ordered by most recent first. */
export async function fetchDiscoverySources(): Promise<DiscoverySource[]> {
  const { data, error } = await supabase
    .from("discovery_sources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDiscoverySource);
}

/**
 * Upsert a discovery source by source_key.
 * When source_key is non-null, uses onConflict to update existing rows.
 * When source_key is null, always inserts a new row (NULL doesn't conflict).
 * Returns the source id.
 */
export async function upsertDiscoverySource(fields: {
  name: string;
  source_type: DiscoverySourceType;
  source_key: string | null;
  record_count: number;
  notes?: string | null;
}): Promise<string> {
  const { data, error } = await supabase
    .from("discovery_sources")
    .upsert(
      {
        name: fields.name,
        source_type: fields.source_type,
        source_key: fields.source_key,
        record_count: fields.record_count,
        notes: fields.notes ?? null,
      } as never,
      { onConflict: "source_key" }
    )
    .select("id")
    .single();
  if (error) throw error;
  return (data as unknown as { id: string }).id;
}

/** Update last_run_at and last_run_job_id after a discovery run completes. */
export async function updateDiscoverySourceRunStatus(
  id: string,
  jobId: string
): Promise<void> {
  const { error } = await supabase
    .from("discovery_sources")
    .update({
      last_run_at: new Date().toISOString(),
      last_run_job_id: jobId,
    } as never)
    .eq("id", id);
  if (error) throw error;
}

/** Fetch the most recent job_run id for a given agent. */
export async function fetchLatestJobRunId(
  agentName: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("job_runs")
    .select("id")
    .eq("agent_name", agentName)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return (data as unknown as { id: string }).id;
}

/** Fetch a single discovery source by source_key. Returns null if not found. */
export async function fetchDiscoverySourceByKey(
  sourceKey: string
): Promise<DiscoverySource | null> {
  const { data, error } = await supabase
    .from("discovery_sources")
    .select("*")
    .eq("source_key", sourceKey)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data ? mapDiscoverySource(data as unknown as DiscoverySourceRow) : null;
}
