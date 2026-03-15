import type {
  Department,
  HardwareCategory,
  NewsEventType,
  RawArticleInput,
  InterpretedNews,
  ComponentImpact,
} from "@/lib/types";
import {
  NEWS_EVENT_LABELS,
  HARDWARE_CATEGORY_LABELS,
} from "@/lib/constants/labels";

// ---------------------------------------------------------------------------
// Keyword dictionaries
// ---------------------------------------------------------------------------

const HARDWARE_KEYWORDS: Record<HardwareCategory, string[]> = {
  gpu: [
    "gpu", "graphics processing", "nvidia", "a100", "h100", "h200", "b200",
    "b100", "l40", "accelerator", "cuda", "tensor core", "graphics card",
    "geforce", "quadro", "radeon", "amd instinct", "intel arc", "gaudi",
    "gb200", "gb300", "dgx", "hgx",
  ],
  server: [
    "server", "rack", "chassis", "motherboard", "cpu", "processor", "epyc",
    "xeon", "bare metal", "compute node", "blade server", "1u ", "2u ", "4u ",
    "rack unit",
  ],
  ssd: [
    "ssd", "nvme", "nand", "flash storage", "solid state", "pcie gen",
    "flash drive",
  ],
  hdd: [
    "hdd", "hard drive", "hard disk", "spinning disk", "nearline",
    "seagate", "western digital",
  ],
  san_nas: [
    "san ", "nas ", "storage area network", "network attached storage",
    "storage array", "iscsi", "fibre channel",
  ],
  memory: [
    "memory", "ddr4", "ddr5", "ram", "dimm", "ecc memory", "hbm",
    "high bandwidth memory", "dram",
  ],
  networking: [
    "switch", "router", "infiniband", "ethernet", "400g", "800g",
    "network fabric", "spine leaf", "top of rack", "tor switch",
    "optic", "transceiver", "fiber", "interconnect",
  ],
};

const EVENT_TYPE_KEYWORDS: Record<NewsEventType, string[]> = {
  acquisition: [
    "acquires", "acquisition", "bought", "merger", "takeover", "acquiring",
    "merged with",
  ],
  expansion: [
    "expansion", "expands", "new location", "new site", "ipo", "raises",
    "funding", "series ", "public offering", "growth", "scale up",
  ],
  earnings: [
    "earnings", "revenue", "quarterly results", "financial results",
    "profit", "q1 ", "q2 ", "q3 ", "q4 ", "annual report", "fiscal year",
  ],
  partnership: [
    "partnership", "partners with", "collaborat", "joint venture", "alliance",
    "teaming up",
  ],
  product_launch: [
    "launches", "launch", "new product", "announces", "unveils",
    "introduces", "debuts", "new offering", "general availability",
  ],
  hiring_signal: [
    "hiring", "recruits", "job posting", "open roles", "talent",
    "headcount", "workforce", "new hires",
  ],
  infrastructure_build: [
    "data center", "datacenter", "new facility", "breaks ground",
    "construction", "campus", "buildout", "build out", "megawatt",
    "power capacity",
  ],
  shortage: [
    "shortage", "supply constrain", "allocation", "scarcity",
    "lead time", "backlog", "out of stock",
  ],
  price_movement: [
    "price increase", "price decrease", "pricing", "price hike",
    "cost reduction", "price cut", "price change",
  ],
  supply_disruption: [
    "disruption", "outage", "disaster", "fire", "flood",
    "supply chain disruption", "halt", "shutdown",
  ],
  cloud_migration: [
    "cloud migration", "move to cloud", "hybrid cloud", "multi cloud",
    "cloud first", "saas migration", "cloud transition",
  ],
  on_prem_buildout: [
    "on prem", "on-prem", "private cloud", "owned infrastructure",
    "in house server", "self hosted", "private infrastructure",
  ],
  regulatory: [
    "regulation", "regulatory", "compliance requirement", "policy change",
    "government regulation",
  ],
  compliance_or_tariff_issue: [
    "tariff", "trade war", "export control", "compliance", "sanction",
    "ban", "restriction", "chip act", "trade restriction",
  ],
  government_contract: [
    "government contract", "federal", "defense contract", "gov contract",
    "public sector", "dod", "pentagon", "military contract",
  ],
  other: [],
};

