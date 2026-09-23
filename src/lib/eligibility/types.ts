import type { LevelType } from "@/lib/supabase/types";

export type CheckStatus = "met" | "not_met" | "unknown";

export type CheckRuleType =
  | "nationality"
  | "level"
  | "year_of_study"
  | "field"
  | "gpa"
  | "age"
  | "gender"
  | "language"
  | "work_experience"
  | "other";

export interface Check {
  rule: CheckRuleType;
  status: CheckStatus;
  label: string;
  hint?: string;
  isHardRule: boolean;
}

export interface EvaluationResult {
  checks: Check[];
  met: number;
  notMet: number;
  unknown: number;
  total: number;
  hardFail: boolean;
  overallStatus: "eligible" | "not_eligible" | "check_requirements";
}

export interface StudentProfileData {
  id?: string;
  full_name?: string;
  nationality?: string | null;
  level?: LevelType | null;
  year_of_study?: number | null;
  gpa?: number | null;
  gpa_scale?: number | null;
  date_of_birth?: string | null;
  gender?: string | null;
  fields?: string[] | null;
  interests?: string[] | null;
  languages?: Array<{
    language: string;
    level?: string;
    test?: string;
    score?: string | number;
    date?: string;
  }> | null;
  experience?: Array<{
    role: string;
    organisation: string;
    start: string;
    end?: string;
    summary?: string;
  }> | null;
}

export interface OpportunityEligibilityRule {
  rwandans_eligible?: boolean | null;
  nationalities?: string[] | null;
  regions?: string[] | null;
  levels?: string[] | null;
  years_of_study?: number[] | null;
  fields?: string[] | null;
  min_gpa?: {
    value: number;
    scale: number;
  } | null;
  max_age?: number | null;
  age_on?: string | null;
  gender?: "female" | "male" | null;
  language_tests?: Array<{
    test: string;
    min_score: number | string;
  }> | null;
  work_experience_years?: number | null;
  other?: string[];
}
