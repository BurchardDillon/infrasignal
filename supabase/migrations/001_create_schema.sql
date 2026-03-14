-- ==========================================================================
-- InfraSignal CRM Schema Migration
-- Execution order: tables → trigger function → triggers → indexes
-- ==========================================================================

-- ==========================================================================
-- PHASE 1: CREATE TABLES (dependency order: prospects first, then accounts,
--          then children that reference accounts)
-- ==========================================================================

CREATE TABLE prospects (
  id                                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name                      text NOT NULL,
  domain                            text,
  industry                          text,
  employee_count_range              text CHECK (employee_count_range IN (
                                      '1_to_50','51_to_200','201_to_500',
                                      '501_to_1000','1001_to_5000',
                                      '5001_to_10000','10001_plus'
                                    )),
  hq_location                       text,
  priority_score                    integer NOT NULL DEFAULT 0
                                      CHECK (priority_score >= 0 AND priority_score <= 100),
  signal_summary                    text,
  proposed_company_type             text CHECK (proposed_company_type IN (
                                      'hyperscaler','oem','system_integrator',
                                      'datacenter_operator','colo_provider',
                                      'private_cloud_provider','ai_infrastructure_provider',
                                      'storage_vendor','rugged_computing_vendor',
                                      'enterprise_end_user','bank_financial',
                                      'gov_edu','reseller','other'
                                    )),
  proposed_direct_buy_likelihood    text NOT NULL DEFAULT 'unknown'
                                      CHECK (proposed_direct_buy_likelihood IN (
                                        'high','medium','low','unknown'
                                      )),
  proposed_infra_ownership_verdict  text NOT NULL DEFAULT 'unknown'
                                      CHECK (proposed_infra_ownership_verdict IN (
                                        'owned','leased','hybrid','outsourced','unknown'
                                      )),
  hardware_categories               text[] NOT NULL DEFAULT '{}',
  source                            text NOT NULL DEFAULT 'manual'
                                      CHECK (source IN ('manual','news_crawl','referral','import')),
  status                            text NOT NULL DEFAULT 'new'
                                      CHECK (status IN ('new','reviewing','qualified','dismissed')),
  promoted_account_id               uuid,  -- FK added after accounts exists
  promoted_at                       timestamptz,
  dismissed_at                      timestamptz,
  notes                             text,
  created_at                        timestamptz NOT NULL DEFAULT now(),
  updated_at                        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name                text NOT NULL,
  domain                      text,
  website                     text,
  linkedin_company_url        text,
  industry                    text,
  employee_count_range        text CHECK (employee_count_range IN (
                                '1_to_50','51_to_200','201_to_500',
                                '501_to_1000','1001_to_5000',
                                '5001_to_10000','10001_plus'
                              )),
  hq_location                 text,
  company_type                text NOT NULL DEFAULT 'other'
                                CHECK (company_type IN (
                                  'hyperscaler','oem','system_integrator',
                                  'datacenter_operator','colo_provider',
                                  'private_cloud_provider','ai_infrastructure_provider',
                                  'storage_vendor','rugged_computing_vendor',
                                  'enterprise_end_user','bank_financial',
                                  'gov_edu','reseller','other'
                                )),
  status                      text NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active','nurturing','churned','on_hold')),
  direct_buy_likelihood       text NOT NULL DEFAULT 'unknown'
                                CHECK (direct_buy_likelihood IN ('high','medium','low','unknown')),
  infra_ownership_verdict     text NOT NULL DEFAULT 'unknown'
                                CHECK (infra_ownership_verdict IN (
                                  'owned','leased','hybrid','outsourced','unknown'
                                )),
  evidence_strength           text NOT NULL DEFAULT 'none'
                                CHECK (evidence_strength IN ('strong','moderate','weak','none')),
  why_it_matters              text,
  negative_signals            text,
  component_fit               jsonb NOT NULL DEFAULT '[]'::jsonb,
  hardware_categories         text[] NOT NULL DEFAULT '{}',
  notes                       text,
  source_prospect_id          uuid REFERENCES prospects(id),
  last_reviewed_at            timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- Now that accounts exists, add the FK from prospects → accounts
ALTER TABLE prospects
  ADD CONSTRAINT fk_prospects_promoted_account
  FOREIGN KEY (promoted_account_id) REFERENCES accounts(id);

CREATE TABLE contacts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id          uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  full_name           text NOT NULL,
  first_name          text NOT NULL,
  last_name           text NOT NULL,
  email               text,
  email_confidence    text NOT NULL DEFAULT 'unknown'
                        CHECK (email_confidence IN ('verified','likely','guess','unknown')),
  email_pattern       text,
  phone               text,
  title               text,
  department          text NOT NULL DEFAULT 'other'
                        CHECK (department IN (
                          'engineering','infrastructure','procurement',
                          'it','executive','finance','other'
                        )),
  seniority_tier      text NOT NULL DEFAULT 'unknown'
                        CHECK (seniority_tier IN (
                          'c_suite','vp','director','manager','ic','unknown'
                        )),
  role_category       text NOT NULL DEFAULT 'other'
                        CHECK (role_category IN (
                          'procurement','supply_chain','infrastructure',
                          'platform_engineering','hardware_engineering',
                          'datacenter_ops','executive','finance','other'
                        )),
  likely_manages      text,
  why_relevant        text,
  likely_works_with   text,
  linkedin_url        text,
  contact_priority    text NOT NULL DEFAULT 'secondary'
                        CHECK (contact_priority IN ('primary','secondary','monitor')),
  outreach_status     text NOT NULL DEFAULT 'not_contacted'
                        CHECK (outreach_status IN (
                          'not_contacted','contacted','responded',
                          'meeting_set','not_interested'
                        )),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evidence (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  headline              text NOT NULL,
  description           text NOT NULL,
  raw_excerpt           text,
  source_url            text,
  source_type           text NOT NULL
                          CHECK (source_type IN (
                            'job_posting','rfi_rfp','press_release','sec_filing',
                            'company_site','engineering_blog','partner_page',
                            'datacenter_provider','vendor_record','technical_doc',
                            'news_article','industry_report','social_media','other'
                          )),
  signal_direction      text NOT NULL DEFAULT 'neutral'
                          CHECK (signal_direction IN ('positive','negative','neutral')),
  signal_category       text NOT NULL DEFAULT 'other'
                          CHECK (signal_category IN (
                            'purchase_intent','infrastructure_footprint','hiring_signal',
                            'expansion_signal','partnership_signal','outsourcing_signal',
                            'vendor_switch','supply_signal','tech_adoption',
                            'budget_signal','other'
                          )),
  reliability_score     integer NOT NULL DEFAULT 50
                          CHECK (reliability_score >= 0 AND reliability_score <= 100),
  hardware_categories   text[] NOT NULL DEFAULT '{}',
  detected_at           timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE news_items (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                           text NOT NULL,
  summary                         text NOT NULL,
  source_url                      text NOT NULL,
  source_name                     text NOT NULL,
  published_at                    timestamptz NOT NULL,
  event_type                      text NOT NULL DEFAULT 'other'
                                    CHECK (event_type IN (
                                      'acquisition','expansion','earnings','partnership',
                                      'product_launch','hiring_signal','infrastructure_build',
                                      'shortage','price_movement','supply_disruption',
                                      'cloud_migration','on_prem_buildout','regulatory',
                                      'compliance_or_tariff_issue','government_contract','other'
                                    )),
  urgency_score                   integer NOT NULL DEFAULT 50
                                    CHECK (urgency_score >= 0 AND urgency_score <= 100),
  commercial_relevance_score      integer NOT NULL DEFAULT 50
                                    CHECK (commercial_relevance_score >= 0 AND commercial_relevance_score <= 100),
  confidence_score                integer NOT NULL DEFAULT 50
                                    CHECK (confidence_score >= 0 AND confidence_score <= 100),
  impact_summary                  text NOT NULL,
  recommended_outreach_department text CHECK (recommended_outreach_department IN (
                                    'engineering','infrastructure','procurement',
                                    'it','executive','finance','other'
                                  )),
  suggested_outreach_angle        text,
  component_impact                jsonb NOT NULL DEFAULT '[]'::jsonb,
  hardware_categories             text[] NOT NULL DEFAULT '{}',
  account_id                      uuid REFERENCES accounts(id),
  linked_accounts                 jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);


-- ==========================================================================
-- PHASE 2: TRIGGER FUNCTION
-- ==========================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==========================================================================
-- PHASE 3: ATTACH TRIGGERS TO EACH TABLE
-- ==========================================================================

CREATE TRIGGER trg_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_evidence_updated_at
  BEFORE UPDATE ON evidence
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_news_items_updated_at
  BEFORE UPDATE ON news_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ==========================================================================
-- PHASE 4: INDEXES (all tables now exist)
-- ==========================================================================

-- Prospects
CREATE INDEX idx_prospects_status ON prospects (status);
CREATE INDEX idx_prospects_priority_score ON prospects (priority_score DESC);

-- Accounts
CREATE INDEX idx_accounts_status ON accounts (status);
CREATE INDEX idx_accounts_company_type ON accounts (company_type);
CREATE UNIQUE INDEX idx_accounts_domain_unique
  ON accounts (domain) WHERE domain IS NOT NULL;
CREATE UNIQUE INDEX idx_accounts_source_prospect_unique
  ON accounts (source_prospect_id) WHERE source_prospect_id IS NOT NULL;

-- Contacts
CREATE INDEX idx_contacts_account_id ON contacts (account_id);
CREATE INDEX idx_contacts_outreach_status ON contacts (outreach_status);

-- Evidence
CREATE INDEX idx_evidence_account_id ON evidence (account_id);
CREATE INDEX idx_evidence_signal_direction ON evidence (signal_direction);

-- News Items
CREATE INDEX idx_news_items_account_id ON news_items (account_id);
CREATE INDEX idx_news_items_published_at ON news_items (published_at DESC);
CREATE INDEX idx_news_items_event_type ON news_items (event_type);
