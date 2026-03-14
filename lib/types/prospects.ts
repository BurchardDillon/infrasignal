import type {
  CompanyType,
  EmployeeCountRange,
  HardwareCategory,
  InfraVerdict,
  Likelihood,
  ProspectSource,
  ProspectStatus,
} from "./enums";

export interface Prospect {
  id: string;
  company_name: string;
  domain: string | null;
  industry: string | null;
  employee_count_range: EmployeeCountRange | null;
  hq_location: string | null;
  priority_score: number;
  signal_summary: string | null;
  proposed_company_type: CompanyType | null;
  proposed_direct_buy_likelihood: Likelihood;
  proposed_infra_ownership_verdict: InfraVerdict;
  hardware_categories: HardwareCategory[];
  source: ProspectSource;
  status: ProspectStatus;
  promoted_account_id: string | null;
  promoted_at: Date | null;
  dismissed_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}
