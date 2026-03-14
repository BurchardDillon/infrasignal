# InfraSignal CRM Shell Design

**Date:** 2026-03-13
**Status:** Approved
**Scope:** Folder structure, TypeScript types, page scaffolding, navigation/layout. No APIs.

---

## 1. Overview

InfraSignal is a private intelligence CRM for discovering and qualifying companies that buy system-level hardware (GPUs, servers, SSDs, HDDs, SAN/NAS, memory, networking). This spec covers the UI shell: folder structure, data models, page scaffolds, and navigation.

## 2. Folder Structure

```
app/
  (crm)/
    layout.tsx            # Shared CRM layout with sidebar
    dashboard/
      page.tsx
    accounts/
      page.tsx            # Accounts list
      [id]/
        page.tsx          # Account detail
    contacts/
      page.tsx
    intelligence/
      page.tsx
    prospecting/
      page.tsx

components/
  ui/                     # Reusable primitives (Badge, Card, StatCard, DataTable)
  layout/                 # Sidebar, Header, NavItem
  dashboard/              # Dashboard widgets (stat cards, feed)
  accounts/               # Account-specific components
  contacts/               # Contact-specific components
  intelligence/           # News intelligence components
  prospecting/            # Prospecting queue components

lib/
  types/                  # Centralized TypeScript types
    index.ts              # Re-exports
    enums.ts              # All shared enums
    shared.ts             # Shared compound types (ComponentFit, ComponentImpact, NewsAccountLink)
    accounts.ts           # Account type
    contacts.ts           # Contact type
    evidence.ts           # Evidence type
    news.ts               # NewsItem type
    prospects.ts          # Prospect type
  constants/              # App-wide constants (nav items, labels, etc.)
  utils/                  # Utility functions
  data/                   # Mock data for scaffolding
```

## 3. Data Models

### 3.1 Shared Enums

```typescript
// Hardware categories tracked by the CRM
HardwareCategory: gpu | server | ssd | hdd | san_nas | memory | networking

// Reusable likelihood scale
Likelihood: high | medium | low | unknown

// Evidence strength assessment
EvidenceStrength: strong | moderate | weak | none

// Company classification
CompanyType:
  hyperscaler | oem | system_integrator | datacenter_operator | colo_provider |
  private_cloud_provider | ai_infrastructure_provider | storage_vendor |
  rugged_computing_vendor | enterprise_end_user | bank_financial | gov_edu |
  reseller | other

// Infrastructure ownership
InfraVerdict: owned | leased | hybrid | outsourced | unknown

// Account lifecycle
AccountStatus: active | nurturing | churned | on_hold

// Prospect lifecycle
ProspectStatus: new | reviewing | qualified | dismissed

// How prospect was discovered
ProspectSource: manual | news_crawl | referral | import

// Contact department
Department:
  engineering | infrastructure | procurement | it | executive | finance | other

// Contact seniority
SeniorityTier: c_suite | vp | director | manager | ic | unknown

// Contact role classification
RoleCategory:
  procurement | supply_chain | infrastructure | platform_engineering |
  hardware_engineering | datacenter_ops | executive | finance | other

// Email verification level
EmailConfidence: verified | likely | guess | unknown

// Contact importance
ContactPriority: primary | secondary | monitor

// Outreach tracking
OutreachStatus:
  not_contacted | contacted | responded | meeting_set | not_interested

// Evidence source classification
EvidenceSourceType:
  job_posting | rfi_rfp | press_release | sec_filing | company_site |
  engineering_blog | partner_page | datacenter_provider | vendor_record |
  technical_doc | news_article | industry_report | social_media | other

// Evidence signal direction
SignalDirection: positive | negative | neutral

// Evidence signal classification
SignalCategory:
  purchase_intent | infrastructure_footprint | hiring_signal |
  expansion_signal | partnership_signal | outsourcing_signal | vendor_switch |
  supply_signal | tech_adoption | budget_signal | other

// News event classification
NewsEventType:
  acquisition | expansion | earnings | partnership | product_launch |
  hiring_signal | infrastructure_build | shortage | price_movement |
  supply_disruption | cloud_migration | on_prem_buildout | regulatory |
  compliance_or_tariff_issue | government_contract | other

// How a news item was linked to an account
NewsLinkType: auto | manual

// Standardized employee count ranges
EmployeeCountRange:
  1_to_50 | 51_to_200 | 201_to_500 | 501_to_1000 |
  1001_to_5000 | 5001_to_10000 | 10001_plus
```