// Priority ordering for tie-breaking in event classification.
// Earlier entries win ties.
const EVENT_TYPE_PRIORITY: NewsEventType[] = [
  "infrastructure_build",
  "acquisition",
  "expansion",
  "shortage",
  "supply_disruption",
  "on_prem_buildout",
  "government_contract",
  "cloud_migration",
  "hiring_signal",
  "product_launch",
  "partnership",
  "price_movement",
  "earnings",
  "compliance_or_tariff_issue",
  "regulatory",
  "other",
];

const EVENT_URGENCY_BASE: Record<NewsEventType, number> = {
  acquisition: 75,
  expansion: 80,
  earnings: 50,
  partnership: 55,
  product_launch: 65,
  hiring_signal: 60,
  infrastructure_build: 85,
  shortage: 90,
  price_movement: 70,
  supply_disruption: 95,
  cloud_migration: 45,
  on_prem_buildout: 80,
  regulatory: 40,
  compliance_or_tariff_issue: 55,
  government_contract: 70,
  other: 30,
};

const EVENT_COMMERCIAL_BONUS: Record<NewsEventType, number> = {
  infrastructure_build: 30,
  expansion: 25,
  on_prem_buildout: 25,
  shortage: 20,
  government_contract: 20,
  acquisition: 15,
  supply_disruption: 15,
  product_launch: 10,
  hiring_signal: 10,
  price_movement: 10,
  partnership: 8,
  cloud_migration: 5,
  earnings: 5,
  compliance_or_tariff_issue: 5,
  regulatory: 3,
  other: 0,
};

const EVENT_DEPARTMENT_MAP: Record<NewsEventType, Department | null> = {
  acquisition: "executive",
  expansion: "procurement",
  earnings: null,
  partnership: "executive",
  product_launch: "engineering",
  hiring_signal: "infrastructure",
  infrastructure_build: "infrastructure",
  shortage: "procurement",
  price_movement: "procurement",
  supply_disruption: "procurement",
  cloud_migration: "it",
  on_prem_buildout: "infrastructure",
  regulatory: "finance",
  compliance_or_tariff_issue: "finance",
  government_contract: "procurement",
  other: null,
};

const URGENCY_BOOST_KEYWORDS = [
  "immediately", "urgent", "this quarter", "critical", "emergency",
  "asap", "right now", "time-sensitive",
];

const URGENCY_DAMPEN_KEYWORDS = [
  "long-term", "exploring", "considering", "evaluating",
  "future", "roadmap", "next year", "preliminary",
];

const PURCHASE_KEYWORDS = [
  "procurement", "purchase", "order", "contract", "volume",
  "at scale", "buy", "sourcing", "rfp", "rfi",
];

const RELIABLE_SOURCES = [
  "reuters", "bloomberg", "wsj", "wall street journal", "financial times",
  "cnbc", "techcrunch", "the register", "datacenter dynamics",
  "press release", "sec.gov", "businesswire", "prnewswire", "globenewswire",
];

// ---------------------------------------------------------------------------
// Outreach angle templates
// ---------------------------------------------------------------------------

const OUTREACH_ANGLE_TEMPLATES: Record<NewsEventType, string | null> = {
  infrastructure_build:
    "New infrastructure buildout creates opportunity to position {hardware} supply and volume pricing.",
  expansion:
    "Growth trajectory suggests upcoming procurement cycles for {hardware}.",
  on_prem_buildout:
    "On-prem investment signals direct procurement needs for {hardware}.",
  shortage:
    "Supply constraints create urgency for securing {hardware} allocations from reliable vendors.",
  acquisition:
    "Post-acquisition integration may drive infrastructure consolidation and {hardware} refresh cycles.",
  supply_disruption:
    "Supply chain disruption opens door for alternative {hardware} sourcing partnerships.",
  government_contract:
    "Government contract requirements often mandate certified {hardware} procurement channels.",
  hiring_signal:
    "Infrastructure hiring surge indicates upcoming {hardware} procurement to support team growth.",
  product_launch:
    "New product/service launch likely requires additional {hardware} capacity.",
  cloud_migration:
    "Cloud migration may create opportunities for hybrid infrastructure {hardware} needs.",
  partnership:
    "New partnership may drive joint infrastructure investments in {hardware}.",
  price_movement:
    "Pricing shifts create window to present competitive {hardware} offers.",
  earnings: null,
  regulatory: null,
  compliance_or_tariff_issue:
    "Compliance changes may require {hardware} sourcing from approved vendors.",
  other: null,
};

