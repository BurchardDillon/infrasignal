export type HardwareCategory =
  | "gpu"
  | "server"
  | "ssd"
  | "hdd"
  | "san_nas"
  | "memory"
  | "networking";

export type Likelihood = "high" | "medium" | "low" | "unknown";

export type EvidenceStrength = "strong" | "moderate" | "weak" | "none";

export type CompanyType =
  | "hyperscaler"
  | "oem"
  | "system_integrator"
  | "datacenter_operator"
  | "colo_provider"
  | "private_cloud_provider"
  | "ai_infrastructure_provider"
  | "storage_vendor"
  | "rugged_computing_vendor"
  | "enterprise_end_user"
  | "bank_financial"
  | "gov_edu"
  | "reseller"
  | "repair_refurb"
  | "msp"
  | "itad"
  | "colo_bare_metal"
  | "other";

export type InfraVerdict =
  | "owned"
  | "leased"
  | "hybrid"
  | "outsourced"
  | "unknown";

export type AccountStatus = "active" | "nurturing" | "churned" | "on_hold";

export type ProspectStatus = "new" | "reviewing" | "qualified" | "dismissed";

export type ProspectSource = "manual" | "news_crawl" | "referral" | "import";

export type Department =
  | "engineering"
  | "infrastructure"
  | "procurement"
  | "it"
  | "executive"
  | "finance"
  | "other";

export type SeniorityTier =
  | "c_suite"
  | "vp"
  | "director"
  | "manager"
  | "ic"
  | "unknown";

export type RoleCategory =
  | "procurement"
  | "supply_chain"
  | "infrastructure"
  | "platform_engineering"
  | "hardware_engineering"
  | "datacenter_ops"
  | "executive"
  | "finance"
  | "other";

export type EmailConfidence = "verified" | "likely" | "guess" | "unknown";

export type ContactPriority = "primary" | "secondary" | "monitor";

export type OutreachStatus =
  | "not_contacted"
  | "contacted"
  | "responded"
  | "meeting_set"
  | "not_interested";

export type EvidenceSourceType =
  | "job_posting"
  | "rfi_rfp"
  | "press_release"
  | "sec_filing"
  | "company_site"
  | "engineering_blog"
  | "partner_page"
  | "datacenter_provider"
  | "vendor_record"
  | "technical_doc"
  | "news_article"
  | "industry_report"
  | "social_media"
  | "other";

export type SignalDirection = "positive" | "negative" | "neutral";

export type SignalCategory =
  | "purchase_intent"
  | "infrastructure_footprint"
  | "hiring_signal"
  | "expansion_signal"
  | "partnership_signal"
  | "outsourcing_signal"
  | "vendor_switch"
  | "supply_signal"
  | "tech_adoption"
  | "budget_signal"
  | "other";

export type NewsEventType =
  | "acquisition"
  | "expansion"
  | "earnings"
  | "partnership"
  | "product_launch"
  | "hiring_signal"
  | "infrastructure_build"
  | "shortage"
  | "price_movement"
  | "supply_disruption"
  | "cloud_migration"
  | "on_prem_buildout"
  | "regulatory"
  | "compliance_or_tariff_issue"
  | "government_contract"
  | "other";

export type NewsLinkType = "auto" | "manual";

export type EmployeeCountRange =
  | "1_to_50"
  | "51_to_200"
  | "201_to_500"
  | "501_to_1000"
  | "1001_to_5000"
  | "5001_to_10000"
  | "10001_plus";
