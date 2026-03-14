-- ==========================================================================
-- InfraSignal CRM – Seed Data
-- Mirrors the TypeScript mock data files (lib/data/mock-*.ts)
-- Execution order respects FK constraints:
--   1. prospects (without promoted_account_id)
--   2. accounts  (with source_prospect_id)
--   3. UPDATE prospects to set promoted_account_id
--   4. contacts
--   5. evidence
--   6. news_items
-- ==========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- UUID mapping (deterministic IDs so cross-references are stable)
-- -------------------------------------------------------------------------
-- Prospects
--   prsp_coreweave  → 00000000-0000-4000-a000-000000000001
--   prsp_hetzner    → 00000000-0000-4000-a000-000000000002
--   prsp_vultr      → 00000000-0000-4000-a000-000000000003
--   prsp_scaleway   → 00000000-0000-4000-a000-000000000004
--   prsp_crusoe     → 00000000-0000-4000-a000-000000000005
-- Accounts
--   acc_coreweave   → 00000000-0000-4000-b000-000000000001
--   acc_lambda      → 00000000-0000-4000-b000-000000000002
--   acc_equinix     → 00000000-0000-4000-b000-000000000003
--   acc_hetzner     → 00000000-0000-4000-b000-000000000004
--   acc_ovhcloud    → 00000000-0000-4000-b000-000000000005
-- Contacts
--   con_01 → 00000000-0000-4000-c000-000000000001
--   con_02 → 00000000-0000-4000-c000-000000000002
--   con_03 → 00000000-0000-4000-c000-000000000003
--   con_04 → 00000000-0000-4000-c000-000000000004
--   con_05 → 00000000-0000-4000-c000-000000000005
--   con_06 → 00000000-0000-4000-c000-000000000006
-- Evidence
--   evi_01 → 00000000-0000-4000-d000-000000000001
--   evi_02 → 00000000-0000-4000-d000-000000000002
--   evi_03 → 00000000-0000-4000-d000-000000000003
--   evi_04 → 00000000-0000-4000-d000-000000000004
--   evi_05 → 00000000-0000-4000-d000-000000000005
--   evi_06 → 00000000-0000-4000-d000-000000000006
-- News Items
--   news_01 → 00000000-0000-4000-e000-000000000001
--   news_02 → 00000000-0000-4000-e000-000000000002
--   news_03 → 00000000-0000-4000-e000-000000000003
--   news_04 → 00000000-0000-4000-e000-000000000004
--   news_05 → 00000000-0000-4000-e000-000000000005

-- -------------------------------------------------------------------------
-- 1. PROSPECTS (without promoted_account_id – set later to avoid FK cycle)
-- -------------------------------------------------------------------------