// ---------------------------------------------------------------------------
// Component impact templates
// ---------------------------------------------------------------------------

const COMPONENT_IMPACT_TEMPLATES: Record<NewsEventType, string> = {
  infrastructure_build: "New facility construction drives {hw} procurement demand",
  expansion: "Growth trajectory increases {hw} consumption",
  on_prem_buildout: "On-prem investment creates direct {hw} purchasing need",
  shortage: "Supply constraints elevate urgency for {hw} allocation",
  acquisition: "Post-acquisition integration may trigger {hw} refresh cycle",
  supply_disruption: "Disruption creates alternative sourcing opportunity for {hw}",
  government_contract: "Government contract drives certified {hw} procurement",
  hiring_signal: "Team growth signals upcoming {hw} infrastructure expansion",
  product_launch: "New launch requires additional {hw} capacity",
  cloud_migration: "Cloud transition creates hybrid {hw} infrastructure needs",
  partnership: "Partnership may drive joint {hw} investment",
  price_movement: "Price shift affects {hw} procurement economics",
  earnings: "Financial results may influence {hw} budget allocation",
  regulatory: "Regulatory change may impact {hw} sourcing requirements",
  compliance_or_tariff_issue: "Compliance requirements affect {hw} vendor eligibility",
  other: "Market activity may influence {hw} demand",
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function countMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Detection and classification functions
// ---------------------------------------------------------------------------

function detectHardwareCategories(text: string): HardwareCategory[] {
  const lower = text.toLowerCase();
  const detected: HardwareCategory[] = [];

  for (const [category, keywords] of Object.entries(HARDWARE_KEYWORDS)) {
    if (countMatches(lower, keywords) > 0) {
      detected.push(category as HardwareCategory);
    }
  }

  return detected;
}

function classifyEventType(text: string): {
  event_type: NewsEventType;
  totalMatchCount: number;
} {
  const lower = text.toLowerCase();
  const scores: { type: NewsEventType; count: number }[] = [];

  for (const [eventType, keywords] of Object.entries(EVENT_TYPE_KEYWORDS)) {
    if (eventType === "other") continue;
    const count = countMatches(lower, keywords);
    if (count > 0) {
      scores.push({ type: eventType as NewsEventType, count });
    }
  }

  if (scores.length === 0) {
    return { event_type: "other", totalMatchCount: 0 };
  }

  // Sort by count descending, then by priority ordering for ties
  scores.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (
      EVENT_TYPE_PRIORITY.indexOf(a.type) -
      EVENT_TYPE_PRIORITY.indexOf(b.type)
    );
  });

  const totalMatchCount = scores.reduce((sum, s) => sum + s.count, 0);
  return { event_type: scores[0].type, totalMatchCount };
}

function computeUrgency(eventType: NewsEventType, text: string): number {
  const lower = text.toLowerCase();
  let score = EVENT_URGENCY_BASE[eventType];

  // Boost for urgency language
  const boostCount = countMatches(lower, URGENCY_BOOST_KEYWORDS);
  score += boostCount * 5;

  // Dampen for tentative language
  const dampenCount = countMatches(lower, URGENCY_DAMPEN_KEYWORDS);
  score -= dampenCount * 5;

  return clamp(score, 0, 100);
}

