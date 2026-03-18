import type { CompanyType, InfraVerdict } from "@/lib/types";

/**
 * Default infra ownership verdict for each company type.
 * Used as a fallback when evidence-based inference is inconclusive.
 * Shared by both account and prospect qualification engines.
 */
export const COMPANY_TYPE_INFRA_DEFAULT: Record<CompanyType, InfraVerdict> = {
  hyperscaler: "owned",
  datacenter_operator: "owned",
  ai_infrastructure_provider: "owned",
  colo_provider: "leased",
  private_cloud_provider: "hybrid",
  oem: "hybrid",
  system_integrator: "unknown",
  storage_vendor: "unknown",
  rugged_computing_vendor: "unknown",
  enterprise_end_user: "outsourced",
  bank_financial: "outsourced",
  gov_edu: "outsourced",
  reseller: "unknown",
  repair_refurb: "unknown",
  msp: "leased",
  itad: "unknown",
  colo_bare_metal: "leased",
  other: "unknown",
};
