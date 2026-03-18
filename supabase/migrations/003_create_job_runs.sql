-- ==========================================================================
-- Phase 8: Job Runs table for agent execution logging
-- ==========================================================================

CREATE TABLE job_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name      text NOT NULL CHECK (agent_name IN (
                    'discovery', 'news', 'qualification', 'queue'
                  )),
  status          text NOT NULL DEFAULT 'running' CHECK (status IN (
                    'running', 'completed', 'failed'
                  )),
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  duration_ms     integer,
  summary         jsonb NOT NULL DEFAULT '{}'::jsonb,
  error           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at (reuses existing set_updated_at function)
CREATE TRIGGER trg_job_runs_updated_at
  BEFORE UPDATE ON job_runs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX idx_job_runs_agent_name ON job_runs (agent_name);
CREATE INDEX idx_job_runs_started_at ON job_runs (started_at DESC);

-- Deduplication index for News Agent
CREATE UNIQUE INDEX idx_news_items_source_url_unique
  ON news_items (source_url);
