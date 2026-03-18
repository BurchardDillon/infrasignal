export interface ComponentLookup {
  id: string;
  part_number: string;
  manufacturer: string | null;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  socket_platform: string | null;
  ecosystem: string | null;
  specs: Record<string, unknown>;
  source: string;
  created_at: Date;
  updated_at: Date;
}

export interface AccountHardwarePrefs {
  id: string;
  account_id: string;
  buys_cpus: boolean;
  buys_gpus: boolean;
  buys_memory: boolean;
  buys_ssds: boolean;
  buys_networking: boolean;
  buys_systems: boolean;
  buys_frus: boolean;
  cpu_ecosystem: string[];
  gpu_ecosystem: string[];
  platforms: string[];
  account_type: string | null;
  notes: string | null;
}

export interface PnMatchResult {
  account_id: string;
  company_name: string;
  domain: string | null;
  hq_location: string | null;
  company_type: string | null;
  direct_buy_likelihood: string | null;
  evidence_strength: string | null;
  hardware_categories: string[];
  why_it_matters: string | null;
  notes: string | null;
  match_score: number;
  match_reasons: string[];
  deal_history_count: number;
  last_deal_date: string | null;
  // Fields populated after web investigation
  was_researched: boolean;
  research_summary: string | null;
  relevance_score: number | null;
  infra_scale: string | null;
  expanding: boolean | null;
  direct_buy_signal: string | null;
}

export interface PnLookupResponse {
  component: ComponentLookup | null;
  matches: PnMatchResult[];
  resolved_by: string;
  total_accounts_searched: number;
  message?: string;
}

export interface WebIntelResult {
  accounts_researched: number;
  accounts_updated: number;
}

export interface PnLookupResponseWithWebIntel extends PnLookupResponse {
  web_intel?: WebIntelResult;
}

export interface DealHistoryEntry {
  id: string;
  account_id: string;
  part_number: string;
  manufacturer: string | null;
  description: string | null;
  quantity: number | null;
  direction: "buy" | "sell" | "rfq";
  deal_date: string | null;
  notes: string | null;
  created_at: Date;
}

// SSE event types for streaming investigation progress
export interface InvestigationProgressEvent {
  type: "progress";
  account: string;
  status: "done" | "error";
  score: number;
  total: number;
  completed: number;
}

export interface InvestigationCompleteEvent {
  type: "complete";
  result: PnLookupResponseWithWebIntel;
}
