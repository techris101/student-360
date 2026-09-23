"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ApplicationStatus, Database } from "@/lib/supabase/types";
import {
  computeApplicationCounts,
  filterUpcomingDeadlines,
  canRequestProgressReview,
  type ApplicationCounts,
  type ApplicationWithOpportunity,
  type ProgressReviewStatus,
} from "@/lib/progress/progress";
import { generateProgressReview } from "@/lib/ai/progress-review";
import { SEED_OPPORTUNITIES } from "@/lib/data/opportunities";

export interface ProgressReviewItem {
  id: string;
  user_id: string;
  content: string;
  stats: ApplicationCounts | null;
  created_at: string;
}

export interface ProgressDataResponse {
  applications: ApplicationWithOpportunity[];
  counts: ApplicationCounts;
  upcomingDeadlines: ApplicationWithOpportunity[];
  latestReview: ProgressReviewItem | null;
  reviewStatus: ProgressReviewStatus;
  profileGaps: string[];
}

// In-memory fallback for local dev when remote DB credentials are not configured
const memoryApplications: Map<string, ApplicationWithOpportunity[]> = new Map();
const memoryReviews: Map<string, ProgressReviewItem[]> = new Map();

function getInitialMockApplications(userId: string): ApplicationWithOpportunity[] {
  const opp1 = SEED_OPPORTUNITIES[0];
  const opp2 = SEED_OPPORTUNITIES[1];
  const opp3 = SEED_OPPORTUNITIES[2];

  return [
    {
      id: "app-mock-1",
      user_id: userId,
      opportunity_id: opp1.id,
      status: "applying",
      had_interview: null,
      notes: "Drafting motivation statement and gathering official transcript.",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      opportunity: {
        id: opp1.id,
        title: opp1.title,
        organisation: opp1.organisation,
        type: opp1.type,
        deadline: opp1.deadline,
        deadline_rolling: opp1.deadline_rolling,
        funding: opp1.funding,
        location_scope: opp1.location_scope,
        location_text: opp1.location_text,
        official_url: opp1.official_url,
      },
    },
    {
      id: "app-mock-2",
      user_id: userId,
      opportunity_id: opp2.id,
      status: "saved",
      had_interview: null,
      notes: null,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      opportunity: {
        id: opp2.id,
        title: opp2.title,
        organisation: opp2.organisation,
        type: opp2.type,
        deadline: opp2.deadline,
        deadline_rolling: opp2.deadline_rolling,
        funding: opp2.funding,
        location_scope: opp2.location_scope,
        location_text: opp2.location_text,
        official_url: opp2.official_url,
      },
    },
    {
      id: "app-mock-3",
      user_id: userId,
      opportunity_id: opp3.id,
      status: "submitted",
      had_interview: null,
      notes: "Submitted via official portal on 12 Sep.",
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      opportunity: {
        id: opp3.id,
        title: opp3.title,
        organisation: opp3.organisation,
        type: opp3.type,
        deadline: opp3.deadline,
        deadline_rolling: opp3.deadline_rolling,
        funding: opp3.funding,
        location_scope: opp3.location_scope,
        location_text: opp3.location_text,
        official_url: opp3.official_url,
      },
    },
  ];
}

export async function getProgressData(): Promise<ProgressDataResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "student-guest-001";
  const serviceClient = createServiceClient();

  let applications: ApplicationWithOpportunity[] = [];
  let latestReview: ProgressReviewItem | null = null;
  const profileGaps: string[] = [];

  try {
    // 1. Fetch user profile to identify gaps
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      if (!profile.gpa) profileGaps.push("GPA and grading scale");
      if (!profile.fields || profile.fields.length === 0)
        profileGaps.push("Field of study");
      if (!profile.languages || (profile.languages as unknown[]).length === 0)
        profileGaps.push("Language proficiency / test scores");
      if (!profile.cv_path && !profile.cv_parsed)
        profileGaps.push("Uploaded CV");
    } else {
      profileGaps.push("Academic transcript / GPA");
    }

    // 2. Fetch applications with opportunity details
    const { data: appRows, error: appError } = await serviceClient
      .from("applications")
      .select(
        `
        id,
        user_id,
        opportunity_id,
        status,
        had_interview,
        notes,
        created_at,
        updated_at,
        opportunities!inner (
          id,
          title,
          organisation,
          type,
          deadline,
          deadline_rolling,
          funding,
          location_scope,
          location_text,
          official_url
        )
      `
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (appError || !appRows || appRows.length === 0) {
      // Use fallback in-memory cache
      if (!memoryApplications.has(userId)) {
        memoryApplications.set(userId, getInitialMockApplications(userId));
      }
      applications = memoryApplications.get(userId)!;
    } else {
      applications = (appRows as unknown[]).map((row) => {
        const r = row as {
          id: string;
          user_id: string;
          opportunity_id: string;
          status: ApplicationStatus;
          had_interview: boolean | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          opportunities: {
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
          };
        };
        return {
          id: r.id,
          user_id: r.user_id,
          opportunity_id: r.opportunity_id,
          status: r.status,
          had_interview: r.had_interview,
          notes: r.notes,
          created_at: r.created_at,
          updated_at: r.updated_at,
          opportunity: r.opportunities,
        };
      });
    }

    // 3. Fetch latest progress review
    const { data: reviewRows } = await serviceClient
      .from("progress_reviews")
      .select("id, user_id, content, stats, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (reviewRows && reviewRows.length > 0) {
      const r = reviewRows[0];
      latestReview = {
        id: r.id,
        user_id: r.user_id,
        content: r.content,
        stats: r.stats as unknown as ApplicationCounts | null,
        created_at: r.created_at,
      };
    } else {
      const memReviews = memoryReviews.get(userId);
      if (memReviews && memReviews.length > 0) {
        latestReview = memReviews[0];
      }
    }
  } catch {
    if (!memoryApplications.has(userId)) {
      memoryApplications.set(userId, getInitialMockApplications(userId));
    }
    applications = memoryApplications.get(userId)!;
    const memReviews = memoryReviews.get(userId);
    if (memReviews && memReviews.length > 0) {
      latestReview = memReviews[0];
    }
  }

  const counts = computeApplicationCounts(applications);
  const upcomingDeadlines = filterUpcomingDeadlines(applications);
  const reviewStatus = canRequestProgressReview(latestReview?.created_at);

  return {
    applications,
    counts,
    upcomingDeadlines,
    latestReview,
    reviewStatus,
    profileGaps,
  };
}

