import type {
  AccountStatus,
  CompanyType,
  ContactPriority,
  Department,
  EmailConfidence,
  EmployeeCountRange,
  EvidenceSourceType,
  EvidenceStrength,
  HardwareCategory,
  InfraVerdict,
  Likelihood,
  NewsEventType,
  OutreachStatus,
  ProspectSource,
  ProspectStatus,
  RoleCategory,
  SeniorityTier,
  SignalCategory,
  SignalDirection,
} from "@/lib/types";

export const HARDWARE_CATEGORY_LABELS: Record<HardwareCategory, string> = {
  gpu: "GPU",
  server: "Server",
  ssd: "SSD",
  hdd: "HDD",
  san_nas: "SAN/NAS",
  memory: "Memory",
  networking: "Networking",
};

export const LIKELIHOOD_LABELS: Record<Likelihood, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  unknown: "Unknown",
};

export const EVIDENCE_STRENGTH_LABELS: Record<EvidenceStrength, string> = {
  strong: "Strong",
  moderate: "Moderate",
  weak: "Weak",
  none: "None",
};

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  hyperscaler: "Hyperscaler",
  oem: "OEM",
  system_integrator: "System Integrator",
  datacenter_operator: "Datacenter Operator",
  colo_provider: "Colo Provider",
  private_cloud_provider: "Private Cloud Provider",
  ai_infrastructure_provider: "AI Infrastructure Provider",
  storage_vendor: "Storage Vendor",
  rugged_computing_vendor: "Rugged Computing Vendor",
  enterprise_end_user: "Enterprise End User",
  bank_financial: "Bank / Financial",
  gov_edu: "Gov / Edu",
  reseller: "Reseller",
  repair_refurb: "Repair / Refurb",
  msp: "MSP",
  itad: "ITAD",
  colo_bare_metal: "Colo / Bare Metal",
  other: "Other",
};

export const INFRA_VERDICT_LABELS: Record<InfraVerdict, string> = {
  owned: "Owned",
  leased: "Leased",
  hybrid: "Hybrid",
  outsourced: "Outsourced",
  unknown: "Unknown",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  nurturing: "Nurturing",
  churned: "Churned",
  on_hold: "On Hold",
};

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  qualified: "Qualified",
  dismissed: "Dismissed",
};

export const PROSPECT_SOURCE_LABELS: Record<ProspectSource, string> = {
  manual: "Manual",
  news_crawl: "News Crawl",
  referral: "Referral",
  import: "Import",
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  engineering: "Engineering",
  infrastructure: "Infrastructure",
  procurement: "Procurement",
  it: "IT",
  executive: "Executive",
  finance: "Finance",
  other: "Other",
};

export const SENIORITY_LABELS: Record<SeniorityTier, string> = {
  c_suite: "C-Suite",
  vp: "VP",
  director: "Director",
  manager: "Manager",
  ic: "IC",
  unknown: "Unknown",
};

export const ROLE_CATEGORY_LABELS: Record<RoleCategory, string> = {
  procurement: "Procurement",
  supply_chain: "Supply Chain",
  infrastructure: "Infrastructure",
  platform_engineering: "Platform Engineering",
  hardware_engineering: "Hardware Engineering",
  datacenter_ops: "Datacenter Ops",
  executive: "Executive",
  finance: "Finance",
  other: "Other",
};

export const EMAIL_CONFIDENCE_LABELS: Record<EmailConfidence, string> = {
  verified: "Verified",
  likely: "Likely",
  guess: "Guess",
  unknown: "Unknown",
};

export const CONTACT_PRIORITY_LABELS: Record<ContactPriority, string> = {
  primary: "Primary",
  secondary: "Secondary",
  monitor: "Monitor",
};

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  not_contacted: "Not Contacted",
  contacted: "Contacted",
  responded: "Responded",
  meeting_set: "Meeting Set",
  not_interested: "Not Interested",
};

export const EVIDENCE_SOURCE_LABELS: Record<EvidenceSourceType, string> = {
  job_posting: "Job Posting",
  rfi_rfp: "RFI/RFP",
  press_release: "Press Release",
  sec_filing: "SEC Filing",
  company_site: "Company Site",
  engineering_blog: "Engineering Blog",
  partner_page: "Partner Page",
  datacenter_provider: "Datacenter Provider",
  vendor_record: "Vendor Record",
  technical_doc: "Technical Doc",
  news_article: "News Article",
  industry_report: "Industry Report",
  social_media: "Social Media",
  other: "Other",
};

export const SIGNAL_DIRECTION_LABELS: Record<SignalDirection, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral",
};

export const SIGNAL_CATEGORY_LABELS: Record<SignalCategory, string> = {
  purchase_intent: "Purchase Intent",
  infrastructure_footprint: "Infrastructure Footprint",
  hiring_signal: "Hiring Signal",
  expansion_signal: "Expansion Signal",
  partnership_signal: "Partnership Signal",
  outsourcing_signal: "Outsourcing Signal",
  vendor_switch: "Vendor Switch",
  supply_signal: "Supply Signal",
  tech_adoption: "Tech Adoption",
  budget_signal: "Budget Signal",
  other: "Other",
};

export const NEWS_EVENT_LABELS: Record<NewsEventType, string> = {
  acquisition: "Acquisition",
  expansion: "Expansion",
  earnings: "Earnings",
  partnership: "Partnership",
  product_launch: "Product Launch",
  hiring_signal: "Hiring Signal",
  infrastructure_build: "Infrastructure Build",
  shortage: "Shortage",
  price_movement: "Price Movement",
  supply_disruption: "Supply Disruption",
  cloud_migration: "Cloud Migration",
  on_prem_buildout: "On-Prem Buildout",
  regulatory: "Regulatory",
  compliance_or_tariff_issue: "Compliance / Tariff",
  government_contract: "Government Contract",
  other: "Other",
};

export const EMPLOYEE_COUNT_LABELS: Record<EmployeeCountRange, string> = {
  "1_to_50": "1-50",
  "51_to_200": "51-200",
  "201_to_500": "201-500",
  "501_to_1000": "501-1,000",
  "1001_to_5000": "1,001-5,000",
  "5001_to_10000": "5,001-10,000",
  "10001_plus": "10,001+",
};
