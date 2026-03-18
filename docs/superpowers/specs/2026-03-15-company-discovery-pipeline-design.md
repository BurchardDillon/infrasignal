# Company Discovery Pipeline — Design Spec

## Goal

Build an autonomous company discovery pipeline that continuously generates new U.S.-based infrastructure company candidates via three input methods (CSV upload, pasted list, seed expansion), processes them through the existing discovery agent, and surfaces results in an admin UI.

## Architecture

**Approach B: Direct Pipeline** — one new table (`discovery_sources`) for source metadata only. All three input methods normalize raw data into `CompanyDiscoveryInput[]` and delegate directly to `runDiscoveryAgent()`. No staging table. Per-company audit trail lives in `DiscoveryAgentResult.details[]` stored in `job_runs.summary`.

```
CSV upload ──┐
Pasted list ──┼── parse/normalize ── CompanyDiscoveryInput[] ── runDiscoveryAgent() ── prospects
Seed expansion ──┘                                                    │
                                                                      └── job_runs (audit)
```

## Constraints

- Deterministic only — no paid APIs, no web search, no scraping, no browser automation
- USA-only enforcement strict — non-US companies never enter prospects or accounts
- Idempotent — re-running any source produces zero new inserts if data hasn't changed
- Reuse existing discovery agent for all processing (normalization, USA gating, dedup, classification, scoring, insertion)

---

## Section 1: Data Layer

### New table: `discovery_sources`

Metadata-only table tracking discovery sources and their run history. Mirrors the `feed_sources` pattern.

```sql
CREATE TABLE discovery_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  source_type     text NOT NULL CHECK (source_type IN ('csv_upload', 'pasted_list', 'seed_expansion')),
  source_key      text NOT NULL UNIQUE,
  is_enabled      boolean NOT NULL DEFAULT true,
  record_count    integer,
  last_run_at     timestamptz,
  last_run_job_id uuid REFERENCES job_runs(id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

- `source_key`: unique identifier for dedup (e.g., `"seed_expansion_v1"`, `"csv_2026-03-15_abc123"`, `"paste_2026-03-15_def456"`)
- `record_count`: total raw records in the source (set before processing)
- `last_run_at` / `last_run_job_id`: updated after each run
- `is_enabled`: controls whether seed expansion cron processes this source

### New types: `lib/types/discovery.ts`

```typescript
type DiscoverySourceType = "csv_upload" | "pasted_list" | "seed_expansion";