function computeCommercialRelevance(
  hwCategories: HardwareCategory[],
  eventType: NewsEventType,
  text: string
): number {
  const lower = text.toLowerCase();

  // Hardware breadth component (up to 40 points)
  const breadthScore = Math.round((hwCategories.length / 7) * 40);

  // Event type bonus (up to 30 points)
  const eventBonus = EVENT_COMMERCIAL_BONUS[eventType];

  // Purchase keyword modifiers (up to 15 points)
  const purchaseMatches = countMatches(lower, PURCHASE_KEYWORDS);
  const purchaseBonus = Math.min(purchaseMatches * 3, 15);

  return clamp(breadthScore + eventBonus + purchaseBonus, 0, 100);
}

function computeConfidence(
  totalMatchCount: number,
  textLength: number,
  sourceUrl: string
): number {
  // Keyword match density (up to 50 points)
  const matchScore = Math.min(totalMatchCount * 8, 50);

  // Body length factor (up to 30 points)
  const lengthScore = Math.min(Math.round(textLength / 50), 30);

  // Source reliability (10 or 20 points)
  const lowerUrl = sourceUrl.toLowerCase();
  const isReliable = RELIABLE_SOURCES.some((s) => lowerUrl.includes(s));
  const sourceScore = isReliable ? 20 : 10;

  return clamp(matchScore + lengthScore + sourceScore, 0, 100);
}

function generateImpactSummary(
  eventType: NewsEventType,
  hwCategories: HardwareCategory[],
  mentionedCompanies: string[]
): string {
  const eventLabel = NEWS_EVENT_LABELS[eventType];
  const hwLabels = hwCategories.map((c) => HARDWARE_CATEGORY_LABELS[c]);
  const hwList = hwLabels.length > 0 ? hwLabels.join(", ") : "hardware";

  let summary = `${eventLabel} detected affecting ${hwList}.`;

  if (mentionedCompanies.length > 0) {
    const companies = mentionedCompanies.slice(0, 3).join(", ");
    summary += ` Companies involved: ${companies}.`;
  }

  return summary;
}

function deriveOutreachDepartment(
  eventType: NewsEventType
): Department | null {
  return EVENT_DEPARTMENT_MAP[eventType];
}

function generateOutreachAngle(
  eventType: NewsEventType,
  hwCategories: HardwareCategory[]
): string | null {
  const template = OUTREACH_ANGLE_TEMPLATES[eventType];
  if (!template) return null;

  const hwLabels = hwCategories.map((c) => HARDWARE_CATEGORY_LABELS[c]);
  const hwList = hwLabels.length > 0 ? hwLabels.join(", ") : "hardware";

  return template.replace("{hardware}", hwList);
}

function buildComponentImpact(
  hwCategories: HardwareCategory[],
  eventType: NewsEventType
): ComponentImpact[] {
  const template = COMPONENT_IMPACT_TEMPLATES[eventType];

  return hwCategories.map((category) => ({
    category,
    impact: template.replace("{hw}", HARDWARE_CATEGORY_LABELS[category]),
  }));
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function interpretArticle(raw: RawArticleInput): InterpretedNews {
  const fullText = `${raw.title} ${raw.body}`;

  // 1. Detect hardware categories
  const hardware_categories = detectHardwareCategories(fullText);

  // 2. Classify event type
  const { event_type, totalMatchCount } = classifyEventType(fullText);

  // 3. Compute scores
  const urgency_score = computeUrgency(event_type, fullText);
  const commercial_relevance_score = computeCommercialRelevance(
    hardware_categories,
    event_type,
    fullText
  );
  const confidence_score = computeConfidence(
    totalMatchCount,
    raw.body.length,
    raw.source_url
  );

  // 4. Generate textual outputs
  const impact_summary = generateImpactSummary(
    event_type,
    hardware_categories,
    raw.mentioned_companies
  );
  const recommended_outreach_department = deriveOutreachDepartment(event_type);
  const suggested_outreach_angle = generateOutreachAngle(
    event_type,
    hardware_categories
  );

  // 5. Build component impact
  const component_impact = buildComponentImpact(
    hardware_categories,
    event_type
  );

  return {
    event_type,
    urgency_score,
    commercial_relevance_score,
    confidence_score,
    impact_summary,
    recommended_outreach_department,
    suggested_outreach_angle,
    component_impact,
    hardware_categories,
  };
}
