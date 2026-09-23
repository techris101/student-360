import type { ApplicationStatus } from "@/lib/supabase/types";

export interface ApplicationOpportunitySummary {
  id: string;
  title: string;
  organisation: string;
  type: string;
  deadline: string | null;
  deadline_rolling: boolean;
  funding: string;
  location_scope: string;
  location_text: string | null;
  official_url: string;
}

export interface ApplicationWithOpportunity {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: ApplicationStatus;
  had_interview: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  opportunity: ApplicationOpportunitySummary;
}

export interface ApplicationCounts {
  saved: number;
  applied: number; // applying + submitted per PRODUCT F5
  interview: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
  total: number;
}

export interface ProgressReviewStatus {
  allowed: boolean;
  daysRemaining: number;
  nextAvailableDate: Date | null;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Computes status counts for the progress page top stat row.
 * Design: five numbers in a single row (tabular, 28/600) with labels under them.
 * Saved, Applied (applying + submitted), Interview, Accepted, Rejected.
 */
export function computeApplicationCounts(
  applications: { status: ApplicationStatus }[]
): ApplicationCounts {
  const counts: ApplicationCounts = {
    saved: 0,
    applied: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    total: applications.length,
  };

  for (const app of applications) {
    if (app.status === "saved") {
      counts.saved++;
    } else if (app.status === "applying" || app.status === "submitted") {
      counts.applied++;
    } else if (app.status === "interview") {
      counts.interview++;
    } else if (app.status === "accepted") {
      counts.accepted++;
    } else if (app.status === "rejected") {
      counts.rejected++;
    } else if (app.status === "withdrawn") {
      counts.withdrawn++;
    }
  }

  return counts;
}

/**
 * Filter upcoming deadlines for saved and active applications.
 * PRODUCT F5: Upcoming deadlines for saved and applying items.
 */
export function filterUpcomingDeadlines(
  applications: ApplicationWithOpportunity[],
  now: Date = new Date()
): ApplicationWithOpportunity[] {
  const nowMs = now.getTime();

  return applications
    .filter((app) => {
      // Only saved, applying, or submitted
      if (
        app.status !== "saved" &&
        app.status !== "applying" &&
        app.status !== "submitted"
      ) {
        return false;
      }

      if (!app.opportunity.deadline) {
        return false;
      }

      const deadlineMs = new Date(app.opportunity.deadline).getTime();
      return !Number.isNaN(deadlineMs) && deadlineMs >= nowMs;
    })
    .sort((a, b) => {
      const timeA = new Date(a.opportunity.deadline!).getTime();
      const timeB = new Date(b.opportunity.deadline!).getTime();
      return timeA - timeB;
    });
}

/**
 * Evaluates whether a student can request a new AI advisor review.
 * Available once every 7 days (PRODUCT F5, BUILD_PLAN P7).
 */
export function canRequestProgressReview(
  lastReviewCreatedAt: string | Date | null | undefined,
  now: Date = new Date()
): ProgressReviewStatus {
  if (!lastReviewCreatedAt) {
    return {
      allowed: true,
      daysRemaining: 0,
      nextAvailableDate: null,
    };
  }

  const lastDate =
    typeof lastReviewCreatedAt === "string"
      ? new Date(lastReviewCreatedAt)
      : lastReviewCreatedAt;

  const lastTime = lastDate.getTime();
  if (Number.isNaN(lastTime)) {
    return {
      allowed: true,
      daysRemaining: 0,
      nextAvailableDate: null,
    };
  }

  const nowTime = now.getTime();
  const elapsed = nowTime - lastTime;

  if (elapsed >= SEVEN_DAYS_MS) {
    return {
      allowed: true,
      daysRemaining: 0,
      nextAvailableDate: null,
    };
  }

  const nextAvailableTime = lastTime + SEVEN_DAYS_MS;
  const remainingMs = nextAvailableTime - nowTime;
  const daysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

  return {
    allowed: false,
    daysRemaining,
    nextAvailableDate: new Date(nextAvailableTime),
  };
}

/**
 * Validates and trims review word count per Prompt 5 rules (max 180 words).
 */
export function validateProgressReviewWordCount(
  content: string,
  maxWords = 180
): { valid: boolean; wordCount: number; text: string } {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount <= maxWords) {
    return {
      valid: true,
      wordCount,
      text: content.trim(),
    };
  }

  const trimmedWords = words.slice(0, maxWords);
  const trimmed = trimmedWords.join(" ") + "...";

  return {
    valid: false,
    wordCount,
    text: trimmed,
  };
}

/**
 * Determines if an opportunity deadline is within 7 days or 1 day for reminder notifications.
 * F6: deadline reminders (7 days and 1 day before, for Saved and Applying).
 */
export function checkDeadlineReminderStage(
  deadlineIso: string,
  now: Date = new Date()
): "7_days" | "1_day" | null {
  const deadline = new Date(deadlineIso).getTime();
  if (Number.isNaN(deadline)) return null;

  const nowMs = now.getTime();
  const diffMs = deadline - nowMs;
  if (diffMs <= 0) return null;

  const diffHours = diffMs / (1000 * 60 * 60);

  // 1 day window: between 20 and 28 hours (centered on 24 hours)
  if (diffHours >= 18 && diffHours <= 30) {
    return "1_day";
  }

  // 7 days window: between 162 and 174 hours (centered on 168 hours = 7 * 24)
  if (diffHours >= 156 && diffHours <= 180) {
    return "7_days";
  }

  return null;
}