INSERT INTO prospects (id, company_name, domain, industry, employee_count_range, hq_location, priority_score, signal_summary, proposed_company_type, proposed_direct_buy_likelihood, proposed_infra_ownership_verdict, hardware_categories, source, status, promoted_account_id, promoted_at, dismissed_at, notes, created_at, updated_at) VALUES
(
  '00000000-0000-4000-a000-000000000001',
  'CoreWeave', 'coreweave.com', 'Cloud Infrastructure / AI', '1001_to_5000', 'Livingston, NJ',
  95,
  'Multiple strong signals: massive $7.5B debt financing for infrastructure, aggressive hiring for hardware roles, and new data center construction in three US sites. Direct GPU and server buyer at scale.',
  'ai_infrastructure_provider', 'high', 'owned',
  ARRAY['gpu','networking','server','memory'],
  'news_crawl', 'qualified',
  NULL, '2025-01-15T09:00:00Z', NULL,
  'Promoted to account after validating infrastructure ownership model and procurement signals.',
  '2025-01-05T08:00:00Z', '2025-01-15T09:00:00Z'
),
(
  '00000000-0000-4000-a000-000000000002',
  'Hetzner Online', 'hetzner.com', 'Hosting / Cloud Infrastructure', '501_to_1000', 'Gunzenhausen, Germany',
  82,
  'Vertically integrated hosting company that builds own servers. New data center expansion in Falkenstein signals large component procurement cycle ahead.',
  'datacenter_operator', 'high', 'owned',
  ARRAY['server','ssd','hdd','memory','networking'],
  'manual', 'qualified',
  NULL, '2025-03-01T10:00:00Z', NULL,
  'Added manually based on industry knowledge of their in-house server manufacturing.',
  '2025-02-20T14:00:00Z', '2025-03-01T10:00:00Z'
),
(
  '00000000-0000-4000-a000-000000000003',
  'Vultr (The Constant Company)', 'vultr.com', 'Cloud Infrastructure', '201_to_500', 'Matawan, NJ',
  76,
  'Growing cloud provider with 32 data center locations. Recently added GPU cloud instances and bare-metal offerings, suggesting increased hardware procurement. Owned infrastructure model confirmed via job postings referencing in-house server deployment.',
  'private_cloud_provider', 'medium', 'hybrid',
  ARRAY['server','gpu','ssd','networking'],
  'news_crawl', 'reviewing',
  NULL, NULL, NULL,
  'Need to verify whether Vultr procures hardware directly or uses OEM/ODM partners for server builds.',
  '2025-04-10T09:00:00Z', '2025-04-25T11:00:00Z'
),
(
  '00000000-0000-4000-a000-000000000004',
  'Scaleway (Iliad Group)', 'scaleway.com', 'Cloud Infrastructure', '501_to_1000', 'Paris, France',
  71,
  'European cloud provider owned by Iliad Group. Operates own data centers in Paris and Amsterdam. Previously designed custom ARM-based servers (ThunderX). Active in GPU cloud with NVIDIA L40S instances.',
  'private_cloud_provider', 'medium', 'owned',
  ARRAY['server','gpu','ssd','networking'],
  'referral', 'new',
  NULL, NULL, NULL,
  'Referral from OVHcloud contact. Scaleway has history of custom hardware -- worth investigating current procurement model.',
  '2025-05-15T10:00:00Z', '2025-05-15T10:00:00Z'
),
(
  '00000000-0000-4000-a000-000000000005',
  'Crusoe Energy Systems', 'crusoeenergy.com', 'AI Infrastructure / Clean Energy', '201_to_500', 'Denver, CO',
  88,
  'Clean-energy-powered AI data center company. Building large GPU clusters powered by stranded natural gas and renewable energy. Recent $600M raise specifically for GPU infrastructure buildout.',
  'ai_infrastructure_provider', 'high', 'owned',
  ARRAY['gpu','server','networking','memory'],
  'news_crawl', 'reviewing',
  NULL, NULL, NULL,
  'Strong buy signals but need to verify whether they procure directly or through system integrators. CEO background is in energy, not hardware.',
  '2025-05-02T07:00:00Z', '2025-05-20T15:00:00Z'
);

-- -------------------------------------------------------------------------
-- 2. ACCOUNTS (with source_prospect_id where applicable)
-- -------------------------------------------------------------------------

