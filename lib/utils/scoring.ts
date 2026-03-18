import type {
  Account,
  Evidence,
  EvidenceStrength,
  Likelihood,
  NewsItem,
  Prospect,
  CompanyType,
  InfraVerdict,
  SignalDirection,
  SignalCategory,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Account Evidence Strength
// ---------------------------------------------------------------------------
// Derives `evidence_strength` from the evidence items linked to an account.
// Deterministic: same inputs always produce the same output.
//
// Scoring factors:
//   - Number of positive evidence items
//   - Average reliability score of positive evidence
//   - Diversity of signal categories (more categories = more angles = stronger)
//   - Presence of negative signals penalizes

const DIRECTION_WEIGHT: Record<SignalDirection, number> = {
  positive: 1,
  neutral: 0.3,
  negative: -0.5,
};

const SIGNAL_CATEGORY_WEIGHT: Record<SignalCategory, number> = {
  purchase_intent: 1.0,
  budget_signal: 0.9,
  expansion_signal: 0.85,
  infrastructure_footprint: 0.8,
  vendor_switch: 0.75,
  hiring_signal: 0.7,
  tech_adoption: 0.65,
  partnership_signal: 0.6,
  supply_signal: 0.55,
  outsourcing_signal: 0.4,
  other: 0.3,
};

export interface AccountScoreBreakdown {
  evidence_strength: EvidenceStrength;
  raw_score: number;
  positive_count: number;
  negative_count: number;
  category_diversity: number;
  avg_reliability: number;
}

export function computeAccountEvidenceStrength(
  evidence: Evidence[]
): AccountScoreBreakdown {
  if (evidence.length === 0) {
    return {
      evidence_strength: "none",
      raw_score: 0,
      positive_count: 0,
      negative_count: 0,
      category_diversity: 0,
      avg_reliability: 0,
    };
  }

  const positive = evidence.filter((e) => e.signal_direction === "positive");
  const negative = evidence.filter((e) => e.signal_direction === "negative");
  const categories = new Set(evidence.map((e) => e.signal_category));

  // Weighted sum of evidence contributions
  let weightedSum = 0;
  for (const e of evidence) {
    const dirWeight = DIRECTION_WEIGHT[e.signal_direction];
    const catWeight = SIGNAL_CATEGORY_WEIGHT[e.signal_category];
    const reliabilityFactor = e.reliability_score / 100;
    weightedSum += dirWeight * catWeight * reliabilityFactor;
  }

  // Diversity bonus: up to 20% boost for covering multiple signal categories
  const diversityBonus = Math.min(categories.size / 5, 1) * 0.2;

  // Normalize: each evidence item can contribute up to 1.0 max
  const normalizedScore = weightedSum / evidence.length;
  const raw_score = Math.max(
    0,
    Math.min(100, Math.round((normalizedScore + diversityBonus) * 100))
  );

  const avgReliability =
    evidence.reduce((sum, e) => sum + e.reliability_score, 0) /
    evidence.length;

  let evidence_strength: EvidenceStrength;
  if (raw_score >= 70) evidence_strength = "strong";
  else if (raw_score >= 40) evidence_strength = "moderate";
  else if (raw_score > 0) evidence_strength = "weak";
  else evidence_strength = "none";

  return {
    evidence_strength,
    raw_score,
    positive_count: positive.length,
    negative_count: negative.length,
    category_diversity: categories.size,
    avg_reliability: Math.round(avgReliability),
  };
}

// ---------------------------------------------------------------------------
// News Commercial Score
// ---------------------------------------------------------------------------
// Computes a single composite score for a news item, weighing urgency,
// commercial relevance, and confidence. Used for ranking/sorting the
// intelligence feed.
//
// Formula: weighted average with confidence as a multiplier (gate).

export interface NewsCompositeScore {
  composite_score: number;
  tier: "critical" | "high" | "medium" | "low";
}

export function computeNewsCompositeScore(news: NewsItem): NewsCompositeScore {
  // Urgency and commercial relevance are the core signals.
  // Confidence acts as a gate: low confidence discounts everything.
  const base =
    news.urgency_score * 0.35 + news.commercial_relevance_score * 0.45;
  const confidenceGate = news.confidence_score / 100;
  const composite_score = Math.round(base * confidenceGate + base * 0.2);

  let tier: NewsCompositeScore["tier"];
  if (composite_score >= 80) tier = "critical";
  else if (composite_score >= 60) tier = "high";
  else if (composite_score >= 35) tier = "medium";
  else tier = "low";

  return { composite_score, tier };
}

// ---------------------------------------------------------------------------
// Prospect Priority Score
// ---------------------------------------------------------------------------
// Computes `priority_score` for a prospect based on static attributes.
// In a real system this would also incorporate evidence/news signals, but
// for the initial shell we score based on:
//   - proposed_direct_buy_likelihood
//   - proposed_company_type (some types are higher-value targets)
//   - proposed_infra_ownership_verdict
//   - hardware category breadth
//   - employee size (larger = more potential volume)

const LIKELIHOOD_SCORE: Record<Likelihood, number> = {
  high: 30,
  medium: 18,
  low: 8,
  unknown: 5,
};

const COMPANY_TYPE_SCORE: Record<CompanyType, number> = {
  hyperscaler: 25,
  ai_infrastructure_provider: 24,
  datacenter_operator: 22,
  oem: 20,
  private_cloud_provider: 18,
  colo_provider: 16,
  system_integrator: 15,
  storage_vendor: 14,
  rugged_computing_vendor: 12,
  enterprise_end_user: 10,
  bank_financial: 10,
  gov_edu: 8,
  reseller: 6,
  repair_refurb: 12,
  msp: 10,
  itad: 8,
  colo_bare_metal: 16,
  other: 4,
};

const INFRA_VERDICT_SCORE: Record<InfraVerdict, number> = {
  owned: 20,
  hybrid: 15,
  leased: 10,
  outsourced: 5,
  unknown: 3,
};

export interface ProspectScoreBreakdown {
  priority_score: number;
  likelihood_component: number;
  company_type_component: number;
  infra_component: number;
  breadth_component: number;
}

export function computeProspectPriorityScore(
  prospect: Pick<
    Prospect,
    | "proposed_direct_buy_likelihood"
    | "proposed_company_type"
    | "proposed_infra_ownership_verdict"
    | "hardware_categories"
  >
): ProspectScoreBreakdown {
  const likelihood_component =
    LIKELIHOOD_SCORE[prospect.proposed_direct_buy_likelihood];

  const company_type_component = prospect.proposed_company_type
    ? COMPANY_TYPE_SCORE[prospect.proposed_company_type]
    : COMPANY_TYPE_SCORE.other;

  const infra_component =
    INFRA_VERDICT_SCORE[prospect.proposed_infra_ownership_verdict];

  // Hardware breadth: more categories = broader opportunity (up to 25 points)
  const breadth_component = Math.min(
    Math.round((prospect.hardware_categories.length / 7) * 25),
    25
  );

  const raw =
    likelihood_component +
    company_type_component +
    infra_component +
    breadth_component;

  // Clamp to 0-100
  const priority_score = Math.max(0, Math.min(100, raw));

  return {
    priority_score,
    likelihood_component,
    company_type_component,
    infra_component,
    breadth_component,
  };
}

// ---------------------------------------------------------------------------
// Direct Buy Likelihood (for Account)
// ---------------------------------------------------------------------------
// Derives `direct_buy_likelihood` from company_type and infra_ownership_verdict.
// Companies that own infrastructure and are in hardware-heavy verticals
// are more likely to buy directly.

export function computeDirectBuyLikelihood(
  company_type: CompanyType,
  infra_verdict: InfraVerdict
): Likelihood {
  const typeScore = COMPANY_TYPE_SCORE[company_type];
  const infraScore = INFRA_VERDICT_SCORE[infra_verdict];
  const combined = typeScore + infraScore;

  if (combined >= 40) return "high";
  if (combined >= 25) return "medium";
  if (combined >= 12) return "low";
  return "unknown";
}
