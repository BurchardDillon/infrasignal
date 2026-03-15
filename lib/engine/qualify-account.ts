import type {
  Account,
  Evidence,
  NewsItem,
  CompanyType,
  InfraVerdict,
  Likelihood,
  EvidenceStrength,
  HardwareCategory,
  ComponentFit,
} from "@/lib/types";
import {
  computeAccountEvidenceStrength,
  computeDirectBuyLikelihood,
} from "@/lib/utils/scoring";
import {
  COMPANY_TYPE_LABELS,
  SIGNAL_CATEGORY_LABELS,
  HARDWARE_CATEGORY_LABELS,
  EVIDENCE_SOURCE_LABELS,
  NEWS_EVENT_LABELS,
} from "@/lib/constants/labels";
import { COMPANY_TYPE_INFRA_DEFAULT } from "./infra-defaults";

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface AccountQualification {
  infra_ownership_verdict: InfraVerdict;
  direct_buy_likelihood: Likelihood;
  evidence_strength: EvidenceStrength;
  why_it_matters: string | null;
  negative_signals: string | null;
  component_fit: ComponentFit[];
}

// ---------------------------------------------------------------------------
// Infra verdict inference
// ---------------------------------------------------------------------------
// Decision tree over evidence signal categories and directions.
// Falls back to company type defaults when evidence is insufficient.

function hasPositiveSignal(
  evidence: Evidence[],
  category: string
): boolean {
  return evidence.some(
    (e) =>
      e.signal_category === category && e.signal_direction === "positive"
  );
}

function inferInfraVerdict(
  evidence: Evidence[],
  companyType: CompanyType
): InfraVerdict {
  const hasInfra = hasPositiveSignal(evidence, "infrastructure_footprint");
  const hasExpansion = hasPositiveSignal(evidence, "expansion_signal");
  const hasOutsourcing = hasPositiveSignal(evidence, "outsourcing_signal");
  const hasPartnership = hasPositiveSignal(evidence, "partnership_signal");

  // Decision tree — first match wins
  if (hasInfra && hasExpansion) return "owned";
  if (hasInfra && hasPartnership) return "hybrid";
  if (hasInfra) return "owned";
  if (hasOutsourcing && !hasInfra) return "outsourced";
  if (hasPartnership && !hasInfra) return "leased";

  // No signal-based verdict — fall back to company type default
  return COMPANY_TYPE_INFRA_DEFAULT[companyType];
}

// ---------------------------------------------------------------------------
// Why it matters — template-based narrative
// ---------------------------------------------------------------------------

function generateWhyItMatters(
  account: Account,
  evidence: Evidence[],
  news: NewsItem[]
): string | null {
  if (evidence.length === 0 && news.length === 0) return null;

  const sentences: string[] = [];

  // Sentence 1: Company type + top positive evidence headlines
  const topPositive = evidence
    .filter((e) => e.signal_direction === "positive")
    .sort((a, b) => b.reliability_score - a.reliability_score)
    .slice(0, 2);

  const companyLabel = COMPANY_TYPE_LABELS[account.company_type];

  if (topPositive.length > 0) {
    const headlines = topPositive.map((e) => e.headline.toLowerCase()).join(" and ");
    sentences.push(`${companyLabel} with signals indicating ${headlines}.`);
  } else {
    sentences.push(
      `${companyLabel} under evaluation for hardware procurement fit.`
    );
  }

  // Sentence 2: Hardware breadth
  const hwCategories = [
    ...new Set(evidence.flatMap((e) => e.hardware_categories)),
  ];
  if (hwCategories.length > 0) {
    const hwLabels = hwCategories.map((c) => HARDWARE_CATEGORY_LABELS[c]);
    sentences.push(`Procurement relevance spans ${hwLabels.join(", ")}.`);
  }

  // Sentence 3: Expansion/build signals from news
  const expansionEventTypes = [
    "expansion",
    "infrastructure_build",
    "on_prem_buildout",
  ];
  const expansionNews = news.filter((n) =>
    expansionEventTypes.includes(n.event_type)
  );
  if (expansionNews.length > 0) {
    const eventLabel = NEWS_EVENT_LABELS[expansionNews[0].event_type].toLowerCase();
    sentences.push(
      `Recent ${eventLabel} activity signals near-term hardware needs.`
    );
  }

  return sentences.join(" ");
}

// ---------------------------------------------------------------------------
// Negative signals — template-based risk summary
// ---------------------------------------------------------------------------

const CONCERNING_EVENT_TYPES = [
  "shortage",
  "supply_disruption",
  "compliance_or_tariff_issue",
];

function generateNegativeSignals(
  evidence: Evidence[],
  news: NewsItem[]
): string | null {
  const parts: string[] = [];

  // Negative evidence
  const negEvidence = evidence.filter(
    (e) => e.signal_direction === "negative"
  );
  if (negEvidence.length > 0) {
    const headlines = negEvidence.map((e) => e.headline).join("; ");
    parts.push(`Negative signals detected: ${headlines}.`);
  }

  // Concerning news
  const negNews = news.filter((n) =>
    CONCERNING_EVENT_TYPES.includes(n.event_type)
  );
  if (negNews.length > 0) {
    const newsDescs = negNews
      .slice(0, 2)
      .map(
        (n) =>
          `${NEWS_EVENT_LABELS[n.event_type]} (${n.title})`
      )
      .join("; ");
    parts.push(`Risk factors from market activity: ${newsDescs}.`);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

// ---------------------------------------------------------------------------
// Component fit derivation
// ---------------------------------------------------------------------------

function deriveComponentFit(evidence: Evidence[]): ComponentFit[] {
  // Group evidence by hardware category, keep highest-reliability per category
  const categoryMap = new Map<HardwareCategory, Evidence>();

  for (const e of evidence) {
    for (const hwCat of e.hardware_categories) {
      const existing = categoryMap.get(hwCat);
      if (!existing || e.reliability_score > existing.reliability_score) {
        categoryMap.set(hwCat, e);
      }
    }
  }

  const result: ComponentFit[] = [];
  for (const [category, bestEvidence] of categoryMap) {
    const signalLabel = SIGNAL_CATEGORY_LABELS[bestEvidence.signal_category];
    const hwLabel = HARDWARE_CATEGORY_LABELS[category];
    const sourceLabel = EVIDENCE_SOURCE_LABELS[bestEvidence.source_type];
    const fit_reason = `${signalLabel} indicates ${hwLabel} procurement relevance based on ${sourceLabel}`;
    result.push({ category, fit_reason });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function qualifyAccount(
  account: Account,
  evidence: Evidence[],
  news: NewsItem[]
): AccountQualification {
  // 1. Evidence strength (reuse existing scoring function)
  const { evidence_strength } = computeAccountEvidenceStrength(evidence);

  // 2. Infra verdict from evidence + company type fallback
  const infra_ownership_verdict = inferInfraVerdict(
    evidence,
    account.company_type
  );

  // 3. Direct buy likelihood from company type + inferred verdict
  const direct_buy_likelihood = computeDirectBuyLikelihood(
    account.company_type,
    infra_ownership_verdict
  );

  // 4. Why it matters
  const why_it_matters = generateWhyItMatters(account, evidence, news);

  // 5. Negative signals
  const negative_signals = generateNegativeSignals(evidence, news);

  // 6. Component fit
  const component_fit = deriveComponentFit(evidence);

  return {
    infra_ownership_verdict,
    direct_buy_likelihood,
    evidence_strength,
    why_it_matters,
    negative_signals,
    component_fit,
  };
}