INSERT INTO accounts (id, company_name, domain, website, linkedin_company_url, industry, employee_count_range, hq_location, company_type, status, direct_buy_likelihood, infra_ownership_verdict, evidence_strength, why_it_matters, negative_signals, component_fit, hardware_categories, notes, source_prospect_id, last_reviewed_at, created_at, updated_at) VALUES
(
  '00000000-0000-4000-b000-000000000001',
  'CoreWeave', 'coreweave.com', 'https://www.coreweave.com', 'https://www.linkedin.com/company/coreweave',
  'Cloud Infrastructure / AI', '1001_to_5000', 'Livingston, NJ',
  'ai_infrastructure_provider', 'active', 'high', 'owned', 'strong',
  'Rapidly expanding GPU cloud provider with massive NVIDIA hardware procurement. Building out owned data center capacity across the US and Europe.',
  NULL,
  '[{"category":"gpu","fit_reason":"Primary business is GPU-as-a-service; procures NVIDIA H100/B200 at scale"},{"category":"networking","fit_reason":"InfiniBand and high-speed ethernet backbone required for GPU cluster interconnect"},{"category":"server","fit_reason":"Custom server configurations for dense GPU deployments"}]'::jsonb,
  ARRAY['gpu','networking','server','memory'],
  'Key contact is VP of Hardware Engineering. Recent $7.5B debt financing for infrastructure expansion.',
  '00000000-0000-4000-a000-000000000001',
  '2025-06-10T14:30:00Z',
  '2025-01-15T09:00:00Z', '2025-06-10T14:30:00Z'
),
(
  '00000000-0000-4000-b000-000000000002',
  'Lambda Labs', 'lambdalabs.com', 'https://lambdalabs.com', 'https://www.linkedin.com/company/lambda-labs',
  'AI Infrastructure / Deep Learning', '201_to_500', 'San Francisco, CA',
  'ai_infrastructure_provider', 'active', 'high', 'hybrid', 'moderate',
  'Sells GPU workstations and operates a GPU cloud. Both builds own hardware and leases colo space for cloud offering.',
  'Recent shift toward more leased capacity may reduce direct hardware procurement over time.',
  '[{"category":"gpu","fit_reason":"Builds and sells GPU workstations; deploys NVIDIA A100/H100 in cloud"},{"category":"server","fit_reason":"Designs custom 4U GPU server chassis for workstation product line"},{"category":"memory","fit_reason":"High-capacity DDR5 ECC memory for deep learning workstations"}]'::jsonb,
  ARRAY['gpu','server','memory','ssd'],
  NULL,
  NULL,
  '2025-05-22T10:00:00Z',
  '2025-02-03T11:30:00Z', '2025-05-22T10:00:00Z'
),
(
  '00000000-0000-4000-b000-000000000003',
  'Equinix', 'equinix.com', 'https://www.equinix.com', 'https://www.linkedin.com/company/equinix',
  'Data Center / Colocation', '10001_plus', 'Redwood City, CA',
  'colo_provider', 'active', 'medium', 'owned', 'strong',
  'World''s largest colocation provider with 260+ data centers globally. Procures networking and server hardware at massive scale for managed services.',
  'Core colo business means tenants bring own hardware; direct buy limited to Equinix Metal and managed services.',
  '[{"category":"networking","fit_reason":"Operates Equinix Fabric interconnection platform; heavy buyer of switches and routers"},{"category":"server","fit_reason":"Equinix Metal bare-metal-as-a-service requires ongoing server fleet refresh"}]'::jsonb,
  ARRAY['networking','server','ssd'],
  'Equinix Metal (formerly Packet) team is best entry point for server/storage sales.',
  NULL,
  '2025-06-01T08:00:00Z',
  '2024-11-20T15:00:00Z', '2025-06-01T08:00:00Z'
),
(
  '00000000-0000-4000-b000-000000000004',
  'Hetzner Online', 'hetzner.com', 'https://www.hetzner.com', 'https://www.linkedin.com/company/hetzner-online',
  'Hosting / Cloud Infrastructure', '501_to_1000', 'Gunzenhausen, Germany',
  'datacenter_operator', 'nurturing', 'high', 'owned', 'moderate',
  'Vertically integrated hosting provider that owns and operates its own data centers and builds custom servers. Known for aggressive hardware procurement at competitive prices.',
  NULL,
  '[{"category":"server","fit_reason":"Assembles own servers in-house; large volume buyer of motherboards, CPUs, and chassis"},{"category":"ssd","fit_reason":"Heavy NVMe SSD procurement for dedicated server and cloud storage products"},{"category":"hdd","fit_reason":"Storage Box product line requires bulk HDD purchasing"}]'::jsonb,
  ARRAY['server','ssd','hdd','memory','networking'],
  'European procurement cycles. Preference for direct manufacturer relationships over distributors.',
  '00000000-0000-4000-a000-000000000002',
  '2025-04-15T12:00:00Z',
  '2025-03-01T10:00:00Z', '2025-04-15T12:00:00Z'
),
(
  '00000000-0000-4000-b000-000000000005',
  'OVHcloud', 'ovhcloud.com', 'https://www.ovhcloud.com', 'https://www.linkedin.com/company/ovhcloud',
  'Cloud Infrastructure / Hosting', '5001_to_10000', 'Roubaix, France',
  'private_cloud_provider', 'active', 'high', 'owned', 'strong',
  'Europe''s largest cloud provider with a uniquely vertically integrated model -- manufactures own servers and water-cooling systems in-house. One of the largest independent hardware buyers globally.',
  'Post-Strasbourg fire (2021) regulatory scrutiny has slowed some expansion plans.',
  '[{"category":"server","fit_reason":"Manufactures own servers in Croix factory; buys components directly from OEMs"},{"category":"ssd","fit_reason":"Massive NVMe and SATA SSD volumes for cloud and dedicated server offerings"},{"category":"networking","fit_reason":"Operates private fiber backbone across 40+ data centers; procures switches at scale"},{"category":"memory","fit_reason":"DDR5 server memory at volume for in-house server assembly line"}]'::jsonb,
  ARRAY['server','ssd','networking','memory','hdd'],
  'Public company (Euronext Paris). Procurement team based in Roubaix. Strong preference for direct component sourcing.',
  NULL,
  '2025-05-30T16:00:00Z',
  '2024-10-05T09:00:00Z', '2025-05-30T16:00:00Z'
);

