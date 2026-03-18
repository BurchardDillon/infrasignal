import type { CompanyDiscoveryInput } from "./agents";

export type DiscoverySourceType =
  | "csv_upload"
  | "pasted_list"
  | "seed_expansion";

export interface DiscoverySource {
  id: string;
  name: string;
  source_type: DiscoverySourceType;
  source_key: string | null;
  is_enabled: boolean;
  record_count: number | null;
  last_run_at: Date | null;
  last_run_job_id: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyParseError {
  row: number;
  message: string;
}

export interface CompanyParseResult {
  companies: CompanyDiscoveryInput[];
  errors: CompanyParseError[];
  skipped: number;
}
