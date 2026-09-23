export interface CohortItem {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  organisation: string;
  opportunity_type: string;
  deadline: string | null;
  closes_at: string | null;
  member_count: number;
  is_member: boolean;
  rules_accepted: boolean;
  is_closed: boolean;
}

export interface CohortMemberProfile {
  user_id: string;
  first_name: string;
  university_name: string;
  programme: string;
  joined_at: string;
}

export interface CohortMessageItem {
  id: string;
  cohort_id: string;
  user_id: string;
  first_name: string;
  university_name: string;
  programme: string;
  body: string;
  created_at: string;
  is_own: boolean;
}

export interface MessageReportItem {
  id: string;
  message_id: string;
  message_body: string;
  author_id: string;
  author_name: string;
  reporter_id: string;
  reason: string;
  cohort_id: string;
  opportunity_title: string;
  created_at: string;
  reports_count: number;
}
