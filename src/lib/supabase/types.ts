export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LevelType = "diploma" | "bachelor" | "master" | "phd";
export type UserRole = "user" | "admin";
export type OpportunityType =
  | "scholarship"
  | "fellowship"
  | "internship"
  | "course"
  | "competition"
  | "conference"
  | "grant"
  | "exchange"
  | "research";
export type LocationScope = "rwanda" | "africa" | "abroad" | "online" | "mixed";
export type FundingType = "full" | "partial" | "none" | "unknown";
export type OpportunityStatus =
  | "pending_review"
  | "published"
  | "rejected"
  | "expired";
export type NewsCategory = "universities" | "policy" | "funding" | "careers";
export type NewsStatus = "pending_review" | "published" | "rejected";
export type ApplicationStatus =
  | "saved"
  | "applying"
  | "submitted"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type Database = {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          city: string;
          official_url: string;
          is_verified: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          short_name: string;
          city: string;
          official_url: string;
          is_verified?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string;
          city?: string;
          official_url?: string;
          is_verified?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          university_id: string | null;
          university_other: string | null;
          college: string | null;
          programme: string | null;
          level: LevelType;
          year_of_study: number | null;
          expected_graduation: string | null;
          gpa: number | null;
          gpa_scale: number | null;
          nationality: string;
          gender: string | null;
          date_of_birth: string | null;
          languages: Json | null;
          skills: string[] | null;
          fields: string[] | null;
          interests: string[] | null;
          goals: string[] | null;
          destinations: string[] | null;
          experience: Json | null;
          leadership: Json | null;
          cv_path: string | null;
          cv_parsed: Json | null;
          email_opt_in: boolean;
          onboarding_complete: boolean;
          role: UserRole;
          suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          university_id?: string | null;
          university_other?: string | null;
          college?: string | null;
          programme?: string | null;
          level?: LevelType;
          year_of_study?: number | null;
          expected_graduation?: string | null;
          gpa?: number | null;
          gpa_scale?: number | null;
          nationality?: string;
          gender?: string | null;
          date_of_birth?: string | null;
          languages?: Json | null;
          skills?: string[] | null;
          fields?: string[] | null;
          interests?: string[] | null;
          goals?: string[] | null;
          destinations?: string[] | null;
          experience?: Json | null;
          leadership?: Json | null;
          cv_path?: string | null;
          cv_parsed?: Json | null;
          email_opt_in?: boolean;
          onboarding_complete?: boolean;
          role?: UserRole;
          suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          university_id?: string | null;
          university_other?: string | null;
          college?: string | null;
          programme?: string | null;
          level?: LevelType;
          year_of_study?: number | null;
          expected_graduation?: string | null;
          gpa?: number | null;
          gpa_scale?: number | null;
          nationality?: string;
          gender?: string | null;
          date_of_birth?: string | null;
          languages?: Json | null;
          skills?: string[] | null;
          fields?: string[] | null;
          interests?: string[] | null;
          goals?: string[] | null;
          destinations?: string[] | null;
          experience?: Json | null;
          leadership?: Json | null;
          cv_path?: string | null;
          cv_parsed?: Json | null;
          email_opt_in?: boolean;
          onboarding_complete?: boolean;
          role?: UserRole;
          suspended?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          id: string;
          name: string;
          url: string;
          kind: "rss" | "html" | "manual";
          category: "opportunity" | "news";
          is_official: boolean;
          is_aggregator: boolean;
          active: boolean;
          crawl_hint: Json | null;
          last_run_at: string | null;
          last_success_at: string | null;
          fail_count: number;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          kind: "rss" | "html" | "manual";
          category: "opportunity" | "news";
          is_official?: boolean;
          is_aggregator?: boolean;
          active?: boolean;
          crawl_hint?: Json | null;
          last_run_at?: string | null;
          last_success_at?: string | null;
          fail_count?: number;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          kind?: "rss" | "html" | "manual";
          category?: "opportunity" | "news";
          is_official?: boolean;
          is_aggregator?: boolean;
          active?: boolean;
          crawl_hint?: Json | null;
          last_run_at?: string | null;
          last_success_at?: string | null;
          fail_count?: number;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          id: string;
          type: OpportunityType;
          title: string;
          organisation: string;
          summary: string;
          key_facts: Json | null;
          official_url: string;
          source_id: string | null;
          deadline: string | null;
          deadline_rolling: boolean;
          opens_at: string | null;
          starts_at: string | null;
          location_scope: LocationScope;
          location_text: string | null;
          funding: FundingType;
          levels: string[] | null;
          fields: string[] | null;
          eligibility: Json | null;
          plan_ahead: boolean;
          prepare_now: Json | null;
          status: OpportunityStatus;
          confidence: number;
          content_hash: string | null;
          first_seen_at: string;
          last_checked_at: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: OpportunityType;
          title: string;
          organisation: string;
          summary: string;
          key_facts?: Json | null;
          official_url: string;
          source_id?: string | null;
          deadline?: string | null;
          deadline_rolling?: boolean;
          opens_at?: string | null;
          starts_at?: string | null;
          location_scope?: LocationScope;
          location_text?: string | null;
          funding?: FundingType;
          levels?: string[] | null;
          fields?: string[] | null;
          eligibility?: Json | null;
          plan_ahead?: boolean;
          prepare_now?: Json | null;
          status?: OpportunityStatus;
          confidence?: number;
          content_hash?: string | null;
          first_seen_at?: string;
          last_checked_at?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: OpportunityType;
          title?: string;
          organisation?: string;
          summary?: string;
          key_facts?: Json | null;
          official_url?: string;
          source_id?: string | null;
          deadline?: string | null;
          deadline_rolling?: boolean;
          opens_at?: string | null;
          starts_at?: string | null;
          location_scope?: LocationScope;
          location_text?: string | null;
          funding?: FundingType;
          levels?: string[] | null;
          fields?: string[] | null;
          eligibility?: Json | null;
          plan_ahead?: boolean;
          prepare_now?: Json | null;
          status?: OpportunityStatus;
          confidence?: number;
          content_hash?: string | null;
          last_checked_at?: string;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      news_items: {
        Row: {
          id: string;
          title: string;
          summary: string;
          url: string;
          source_id: string | null;
          published_at: string | null;
          category: NewsCategory;
          relevance: number;
          status: NewsStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          url: string;
          source_id?: string | null;
          published_at?: string | null;
          category: NewsCategory;
          relevance?: number;
          status?: NewsStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          summary?: string;
          url?: string;
          source_id?: string | null;
          published_at?: string | null;
          category?: NewsCategory;
          relevance?: number;
          status?: NewsStatus;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          opportunity_id: string;
          status: ApplicationStatus;
          had_interview: boolean | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          opportunity_id: string;
          status?: ApplicationStatus;
          had_interview?: boolean | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          opportunity_id?: string;
          status?: ApplicationStatus;
          had_interview?: boolean | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      application_events: {
        Row: {
          id: string;
          application_id: string;
          from_status: ApplicationStatus | null;
          to_status: ApplicationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          from_status?: ApplicationStatus | null;
          to_status: ApplicationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          from_status?: ApplicationStatus | null;
          to_status?: ApplicationStatus;
        };
        Relationships: [];
      };
      cohorts: {
        Row: {
          id: string;
          opportunity_id: string;
          closes_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          closes_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          opportunity_id?: string;
          closes_at?: string | null;
        };
        Relationships: [];
      };
      cohort_members: {
        Row: {
          cohort_id: string;
          user_id: string;
          joined_at: string;
          rules_accepted_at: string | null;
          left_at: string | null;
        };
        Insert: {
          cohort_id: string;
          user_id: string;
          joined_at?: string;
          rules_accepted_at?: string | null;
          left_at?: string | null;
        };
        Update: {
          cohort_id?: string;
          user_id?: string;
          joined_at?: string;
          rules_accepted_at?: string | null;
          left_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          cohort_id: string;
          user_id: string;
          body: string;
          hidden: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cohort_id: string;
          user_id: string;
          body: string;
          hidden?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          cohort_id?: string;
          user_id?: string;
          body?: string;
          hidden?: boolean;
        };
        Relationships: [];
      };
      message_reports: {
        Row: {
          id: string;
          message_id: string;
          reporter_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          reporter_id: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          reporter_id?: string;
          reason?: string;
        };
        Relationships: [];
      };
      user_blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
        };
        Relationships: [];
      };
      ai_threads: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          thread_id: string;
          role: "user" | "assistant";
          content: string;
          tokens_in: number | null;
          tokens_out: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          role: "user" | "assistant";
          content: string;
          tokens_in?: number | null;
          tokens_out?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          role?: "user" | "assistant";
          content?: string;
          tokens_in?: number | null;
          tokens_out?: number | null;
        };
        Relationships: [];
      };
      ai_usage: {
        Row: {
          user_id: string;
          day: string;
          messages: number;
          tokens: number;
        };
        Insert: {
          user_id: string;
          day: string;
          messages?: number;
          tokens?: number;
        };
        Update: {
          user_id?: string;
          day?: string;
          messages?: number;
          tokens?: number;
        };
        Relationships: [];
      };
      progress_reviews: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          stats: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          stats?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          stats?: Json | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          title: string;
          body: string;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          title: string;
          body: string;
          link?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          title?: string;
          body?: string;
          link?: string | null;
          read_at?: string | null;
        };
        Relationships: [];
      };
      pipeline_runs: {
        Row: {
          id: string;
          kind: string;
          started_at: string;
          finished_at: string | null;
          stats: Json | null;
          errors: Json | null;
        };
        Insert: {
          id?: string;
          kind: string;
          started_at?: string;
          finished_at?: string | null;
          stats?: Json | null;
          errors?: Json | null;
        };
        Update: {
          id?: string;
          kind?: string;
          started_at?: string;
          finished_at?: string | null;
          stats?: Json | null;
          errors?: Json | null;
        };
        Relationships: [];
      };
      seen_urls: {
        Row: {
          url_hash: string;
          url: string;
          first_seen_at: string;
          outcome: string | null;
        };
        Insert: {
          url_hash: string;
          url: string;
          first_seen_at?: string;
          outcome?: string | null;
        };
        Update: {
          url_hash?: string;
          url?: string;
          first_seen_at?: string;
          outcome?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      cohort_member_profiles: {
        Row: {
          cohort_id: string;
          user_id: string;
          first_name: string;
          university_name: string;
          programme: string;
          joined_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      increment_ai_usage: {
        Args: {
          p_user_id: string;
          p_day: string;
          p_messages: number;
          p_tokens: number;
        };
        Returns: {
          messages: number;
          tokens: number;
        };
      };
    };
    Enums: {
      level_type: LevelType;
      user_role: UserRole;
      opportunity_type: OpportunityType;
      location_scope: LocationScope;
      funding_type: FundingType;
      opportunity_status: OpportunityStatus;
      news_category: NewsCategory;
      news_status: NewsStatus;
      application_status: ApplicationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
