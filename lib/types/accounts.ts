import type {
  AccountStatus,
  CompanyType,
  EmployeeCountRange,
  EvidenceStrength,
  HardwareCategory,
  InfraVerdict,
  Likelihood,
} from "./enums";
import type { ComponentFit } from "./shared";

export interface Account {
  id: string;
  company_name: string;
  domain: string | null;
  website: string | null;
  linkedin_company_url: string | null;
  industry: string | null;
  employee_count_range: EmployeeCountRange | null;
  hq_location: string | null;
  company_type: CompanyType;
  status: AccountStatus;
  direct_buy_likelihood: Likelihood;
  infra_ownership_verdict: InfraVerdict;
  evidence_strength: EvidenceStrength;
  why_it_matters: string | null;
  negative_signals: string | null;
  component_fit: ComponentFit[];
  hardware_categories: HardwareCategory[];
  notes: string | null;
  source_prospect_id: string | null;
  last_reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
