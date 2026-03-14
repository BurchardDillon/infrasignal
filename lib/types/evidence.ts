import type {
  EvidenceSourceType,
  HardwareCategory,
  SignalCategory,
  SignalDirection,
} from "./enums";

export interface Evidence {
  id: string;
  account_id: string;
  headline: string;
  description: string;
  raw_excerpt: string | null;
  source_url: string | null;
  source_type: EvidenceSourceType;
  signal_direction: SignalDirection;
  signal_category: SignalCategory;
  reliability_score: number;
  hardware_categories: HardwareCategory[];
  detected_at: Date;
  created_at: Date;
  updated_at: Date;
}