export async function updateApplicationProgressStatus(
  applicationId: string,
  toStatus: ApplicationStatus,
  hadInterview?: boolean | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "student-guest-001";
  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  try {
    // 1. Check existing application
    const { data: existingApp } = await serviceClient
      .from("applications")
      .select("id, status, opportunity_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (existingApp) {
      const fromStatus = existingApp.status;

      // Update application
      const updateData: Database["public"]["Tables"]["applications"]["Update"] = {
        status: toStatus,
        updated_at: now,
      };
      if (hadInterview !== undefined) {
        updateData.had_interview = hadInterview;
      }

      await serviceClient
        .from("applications")
        .update(updateData)
        .eq("id", applicationId);

      // Write application event
      await serviceClient.from("application_events").insert({
        application_id: applicationId,
        from_status: fromStatus,
        to_status: toStatus,
        created_at: now,
      });

      // Auto-join cohort if applying or submitted
      if (
        (toStatus === "applying" || toStatus === "submitted") &&
        existingApp.opportunity_id
      ) {
        const { data: cohort } = await serviceClient
          .from("cohorts")
          .select("id")
          .eq("opportunity_id", existingApp.opportunity_id)
          .maybeSingle();

        if (cohort) {
          await serviceClient.from("cohort_members").upsert(
            {
              cohort_id: cohort.id,
              user_id: userId,
              joined_at: now,
              left_at: null,
            },
            { onConflict: "cohort_id,user_id" }
          );
        }
      }
    } else {
      // Memory fallback update
      const apps = memoryApplications.get(userId) || [];
      const target = apps.find((a) => a.id === applicationId);
      if (target) {
        target.status = toStatus;
        if (hadInterview !== undefined) target.had_interview = hadInterview;
        target.updated_at = now;
      }
    }
  } catch {
    // Memory fallback update
    const apps = memoryApplications.get(userId) || [];
    const target = apps.find((a) => a.id === applicationId);
    if (target) {
      target.status = toStatus;
      if (hadInterview !== undefined) target.had_interview = hadInterview;
      target.updated_at = now;
    }
  }

  revalidatePath("/progress");
  revalidatePath("/opportunities");
  revalidatePath("/cohorts");

  return { success: true };
}

export async function requestAdvisorReviewAction(): Promise<{
  success: boolean;
  review?: ProgressReviewItem;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "student-guest-001";
  const progressData = await getProgressData();

  if (!progressData.reviewStatus.allowed) {
    return {
      success: false,
      error: `A review is available once every 7 days. Next available in ${progressData.reviewStatus.daysRemaining} days.`,
    };
  }

  // Compile data for prompt 5
  const reviewInput = {
    stats: progressData.counts,
    applications: progressData.applications.map((a) => ({
      title: a.opportunity.title,
      organisation: a.opportunity.organisation,
      status: a.status,
      deadline: a.opportunity.deadline,
    })),
    profileGaps: progressData.profileGaps,
    upcomingDeadlines: progressData.upcomingDeadlines.map((a) => ({
      title: a.opportunity.title,
      deadline: a.opportunity.deadline || "Rolling",
    })),
  };

  const reviewContent = await generateProgressReview(reviewInput);
  const now = new Date().toISOString();
  const serviceClient = createServiceClient();

  let newReview: ProgressReviewItem;

  try {
    const { data: inserted, error: insertError } = await serviceClient
      .from("progress_reviews")
      .insert({
        user_id: userId,
        content: reviewContent,
        stats: progressData.counts as unknown as Database["public"]["Tables"]["progress_reviews"]["Insert"]["stats"],
        created_at: now,
      })
      .select("id, user_id, content, stats, created_at")
      .single();

    if (insertError || !inserted) {
      newReview = {
        id: `rev-${Date.now()}`,
        user_id: userId,
        content: reviewContent,
        stats: progressData.counts,
        created_at: now,
      };
    } else {
      newReview = {
        id: inserted.id,
        user_id: inserted.user_id,
        content: inserted.content,
        stats: inserted.stats as unknown as ApplicationCounts | null,
        created_at: inserted.created_at,
      };
    }
  } catch {
    newReview = {
      id: `rev-${Date.now()}`,
      user_id: userId,
      content: reviewContent,
      stats: progressData.counts,
      created_at: now,
    };
  }

  // Also push to memory reviews
  const list = memoryReviews.get(userId) || [];
  list.unshift(newReview);
  memoryReviews.set(userId, list);

  revalidatePath("/progress");

  return {
    success: true,
    review: newReview,
  };
}