### 3.2 Prospect

Lightweight pre-qualification queue entry. Promoted to Account when qualified.

| Field | Type | Notes |
|-------|------|-------|
| id | string (uuid) | |
| company_name | string | |
| domain | string \| null | |
| industry | string \| null | |
| employee_count_range | EmployeeCountRange \| null | Standardized range |
| hq_location | string \| null | |
| priority_score | number | 0-100, computed from signal density, company size, and hardware category match |
| signal_summary | string \| null | Why this scored high (null for manual entries) |
| proposed_company_type | CompanyType \| null | Pre-qualification guess |
| proposed_direct_buy_likelihood | Likelihood | Pre-qualification guess |
| proposed_infra_ownership_verdict | InfraVerdict | Pre-qualification guess |
| hardware_categories | HardwareCategory[] | |
| source | ProspectSource | |
| status | ProspectStatus | |
| promoted_account_id | string \| null | Set when promoted |
| promoted_at | Date \| null | When qualified/promoted |
| dismissed_at | Date \| null | When dismissed |
| notes | string \| null | |
| created_at | Date | |
| updated_at | Date | |

### 3.3 Account

Full company profile after qualification.

| Field | Type | Notes |
|-------|------|-------|
| id | string (uuid) | |
| company_name | string | |
| domain | string \| null | |
| website | string \| null | Full URL |
| linkedin_company_url | string \| null | |
| industry | string \| null | |
| employee_count_range | EmployeeCountRange \| null | Standardized range |
| hq_location | string \| null | |
| company_type | CompanyType | |
| status | AccountStatus | |
| direct_buy_likelihood | Likelihood | |
| infra_ownership_verdict | InfraVerdict | |
| evidence_strength | EvidenceStrength | |
| why_it_matters | string \| null | Why this account is worth pursuing (filled during qualification or later) |
| negative_signals | string \| null | Reasons for caution |
| component_fit | ComponentFit[] | Per-category fit reasoning |
| hardware_categories | HardwareCategory[] | |
| notes | string \| null | |
| source_prospect_id | string \| null | If promoted from prospect |
| last_reviewed_at | Date \| null | |
| created_at | Date | |
| updated_at | Date | |

ComponentFit: `{ category: HardwareCategory, fit_reason: string }`

### 3.4 Contact

A person at an account.

| Field | Type | Notes |
|-------|------|-------|
| id | string (uuid) | |
| account_id | string | FK → Account |
| full_name | string | |
| first_name | string | |
| last_name | string | |
| email | string \| null | |
| email_confidence | EmailConfidence | Defaults to "unknown" when email is null |
| email_pattern | string \| null | e.g. "first.last@domain.com" |
| phone | string \| null | |
| title | string \| null | |
| department | Department | |
| seniority_tier | SeniorityTier | |
| role_category | RoleCategory | |
| likely_manages | string \| null | e.g. "GPU cluster ops, 12-person team" |
| why_relevant | string \| null | Why this person matters (filled during research) |
| likely_works_with | string \| null | Other departments/roles |
| linkedin_url | string \| null | |
| contact_priority | ContactPriority | |
| outreach_status | OutreachStatus | |
| notes | string \| null | |
| created_at | Date | |
| updated_at | Date | |

### 3.5 Evidence

