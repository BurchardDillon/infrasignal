import type { HardwareCategory, NewsLinkType } from "./enums";

export interface ComponentFit {
  category: HardwareCategory;
  fit_reason: string;
}

export interface ComponentImpact {
  category: HardwareCategory;
  impact: string;
}

export interface NewsAccountLink {
  account_id: string;
  link_type: NewsLinkType;
}