-- -------------------------------------------------------------------------
-- 3. UPDATE prospects with promoted_account_id (closing the circular FK)
-- -------------------------------------------------------------------------

UPDATE prospects SET promoted_account_id = '00000000-0000-4000-b000-000000000001'
  WHERE id = '00000000-0000-4000-a000-000000000001';

UPDATE prospects SET promoted_account_id = '00000000-0000-4000-b000-000000000004'
  WHERE id = '00000000-0000-4000-a000-000000000002';

-- -------------------------------------------------------------------------
-- 4. CONTACTS
-- -------------------------------------------------------------------------

INSERT INTO contacts (id, account_id, full_name, first_name, last_name, email, email_confidence, email_pattern, phone, title, department, seniority_tier, role_category, likely_manages, why_relevant, likely_works_with, linkedin_url, contact_priority, outreach_status, notes, created_at, updated_at) VALUES
(
  '00000000-0000-4000-c000-000000000001',
  '00000000-0000-4000-b000-000000000001',
  'Brian Venturo', 'Brian', 'Venturo',
  'bventuro@coreweave.com', 'verified', '{first_initial}{last}@{domain}',
  NULL, 'Chief Technology Officer',
  'engineering', 'c_suite', 'infrastructure',
  'Hardware engineering, GPU cluster architecture, data center buildout teams',
  'Final decision-maker on GPU and server hardware procurement. Oversees all infrastructure buildout for CoreWeave''s expanding cloud platform.',
  'VP of Supply Chain, Director of Data Center Operations',
  'https://www.linkedin.com/in/brianventuro',
  'primary', 'meeting_set',
  'Met at GTC 2025. Very hands-on with hardware selection. Prefers technical conversations over sales pitches.',
  '2025-01-20T10:00:00Z', '2025-06-05T09:30:00Z'
),
(
  '00000000-0000-4000-c000-000000000002',
  '00000000-0000-4000-b000-000000000001',
  'Sarah Chen', 'Sarah', 'Chen',
  'schen@coreweave.com', 'likely', '{first_initial}{last}@{domain}',
  '+1-973-555-0142', 'VP of Supply Chain & Procurement',
  'procurement', 'vp', 'supply_chain',
  'Hardware procurement, vendor relationships, supply chain logistics',
  'Owns the procurement budget and vendor selection process for all server and networking hardware.',
  'CTO, Director of Hardware Engineering, Finance team',
  NULL,
  'primary', 'contacted',
  'Introduced via CTO. Interested in volume pricing for Q3 server refresh.',
  '2025-02-10T14:00:00Z', '2025-05-28T11:00:00Z'
),
(
  '00000000-0000-4000-c000-000000000003',
  '00000000-0000-4000-b000-000000000002',
  'Stephen Balaban', 'Stephen', 'Balaban',
  'stephen@lambdalabs.com', 'verified', '{first}@{domain}',
  NULL, 'CEO & Co-Founder',
  'executive', 'c_suite', 'executive',
  'Overall company strategy, product direction, key vendor partnerships',
  'Founder-led company where CEO is deeply involved in hardware design decisions and major procurement.',
  'Head of Hardware Engineering, VP of Cloud Infrastructure',
  'https://www.linkedin.com/in/stephenbalaban',
  'primary', 'responded',
  'Technically sharp -- Stanford CS background. Engages well with product roadmap discussions.',
  '2025-02-05T09:00:00Z', '2025-05-15T16:00:00Z'
),
(
  '00000000-0000-4000-c000-000000000004',
  '00000000-0000-4000-b000-000000000003',
  'Marcus Rivera', 'Marcus', 'Rivera',
  'mrivera@equinix.com', 'likely', '{first_initial}{last}@{domain}',
  '+1-650-555-0198', 'Director of Hardware Engineering, Equinix Metal',
  'infrastructure', 'director', 'hardware_engineering',
  'Server hardware selection, bare-metal fleet architecture, hardware lifecycle management',
  'Directly responsible for server hardware specs and vendor selection for the Equinix Metal bare-metal product line.',
  'VP of Product (Metal), Procurement team, Data Center Operations',
  'https://www.linkedin.com/in/marcusrivera-hw',
  'primary', 'not_contacted',
  'Identified via LinkedIn. Previously at Rackspace in a similar role.',
  '2025-04-12T08:00:00Z', '2025-04-12T08:00:00Z'
),
(
  '00000000-0000-4000-c000-000000000005',
  '00000000-0000-4000-b000-000000000004',
  'Klaus Obermeyer', 'Klaus', 'Obermeyer',
  'k.obermeyer@hetzner.com', 'guess', '{first_initial}.{last}@{domain}',
  NULL, 'Head of Hardware Procurement',
  'procurement', 'director', 'procurement',
  'Component sourcing, vendor negotiations, procurement strategy for in-house server assembly',
  'Leads all hardware component purchasing for Hetzner''s in-house server manufacturing operation.',
  'Server Assembly team lead, CFO, Data Center Expansion PM',
  NULL,
  'primary', 'not_contacted',
  'Email pattern is a guess based on other Hetzner employees found on LinkedIn. German-speaking; consider DACH team for outreach.',
  '2025-03-10T11:00:00Z', '2025-03-10T11:00:00Z'
),
(
  '00000000-0000-4000-c000-000000000006',
  '00000000-0000-4000-b000-000000000005',
  'Camille Durand', 'Camille', 'Durand',
  'camille.durand@ovhcloud.com', 'verified', '{first}.{last}@{domain}',
  '+33-3-20-55-0100', 'VP of Industrial Operations',
  'infrastructure', 'vp', 'datacenter_ops',
  'Server manufacturing line in Croix, water-cooling R&D, hardware quality assurance',
  'Oversees OVHcloud''s unique in-house server manufacturing operation. Key decision-maker on component selection and supplier relationships.',
  'CTO, Head of Procurement, Data Center Construction team',
  'https://www.linkedin.com/in/camilledurand-ovh',
  'primary', 'contacted',
  'Responded positively to initial outreach at CloudFest 2025. Follow up with NVMe SSD pricing.',
  '2025-01-08T13:00:00Z', '2025-05-20T10:00:00Z'
);