Intelligence linked to an account — purchase signals or technology footprint.

| Field | Type | Notes |
|-------|------|-------|
| id | string (uuid) | |
| account_id | string | FK → Account |
| headline | string | Short label |
| description | string | Analysis/interpretation |
| raw_excerpt | string \| null | Verbatim quote from source |
| source_url | string \| null | |
| source_type | EvidenceSourceType | |
| signal_direction | SignalDirection | |
| signal_category | SignalCategory | |
| reliability_score | number | 0-100 |
| hardware_categories | HardwareCategory[] | |
| detected_at | Date | |
| created_at | Date | |
| updated_at | Date | |

### 3.6 NewsItem

External intelligence article with commercial analysis.

| Field | Type | Notes |
|-------|------|-------|
| id | string (uuid) | |
| title | string | |
| summary | string | |
| source_url | string | |
| source_name | string | |
| published_at | Date | |
| event_type | NewsEventType | |
| urgency_score | number | 0-100 |
| commercial_relevance_score | number | 0-100 |
| confidence_score | number | 0-100 |
| impact_summary | string | What this means for hardware sales |
| recommended_outreach_department | Department \| null | |
| suggested_outreach_angle | string \| null | |
| component_impact | ComponentImpact[] | Per-category impact |
| hardware_categories | HardwareCategory[] | |
| account_id | string \| null | Primary account linkage |
| linked_accounts | NewsAccountLink[] | Secondary relationships |
| created_at | Date | |
| updated_at | Date | |

ComponentImpact: `{ category: HardwareCategory, impact: string }`
NewsAccountLink: `{ account_id: string, link_type: NewsLinkType }`

All three compound types (`ComponentFit`, `ComponentImpact`, `NewsAccountLink`) live in `lib/types/shared.ts`.

**Relationship note:** Account does not store news item references. The Account Detail page queries news items by matching `account_id` or `linked_accounts[].account_id` — this is a derived relationship, not a stored FK on Account.

## 4. Pages

### 4.1 Dashboard
Combined overview with two sections:
- **Pipeline stats**: total accounts, accounts by status breakdown, prospects in queue, top 5 prospects by priority_score, new signals this week count.
- **Intelligence feed**: chronological list of the most recent evidence items and news hits (interleaved by date), each linking to its parent account or news detail.

### 4.2 Accounts List
Filterable table of all accounts. Columns: company_name, company_type, status, evidence_strength, direct_buy_likelihood, hardware_categories, last_reviewed_at. Click row → Account Detail.

### 4.3 Account Detail
Single account view with sections: company profile header, component fit, evidence list, linked contacts, linked news items, notes. Negative signals displayed prominently.

### 4.4 Contacts
Filterable table across all accounts. Columns: full_name, title, account (linked), department, seniority_tier, role_category, contact_priority, outreach_status. Clicking a contact row navigates to the parent Account Detail page. No standalone contact detail route — contacts are always viewed in account context.

### 4.5 News Intelligence
Feed of news items. Each card shows: title, event_type, urgency/relevance/confidence scores, impact_summary, linked account(s), suggested_outreach_angle. Auto-linked and manually linked accounts both shown.

### 4.6 Prospecting Queue
Scored queue sorted by priority_score descending. Columns: company_name, priority_score, proposed_company_type, proposed_direct_buy_likelihood, hardware_categories, status. Actions: qualify (promote to Account) or dismiss.

## 5. Layout & Navigation

- `(crm)/layout.tsx`: shared layout with collapsible sidebar + top header
- Sidebar nav items: Dashboard, Accounts, Contacts, News Intelligence, Prospecting Queue
- Icons from lucide-react
- Dark theme using Tailwind v4 dark mode
- Responsive: sidebar collapses on mobile

## 6. Out of Scope

- API routes and data fetching
- Authentication
- Supabase schema/migrations
- Real data — mock data only for scaffolding
