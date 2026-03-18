-- ==========================================================================
-- Add country field to prospects and accounts
-- Default: 'United States' (USA-only scope for this phase)
-- ==========================================================================

ALTER TABLE prospects ADD COLUMN country text NOT NULL DEFAULT 'United States';
ALTER TABLE accounts ADD COLUMN country text NOT NULL DEFAULT 'United States';