-- -------------------------------------------------------------------------
-- 5. EVIDENCE
-- -------------------------------------------------------------------------

INSERT INTO evidence (id, account_id, headline, description, raw_excerpt, source_url, source_type, signal_direction, signal_category, reliability_score, hardware_categories, detected_at, created_at, updated_at) VALUES
(
  '00000000-0000-4000-d000-000000000001',
  '00000000-0000-4000-b000-000000000001',
  'CoreWeave hiring Senior GPU Cluster Architect',
  'Job posting for a Senior GPU Cluster Architect referencing large-scale NVIDIA H100 and B200 deployments. Mentions designing multi-thousand GPU clusters with InfiniBand interconnect.',
  'You will architect GPU clusters of 10,000+ GPUs using NVIDIA H100 and next-gen B200 accelerators, connected via 400Gbps InfiniBand fabric...',
  'https://careers.coreweave.com/gpu-cluster-architect',
  'job_posting', 'positive', 'hiring_signal', 85,
  ARRAY['gpu','networking'],
  '2025-05-28T06:00:00Z', '2025-05-28T06:15:00Z', '2025-05-28T06:15:00Z'
),
(
  '00000000-0000-4000-d000-000000000002',
  '00000000-0000-4000-b000-000000000001',
  'CoreWeave secures $7.5B in debt financing for data center expansion',
  'Press release announcing a major debt raise earmarked for new data center construction and GPU hardware procurement across three new US sites.',
  'CoreWeave has closed a $7.5 billion debt financing facility to fund the construction and equipping of new data center campuses in Texas, Illinois, and Virginia...',
  'https://www.reuters.com/technology/coreweave-debt-financing-2025',
  'press_release', 'positive', 'expansion_signal', 95,
  ARRAY['gpu','server','networking'],
  '2025-06-02T14:00:00Z', '2025-06-02T14:10:00Z', '2025-06-02T14:10:00Z'
),
(
  '00000000-0000-4000-d000-000000000003',
  '00000000-0000-4000-b000-000000000002',
  'Lambda blog post: Building our next-gen 1-Click Clusters',
  'Engineering blog detailing Lambda''s new cluster architecture using custom 4U GPU servers with liquid cooling. Reveals internal hardware design and procurement decisions.',
  'We designed a custom 4U chassis that houses 8x H100 SXM modules with direct-to-chip liquid cooling, reducing PUE to 1.08 and allowing us to pack 40% more compute per rack...',
  'https://lambdalabs.com/blog/next-gen-clusters',
  'engineering_blog', 'positive', 'infrastructure_footprint', 90,
  ARRAY['gpu','server','memory'],
  '2025-04-15T10:30:00Z', '2025-04-15T10:45:00Z', '2025-04-15T10:45:00Z'
),
(
  '00000000-0000-4000-d000-000000000004',
  '00000000-0000-4000-b000-000000000003',
  'Equinix Metal adds AMD EPYC 9004 bare-metal configurations',
  'Product announcement showing Equinix Metal expanding its bare-metal server fleet with AMD EPYC Genoa processors, indicating active server hardware procurement cycle.',
  NULL,
  'https://www.equinix.com/newsroom/metal-amd-epyc-9004',
  'press_release', 'positive', 'purchase_intent', 88,
  ARRAY['server','memory','ssd'],
  '2025-05-10T08:00:00Z', '2025-05-10T08:20:00Z', '2025-05-10T08:20:00Z'
),
(
  '00000000-0000-4000-d000-000000000005',
  '00000000-0000-4000-b000-000000000004',
  'Hetzner opens new data center in Falkenstein with 10,000 server capacity',
  'Company announcement of a major new data center facility in Falkenstein, Germany. The expansion will require procurement of server components, storage drives, and networking equipment at scale.',
  'Our new DC7 facility in Falkenstein will house over 10,000 servers, featuring our latest in-house designed server platform with NVMe-only storage...',
  'https://www.hetzner.com/news/dc7-falkenstein',
  'company_site', 'positive', 'expansion_signal', 92,
  ARRAY['server','ssd','networking'],
  '2025-03-20T07:00:00Z', '2025-03-20T07:30:00Z', '2025-03-20T07:30:00Z'
),
(
  '00000000-0000-4000-d000-000000000006',
  '00000000-0000-4000-b000-000000000005',
  'OVHcloud Q1 2025 earnings: increased CapEx for server manufacturing',
  'SEC-equivalent filing (AMF) from OVHcloud''s quarterly earnings showing a 35% year-over-year increase in capital expenditure, primarily driven by expanded in-house server manufacturing capacity.',
  'Capital expenditure for Q1 FY2025 reached EUR 142M, up 35% YoY, driven by investments in our Croix manufacturing facility and new NVMe storage platform rollout...',
  'https://corporate.ovhcloud.com/en/investors/q1-2025-results',
  'sec_filing', 'positive', 'budget_signal', 97,
  ARRAY['server','ssd','memory'],
  '2025-05-05T16:00:00Z', '2025-05-05T16:30:00Z', '2025-05-05T16:30:00Z'
);

