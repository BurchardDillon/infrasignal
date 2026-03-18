import type { CompanyType, HardwareCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Company type keyword classification
// ---------------------------------------------------------------------------

const COMPANY_TYPE_KEYWORDS: Record<CompanyType, string[]> = {
  hyperscaler: [
    "hyperscaler", "hyperscale", "aws", "amazon web services", "azure",
    "microsoft cloud", "google cloud", "gcp", "oracle cloud",
  ],
  ai_infrastructure_provider: [
    "ai infrastructure", "coreweave", "lambda labs", "modal",
    "together ai", "gpu cloud", "ai compute",
  ],
  datacenter_operator: [
    "data center", "datacenter", "equinix", "digital realty",
    "cyrusone", "qts", "switch",
  ],
  colo_provider: [
    "colocation", "colo provider", "colo",
  ],
  oem: [
    "oem", "original equipment", "dell", "hpe", "hewlett packard enterprise",
    "lenovo", "supermicro", "inspur", "server manufacturer",
  ],
  system_integrator: [
    "system integrator", "systems integrator", "integrator",
    "managed services", "it services",
  ],
  private_cloud_provider: [
    "private cloud", "hosted private", "nutanix", "vmware",
  ],
  storage_vendor: [
    "storage vendor", "netapp", "pure storage", "vast data",
    "weka", "storage solutions",
  ],
  rugged_computing_vendor: [
    "rugged", "mil-spec", "ruggedized", "edge computing defense",
  ],
  enterprise_end_user: [
    "enterprise", "fortune 500", "f500", "large enterprise",
  ],
  bank_financial: [
    "bank", "financial", "fintech", "hedge fund", "investment",
    "insurance", "credit union", "capital markets",
  ],
  gov_edu: [
    "government", "federal", "university", "education", "national lab",
    "department of", "ministry", "public sector",
  ],
  reseller: [
    "reseller", "distributor", "var ", "value added reseller", "channel partner",
  ],
  repair_refurb: [
    "repair", "refurbish", "refurbishment", "itad", "asset disposition",
    "hardware recycl", "board-level repair", "depot repair",
  ],
  msp: [
    "managed service", "msp", "managed hosting", "it service provider",
    "outsourced it", "it outsourcing",
  ],
  itad: [
    "it asset disposition", "itad", "hardware recycl", "e-waste",
    "decommission", "electronics recycl",
  ],
  colo_bare_metal: [
    "bare metal", "colocation", "dedicated server", "physical hosting",
    "bare-metal",
  ],
  other: [],
};

// Priority ordering for tie-breaking
const COMPANY_TYPE_PRIORITY: CompanyType[] = [
  "hyperscaler",
  "ai_infrastructure_provider",
  "datacenter_operator",
  "oem",
  "colo_provider",
  "private_cloud_provider",
  "system_integrator",
  "storage_vendor",
  "rugged_computing_vendor",
  "bank_financial",
  "enterprise_end_user",
  "gov_edu",
  "reseller",
  "repair_refurb",
  "msp",
  "itad",
  "colo_bare_metal",
  "other",
];

const HARDWARE_HINT_KEYWORDS: Record<HardwareCategory, string[]> = {
  gpu: ["gpu", "graphics", "nvidia", "accelerator", "cuda", "ai chip"],
  server: ["server", "rack", "compute", "cpu", "processor", "bare metal"],
  ssd: ["ssd", "nvme", "flash", "nand", "solid state"],
  hdd: ["hdd", "hard drive", "disk", "nearline", "spinning"],
  san_nas: ["san", "nas", "storage array", "storage area", "network attached"],
  memory: ["memory", "ddr", "ram", "dimm", "hbm", "dram"],
  networking: [
    "switch", "router", "infiniband", "ethernet", "networking", "optic",
    "transceiver",
  ],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function countMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify a company into one of the known CompanyType values
 * based on keyword matching against company name and industry.
 */
export function classifyCompanyType(
  companyName: string,
  industry: string | null
): CompanyType {
  const text = `${companyName} ${industry ?? ""}`.toLowerCase();

  const scores: { type: CompanyType; count: number }[] = [];

  for (const [companyType, keywords] of Object.entries(COMPANY_TYPE_KEYWORDS)) {
    if (companyType === "other") continue;
    const count = countMatches(text, keywords);
    if (count > 0) {
      scores.push({ type: companyType as CompanyType, count });
    }
  }

  if (scores.length === 0) return "other";

  // Sort by match count descending, then by priority for tie-breaking
  scores.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (
      COMPANY_TYPE_PRIORITY.indexOf(a.type) -
      COMPANY_TYPE_PRIORITY.indexOf(b.type)
    );
  });

  return scores[0].type;
}

/**
 * Detect hardware categories from free-text hints
 * (e.g., ["gpu", "server", "bare metal compute"]).
 */
export function detectHardwareCategoriesFromHints(
  hints: string[]
): HardwareCategory[] {
  if (hints.length === 0) return [];

  const text = hints.join(" ").toLowerCase();
  const detected: HardwareCategory[] = [];

  for (const [category, keywords] of Object.entries(HARDWARE_HINT_KEYWORDS)) {
    if (countMatches(text, keywords) > 0) {
      detected.push(category as HardwareCategory);
    }
  }

  return detected;
}
