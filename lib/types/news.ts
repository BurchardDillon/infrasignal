import type {
  Department,
  HardwareCategory,
  NewsEventType,
} from "./enums";
import type { ComponentImpact, NewsAccountLink } from "./shared";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  published_at: Date;
  event_type: NewsEventType;
  urgency_score: number;
  commercial_relevance_score: number;
  confidence_score: number;
  impact_summary: string;
  recommended_outreach_department: Department | null;
  suggested_outreach_angle: string | null;
  component_impact: ComponentImpact[];
  hardware_categories: HardwareCategory[];
  account_id: string | null;
  linked_accounts: NewsAccountLink[];
  created_at: Date;
  updated_at: Date;
}