-- -------------------------------------------------------------------------
-- 6. NEWS ITEMS
-- -------------------------------------------------------------------------

INSERT INTO news_items (id, title, summary, source_url, source_name, published_at, event_type, urgency_score, commercial_relevance_score, confidence_score, impact_summary, recommended_outreach_department, suggested_outreach_angle, component_impact, hardware_categories, account_id, linked_accounts, created_at, updated_at) VALUES
(
  '00000000-0000-4000-e000-000000000001',
  'CoreWeave Files for IPO, Plans $4B Public Offering',
  'CoreWeave has filed its S-1 with the SEC for a planned IPO valued at approximately $35 billion, with $4 billion in expected proceeds earmarked for GPU infrastructure expansion.',
  'https://www.reuters.com/technology/coreweave-ipo-filing-2025',
  'Reuters',
  '2025-06-01T12:00:00Z',
  'expansion', 92, 95, 98,
  'IPO proceeds will fund massive GPU and server hardware procurement. Expect accelerated purchasing cycles in H2 2025.',
  'procurement',
  'Position volume pricing and supply guarantees ahead of post-IPO expansion wave.',
  '[{"category":"gpu","impact":"Major procurement wave expected post-IPO"},{"category":"networking","impact":"InfiniBand and ethernet switching for new clusters"}]'::jsonb,
  ARRAY['gpu','networking','server'],
  '00000000-0000-4000-b000-000000000001',
  '[]'::jsonb,
  '2025-06-01T13:00:00Z', '2025-06-01T13:00:00Z'
),
(
  '00000000-0000-4000-e000-000000000002',
  'NVIDIA Reports Record Q1 Data Center Revenue of $22.6B',
  'NVIDIA''s data center segment reported record quarterly revenue, driven by demand from cloud providers and AI infrastructure companies.',
  'https://nvidianews.nvidia.com/q1-fy2026-earnings',
  'NVIDIA Newsroom',
  '2025-05-28T20:00:00Z',
  'earnings', 65, 80, 99,
  'Confirms strong GPU demand cycle. CoreWeave and Lambda are among top buyers -- validates their continued procurement activity.',
  NULL, NULL,
  '[{"category":"gpu","impact":"Sustained high demand confirms market opportunity"}]'::jsonb,
  ARRAY['gpu'],
  NULL,
  '[{"account_id":"00000000-0000-4000-b000-000000000001","link_type":"auto"},{"account_id":"00000000-0000-4000-b000-000000000002","link_type":"auto"}]'::jsonb,
  '2025-05-29T08:00:00Z', '2025-05-29T08:00:00Z'
),
(
  '00000000-0000-4000-e000-000000000003',
  'OVHcloud Breaks Ground on New Data Center Campus in Strasbourg',
  'OVHcloud has begun construction on a replacement data center campus in Strasbourg, France, with a planned capacity of 60,000 servers and an estimated EUR 250M investment.',
  'https://corporate.ovhcloud.com/en/newsroom/strasbourg-campus',
  'OVHcloud Newsroom',
  '2025-05-15T09:00:00Z',
  'infrastructure_build', 85, 90, 95,
  '60,000 new servers will require massive component procurement from OVHcloud''s in-house manufacturing line. SSD and memory demand will spike.',
  'infrastructure',
  'Offer competitive NVMe SSD and DDR5 memory volume pricing for the new campus buildout timeline.',
  '[{"category":"server","impact":"60,000 new servers planned"},{"category":"ssd","impact":"NVMe-only storage architecture"},{"category":"memory","impact":"DDR5 ECC at scale for new platform"}]'::jsonb,
  ARRAY['server','ssd','memory','networking'],
  '00000000-0000-4000-b000-000000000005',
  '[]'::jsonb,
  '2025-05-15T10:00:00Z', '2025-05-15T10:00:00Z'
),
(
  '00000000-0000-4000-e000-000000000004',
  'Hetzner Announces GPU Cloud Offering with NVIDIA L40S',
  'Hetzner Online is entering the GPU cloud market with new dedicated GPU servers featuring NVIDIA L40S accelerators, marking the company''s first foray into AI/ML infrastructure.',
  'https://www.hetzner.com/news/gpu-cloud-launch',
  'Hetzner News',
  '2025-04-20T07:00:00Z',
  'product_launch', 78, 85, 88,
  'New GPU product line means Hetzner is now procuring GPUs for the first time at scale. Opens new hardware category opportunity.',
  'procurement',
  'Introduce GPU server configurations and supply chain support for their new product line.',
  '[{"category":"gpu","impact":"New buyer entering GPU market at scale"},{"category":"server","impact":"Custom GPU server chassis required"}]'::jsonb,
  ARRAY['gpu','server','memory'],
  '00000000-0000-4000-b000-000000000004',
  '[]'::jsonb,
  '2025-04-20T08:00:00Z', '2025-04-20T08:00:00Z'
),
(
  '00000000-0000-4000-e000-000000000005',
  'Equinix Expands xScale Program with Three New Hyperscale Data Centers',
  'Equinix announced three new xScale data center facilities in Tokyo, Frankfurt, and Dallas, adding over 100MW of capacity for hyperscale cloud customers.',
  'https://www.equinix.com/newsroom/xscale-expansion-2025',
  'Equinix Newsroom',
  '2025-05-20T14:00:00Z',
  'expansion', 70, 75, 92,
  'xScale expansion primarily serves hyperscaler tenants who bring their own hardware. Limited direct procurement impact, but networking infrastructure will be purchased.',
  'infrastructure',
  'Focus on networking equipment needs for the new xScale facilities.',
  '[{"category":"networking","impact":"New facilities require full networking buildout"}]'::jsonb,
  ARRAY['networking'],
  '00000000-0000-4000-b000-000000000003',
  '[]'::jsonb,
  '2025-05-20T15:00:00Z', '2025-05-20T15:00:00Z'
);

COMMIT;
