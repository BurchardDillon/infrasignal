import type {
  Department,
  HardwareCategory,
  NewsEventType,
} from "./enums";
import type { ComponentImpact } from "./shared";

/**
 * Raw input provided by an admin when submitting an article for ingestion.
 * Everything else is derived by the interpretation engine.
 */
export interface RawArticleInput {
  title: string;
  body: string;
  source_url: string;
  source_name: string;
  published_at: string; // ISO 8601 date string from the form
  mentioned_companies: string[];
}

/**
 * Output of interpretArticle(): all derived/scored fields
 * that get merged with raw input to produce a news_items insert.
 */
export interface InterpretedNews {
  event_type: NewsEventType;
  urgency_score: number;
  commercial_relevance_score: number;
  confidence_score: number;
  impact_summary: string;
  recommended_outreach_department: Department | null;
  suggested_outreach_angle: string | null;
  component_impact: ComponentImpact[];
  hardware_categories: HardwareCategory[];
}
