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