interface DiscoverySource {
  id: string;
  name: string;
  source_type: DiscoverySourceType;
  source_key: string;
  is_enabled: boolean;
  record_count: number | null;
  last_run_at: Date | null;
  last_run_job_id: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

// Return type for CSV/paste parsers
interface CompanyParseResult {
  companies: CompanyDiscoveryInput[];
  errors: Array<{ row: number; message: string }>;
  skipped: number;
}
```

### Static seed dataset: `lib/data/seed-companies.ts`

- `export const SEED_COMPANIES: CompanyDiscoveryInput[]`
- ~50 high-quality curated U.S. infrastructure companies
- Each entry: `company_name`, `domain`, `country: "United States"`, `hq_location`, `industry`, `hardware_hints`, `notes`, `source: "manual"`
- Organized by company_type in code comments
- Categories: ai_infrastructure_provider, datacenter_operator, colo_provider, system_integrator, storage_vendor, rugged_computing_vendor, enterprise_end_user, bank_financial, private_cloud_provider

---

## Section 2: Processing Layer

### Input parsers

**CSV Parser** (`lib/engine/parse-csv.ts`) — pure function
- `parseCsv(csvText: string): CompanyParseResult`
- Expected columns: `company_name` (required), `domain`, `industry`, `hq_location`, `country`, `hardware_hints`, `notes`
- Flexible header matching: normalizes to lowercase, trims, converts spaces/dashes to underscores
- Skips rows with empty `company_name` (logs as error)
- Collects row-level parse errors, continues processing valid rows
- Sets `source: "import"` on all records
- Returns `{ companies, errors, skipped }`

**Paste Parser** (`lib/engine/parse-pasted-list.ts`) — pure function
- `parsePastedList(text: string): CompanyParseResult`
- Detection order:
  1. Tab-separated structured input (first line has tabs → treat as TSV with header)
  2. Comma-separated structured input (first line has commas and looks like a header)
  3. Simple one-company-per-line (fallback)
- Same flexible header matching as CSV parser for structured formats
- Sets `source: "import"` on all records
- Collects row-level parse errors, continues processing valid rows

### Processing flow

All three methods follow the same pattern:

1. Parse raw input → `CompanyDiscoveryInput[]` (CSV/paste parsers) or load static array (seed)
2. Create/update `discovery_sources` record with `record_count` (before processing)
3. Call `runDiscoveryAgent(companies)` — handles normalization, USA gating, dedup, classification, scoring, insertion
4. Update `discovery_sources` with `last_run_at` and `last_run_job_id` (after processing)
5. Return `DiscoveryAgentResult` to UI

### Server actions (`lib/actions/discovery-actions.ts`)

- `runCsvDiscovery(csvText: string, name: string)` — parses CSV, creates discovery_source, runs agent, updates source
- `runPastedListDiscovery(text: string, name: string)` — parses pasted text, creates discovery_source, runs agent, updates source
- `runSeedExpansion()` — loads SEED_COMPANIES, upserts discovery_source (source_key: "seed_expansion_v1"), runs agent, updates source
- `getSeedExpansionStats()` — returns total seed count, already-in-system count, net-new estimate (for UI display)

---

## Section 3: Admin UI

### Page: `/admin/discovery`

Server component, `force-dynamic`. Three tabbed input methods + shared results display.

**Components:**

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| `DiscoveryTabs` | `components/admin/discovery-tabs.tsx` | Client | Tab switcher + state for active tab + result |
| `CsvUploadPanel` | `components/admin/csv-upload-panel.tsx` | Client | File input (.csv only), max size display, empty/zero-row rejection, submit |
| `PastedListPanel` | `components/admin/pasted-list-panel.tsx` | Client | Textarea input, submit |
| `SeedExpansionPanel` | `components/admin/seed-expansion-panel.tsx` | Client | Live counts (total/in-system/net-new), "Run Expansion" button |
| `DiscoveryResults` | `components/admin/discovery-results.tsx` | Presentational | Summary banner + per-company detail table |

**Result display uses exact `DiscoveryAgentResult.details[]` outcome codes:**
- `"created"` → Badge variant `success`
- `"skipped_duplicate"` → Badge variant `neutral`
- `"skipped_non_us"` → Badge variant `danger`

**Seed expansion panel** computes real counts via `getSeedExpansionStats()` server action:
- "50 curated seed companies" (from `SEED_COMPANIES.length`)
- "X already in system" (matched against prospect domains + account domains + account names)
- "Y net-new candidates" (difference)

### Navigation

Add "Company Discovery" with `Search` icon to `ADMIN_NAV_ITEMS` in `lib/constants/navigation.ts`.

---

## Section 4: Scheduling & API

### API route: `app/api/agents/discovery-seed/route.ts`

- GET endpoint, CRON_SECRET auth
- Loads seed expansion discovery_source, checks `is_enabled`
- If disabled or not found: returns `{ skipped: true }` with 200
- If enabled: calls `runDiscoveryAgent(SEED_COMPANIES)`, updates discovery_source, returns result
- Logs zero-new runs cleanly (job completes with `created: 0`)

### Cron schedule (`vercel.json`)

```json
{
  "path": "/api/agents/discovery-seed",
  "schedule": "0 4 * * 1"
}
```

Weekly on Mondays at 4am UTC — runs before the daily feed/qualification/queue cycle.

---

## File Inventory

### New files (13)

| File | Responsibility |
|------|----------------|
| `supabase/migrations/006_create_discovery_sources.sql` | discovery_sources table |
| `lib/types/discovery.ts` | DiscoverySource, DiscoverySourceType, CompanyParseResult |
| `lib/data/seed-companies.ts` | Static curated dataset of ~50 US infrastructure companies |
| `lib/engine/parse-csv.ts` | Pure function: CSV text → CompanyParseResult |
| `lib/engine/parse-pasted-list.ts` | Pure function: multiline text → CompanyParseResult |
| `lib/actions/discovery-actions.ts` | Server actions for all 3 input methods + seed stats |
| `components/admin/discovery-tabs.tsx` | Client: tab switcher with state |
| `components/admin/csv-upload-panel.tsx` | Client: file input + validation |
| `components/admin/pasted-list-panel.tsx` | Client: textarea input |
| `components/admin/seed-expansion-panel.tsx` | Client: live counts + run button |
| `components/admin/discovery-results.tsx` | Presentational: summary + per-company table |
| `app/(crm)/admin/discovery/page.tsx` | Server component page shell |
| `app/api/agents/discovery-seed/route.ts` | GET route for scheduled seed expansion |

### Modified files (5)

| File | Change |
|------|--------|
| `lib/supabase/database.types.ts` | Add discovery_sources Row/Insert/Update |
| `lib/types/index.ts` | Re-export `"./discovery"` |
| `lib/supabase/queries.ts` | Add DiscoverySource mapper + CRUD |
| `lib/constants/navigation.ts` | Add "Company Discovery" nav item |
| `vercel.json` | Add weekly seed expansion cron |

### Unchanged (reused as-is)

- `lib/agents/discovery-agent.ts`
- `lib/types/agents.ts` (AgentName already includes "discovery")
- `lib/engine/classify-company.ts`
- `lib/utils/scoring.ts`
