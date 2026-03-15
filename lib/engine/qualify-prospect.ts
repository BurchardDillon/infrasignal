import type {
  Prospect,
  NewsItem,
  InfraVerdict,
  Likelihood,
  CompanyType,
  HardwareCategory,
} from "@/lib/types";
import {
  computeDirectBuyLikelihood,
  computeProspectPriorityScore,
} from "@/lib/utils/scoring";
import { computeNewsBoost } from "./news-boost";
import { COMPANY_TYPE_INFRA_DEFAULT } from "./infra-defaults";

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface ProspectQualification {
  proposed_direct_buy_likelihood: Likelihood;
  proposed_infra_ownership_verdict: InfraVerdict;
  priority_score: number;
}

// ---------------------------------------------------------------------------
// News filtering — match by company name
// ---------------------------------------------------------------------------

function filterRelevantNews(
  companyName: string,
  allNewsItems: NewsItem[]
): NewsItem[] {
  const normalizedName = companyName.toLowerCase();
  return allNewsItems.filter((n) => {
    const text = `${n.title} ${n.impact_summary}`.toLowerCase();
    return text.includes(normalizedName);
  });
}

// ---------------------------------------------------------------------------
// Infra verdict inference from news signals
// ---------------------------------------------------------------------------

const OWNED_EVENT_TYPES = ["infrastructure_build", "on_prem_buildout"];
const CLOUD_EVENT_TYPES = ["cloud_migration"];

function inferProspectInfraVerdict(
  prospect: Prospect,
  relevantNews: NewsItem[]
): InfraVerdict {
  const hasOwnedSignals = relevantNews.some((n) =>
    OWNED_EVENT_TYPES.includes(n.event_type)
  );
  const hasCloudSignals = relevantNews.some((n) =>
    CLOUD_EVENT_TYPES.includes(n.event_type)
  );

  if (hasOwnedSignals && hasCloudSignals) return "hybrid";
  if (hasOwnedSignals) return "owned";
  if (hasCloudSignals) return "outsourced";

  // Fallback to company type default
  if (prospect.proposed_company_type) {
    return COMPANY_TYPE_INFRA_DEFAULT[prospect.proposed_company_type];
  }

  return "unknown";
}

// ---------------------------------------------------------------------------
// Buy likelihood inference with news upgrade
// ---------------------------------------------------------------------------

const UPGRADE_EVENT_TYPES = [
  "infrastructure_build",
  "expansion",
  "government_contract",
];

const LIKELIHOOD_UPGRADE: Record<Likelihood, Likelihood> = {
  unknown: "low",
  low: "medium",
  medium: "medium", // Cap at medium — no evidence to justify high
  high: "high",
};

function inferProspectBuyLikelihood(
  companyType: CompanyType | null,
  infraVerdict: InfraVerdict,
  relevantNews: NewsItem[]
): Likelihood {
  const effectiveType = companyType ?? "other";
  const baseLikelihood = computeDirectBuyLikelihood(effectiveType, infraVerdict);

  // Upgrade one step if high-urgency expansion/build/gov news exists
  const hasHighUrgencySignals = relevantNews.some(
    (n) =>
      UPGRADE_EVENT_TYPES.includes(n.event_type) && n.urgency_score >= 70
  );

  if (hasHighUrgencySignals) {
    return LIKELIHOOD_UPGRADE[baseLikelihood];
  }

  return baseLikelihood;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function qualifyProspect(
  prospect: Prospect,
  allNewsItems: NewsItem[]
): ProspectQualification {
  // 1. Filter news relevant to this prospect
  const relevantNews = filterRelevantNews(prospect.company_name, allNewsItems);

  // 2. Infer infra verdict from news
  const proposed_infra_ownership_verdict = inferProspectInfraVerdict(
    prospect,
    relevantNews
  );

  // 3. Infer buy likelihood with news upgrade
  const proposed_direct_buy_likelihood = inferProspectBuyLikelihood(
    prospect.proposed_company_type,
    proposed_infra_ownership_verdict,
    relevantNews
  );

  // 4. Compute priority score using the newly derived fields
  const base = computeProspectPriorityScore({
    proposed_direct_buy_likelihood,
    proposed_company_type: prospect.proposed_company_type,
    proposed_infra_ownership_verdict,
    hardware_categories: prospect.hardware_categories,
  });

  const newsBoost = computeNewsBoost(
    prospect.company_name,
    prospect.hardware_categories,
    allNewsItems
  );

  const priority_score = Math.min(100, base.priority_score + newsBoost);

  return {
    proposed_direct_buy_likelihood,
    proposed_infra_ownership_verdict,
    priority_score,
  };
}
