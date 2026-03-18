import type { ProspectSource } from "./enums";

// ---------------------------------------------------------------------------
// Agent names
// ---------------------------------------------------------------------------

export type AgentName = "discovery" | "news" | "qualification" | "queue" | "feed";

// ---------------------------------------------------------------------------
// Job Run (domain type, mirrors the DB table)
// ---------------------------------------------------------------------------

export interface JobRun {
  id: string;
  agent_name: AgentName;
  status: "running" | "completed" | "failed";
  started_at: Date;
  completed_at: Date | null;
  duration_ms: number | null;
  summary: Record<string, unknown>;
  error: string | null;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Discovery Agent
// ---------------------------------------------------------------------------

export interface CompanyDiscoveryInput {
  company_name: string;
  domain?: string | null;
  industry?: string | null;
  hq_location?: string | null;
  country?: string;
  source?: ProspectSource;
  notes?: string | null;
  hardware_hints?: string[];
}

export interface DiscoveryAgentResult {
  success: boolean;
  error?: string;
  created: number;
  skipped_non_us: number;
  skipped_duplicate: number;
  total: number;
  details: Array<{
    company_name: string;
    outcome: "created" | "skipped_non_us" | "skipped_duplicate";
    reason?: string;
    prospect_id?: string;
  }>;
}

// ---------------------------------------------------------------------------
// News Agent
// ---------------------------------------------------------------------------

export interface RawArticleBatchInput {
  title: string;
  body: string;
  source_url: string;
  source_name: string;
  published_at: string;
  mentioned_companies: string[];
}

export interface NewsAgentResult {
  success: boolean;
  error?: string;
  ingested: number;
  skipped_duplicate: number;
  total: number;
  scores_refreshed: number;
}

// ---------------------------------------------------------------------------
// Qualification Agent
// ---------------------------------------------------------------------------

export interface QualificationAgentResult {
  success: boolean;
  error?: string;
  accounts_updated: number;
  accounts_total: number;
  prospects_updated: number;
  prospects_total: number;
}

// ---------------------------------------------------------------------------
// Queue Agent
// ---------------------------------------------------------------------------

export interface QueueAgentResult {
  success: boolean;
  error?: string;
  updated: number;
  total: number;
}
