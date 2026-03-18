-- Discovery log: tracks every company ever discovered by the Account Discovery Agent.
-- Prevents re-discovering the same company in the same search category.

CREATE TABLE IF NOT EXISTS discovery_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  search_type text,
  state text,
  discovered_at timestamptz DEFAULT now(),
  added_to_accounts boolean DEFAULT false,
  job_run_id uuid REFERENCES job_runs(id),
  UNIQUE(company_name, search_type)
);

-- Index for fast lookups by search_type
CREATE INDEX IF NOT EXISTS idx_discovery_log_search_type ON discovery_log(search_type);

-- Index for checking if a company was previously discovered
CREATE INDEX IF NOT EXISTS idx_discovery_log_company_name ON discovery_log(company_name);
