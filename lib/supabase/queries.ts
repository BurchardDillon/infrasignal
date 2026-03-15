import { supabase } from "./client";
import type { Database, Json } from "./database.types";
import type {
  Account,
  Contact,
  Evidence,
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
