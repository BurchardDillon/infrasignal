import type {
  ContactPriority,
  Department,
  EmailConfidence,
  OutreachStatus,
  RoleCategory,
  SeniorityTier,
} from "./enums";

export interface Contact {
  id: string;
  account_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  email_confidence: EmailConfidence;
  email_pattern: string | null;
  phone: string | null;
  title: string | null;
  department: Department;
  seniority_tier: SeniorityTier;
  role_category: RoleCategory;
  likely_manages: string | null;
  why_relevant: string | null;
  likely_works_with: string | null;
  linkedin_url: string | null;
  contact_priority: ContactPriority;
  outreach_status: OutreachStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}
