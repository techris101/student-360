"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  validateMessageContent,
  isCohortClosed,
  extractFirstName,
} from "@/lib/cohorts/rules";
import {
  checkCohortRateLimit,
  recordCohortMessageSent,
} from "@/lib/cohorts/rate-limit";
import { MockCohortStore } from "@/lib/cohorts/mock-store";
import type {
  CohortItem,
  CohortMessageItem,
  MessageReportItem,
} from "@/lib/cohorts/types";

export async function listCohorts(): Promise<CohortItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const currentUserId = user?.id || "demo-user";

    // Attempt Supabase fetch
    const { data: dbCohorts, error } = await supabase
      .from("cohorts")
      .select(`
        id,
        opportunity_id,
        closes_at,
        created_at,
        opportunities!inner (
          id,
          title,
          organisation,
          type,
          deadline
        )
      `)
      .order("created_at", { ascending: false });

    if (error || !dbCohorts || dbCohorts.length === 0) {
      return MockCohortStore.listCohorts(currentUserId);
    }

    // Get memberships
    const { data: memberships } = await supabase
      .from("cohort_members")
      .select("cohort_id, rules_accepted_at, left_at")
      .eq("user_id", currentUserId);

    const userMembershipsMap = new Map(
      (memberships || []).map((m) => [m.cohort_id, m])
    );

    // Get member counts
    const { data: allMembers } = await supabase
      .from("cohort_members")
      .select("cohort_id")
      .is("left_at", null);

    const countMap = new Map<string, number>();
    (allMembers || []).forEach((m) => {
      countMap.set(m.cohort_id, (countMap.get(m.cohort_id) || 0) + 1);
    });

    interface DbCohortRow {
      id: string;
      opportunity_id: string;
      closes_at: string | null;
      opportunities: {
        id: string;
        title: string;
        organisation: string;
        type: string;
        deadline: string | null;
      } | null;
    }

    return (dbCohorts as unknown as DbCohortRow[]).map((c) => {
      const opp = c.opportunities;
      const mem = userMembershipsMap.get(c.id);
      const isMember = !!mem && !mem.left_at;
      const rulesAccepted = !!mem?.rules_accepted_at;
      const isClosed = isCohortClosed(c.closes_at);

      return {
        id: c.id,
        opportunity_id: opp?.id || c.opportunity_id,
        opportunity_title: opp?.title || "Opportunity",
        organisation: opp?.organisation || "Organisation",
        opportunity_type: opp?.type || "scholarship",
        deadline: opp?.deadline || null,
        closes_at: c.closes_at,
        member_count: countMap.get(c.id) || 0,
        is_member: isMember,
        rules_accepted: rulesAccepted,
        is_closed: isClosed,
      };
    });
  } catch {
    return MockCohortStore.listCohorts("demo-user");
  }
}

export async function getCohort(cohortId: string): Promise<CohortItem | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const currentUserId = user?.id || "demo-user";

    const { data: c, error } = await supabase
      .from("cohorts")
      .select(`
        id,
        opportunity_id,
        closes_at,
        created_at,
        opportunities!inner (
          id,
          title,
          organisation,
          type,
          deadline
        )
      `)
      .or(`id.eq.${cohortId},opportunity_id.eq.${cohortId}`)
      .maybeSingle();

    if (error || !c) {
      return MockCohortStore.getCohort(cohortId, currentUserId);
    }

    const { data: mem } = await supabase
      .from("cohort_members")
      .select("rules_accepted_at, left_at")
      .eq("cohort_id", c.id)
      .eq("user_id", currentUserId)
      .maybeSingle();

    const { count } = await supabase
      .from("cohort_members")
      .select("*", { count: "exact", head: true })
      .eq("cohort_id", c.id)
      .is("left_at", null);

    const opp = c.opportunities as {
      id?: string;
      title?: string;
      organisation?: string;
      type?: string;
      deadline?: string | null;
    } | null;
    return {
      id: c.id,
      opportunity_id: opp?.id || c.opportunity_id,
      opportunity_title: opp?.title || "Opportunity",
      organisation: opp?.organisation || "Organisation",
      opportunity_type: opp?.type || "scholarship",
      deadline: opp?.deadline || null,
      closes_at: c.closes_at,
      member_count: count || 0,
      is_member: !!mem && !mem.left_at,
      rules_accepted: !!mem?.rules_accepted_at,
      is_closed: isCohortClosed(c.closes_at),
    };
  } catch {
    return MockCohortStore.getCohort(cohortId, "demo-user");
  }
}

export async function getCohortMessages(
  cohortId: string,
  limit: number = 50
): Promise<CohortMessageItem[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const currentUserId = user?.id || "demo-user";

    // Fetch messages from supabase joined with cohort_member_profiles view
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        cohort_id,
        user_id,
        body,
        created_at
      `)
      .eq("cohort_id", cohortId)
      .eq("hidden", false)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error || !messages || messages.length === 0) {
      return MockCohortStore.getMessages(cohortId, currentUserId, limit);
    }

    // Get profiles of authors
    const authorIds = Array.from(new Set(messages.map((m) => m.user_id)));
    const { data: profiles } = await supabase
      .from("cohort_member_profiles")
      .select("user_id, first_name, university_name, programme")
      .eq("cohort_id", cohortId)
      .in("user_id", authorIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    return messages.map((m) => {
      const p = profileMap.get(m.user_id);
      return {
        id: m.id,
        cohort_id: m.cohort_id,
        user_id: m.user_id,
        first_name: p?.first_name || "Student",
        university_name: p?.university_name || "University student",
        programme: p?.programme || "Degree Programme",
        body: m.body,
        created_at: m.created_at,
        is_own: m.user_id === currentUserId,
      };
    });
  } catch {
    return MockCohortStore.getMessages(cohortId, "demo-user", limit);
  }
}

export async function sendCohortMessage(
  cohortId: string,
  body: string
): Promise<{ success: boolean; error?: string; message?: CohortMessageItem }> {
  let userId = "demo-user";
  let userProfile = {
    first_name: "Jean",
    university_name: "University of Rwanda",
    programme: "BSc Computer Science",
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, programme, suspended, universities(name)")
        .eq("id", user.id)
        .maybeSingle();

      if (p?.suspended) {
        return {
          success: false,
          error: "Your account is currently suspended from participating in cohorts.",
        };
      }

      if (p) {
        userProfile = {
          first_name: extractFirstName(p.full_name),
          university_name:
            (p.universities as { name?: string } | null)?.name ||
            "University student",
          programme: p.programme || "Degree Programme",
        };
      }
    }
  } catch {
    // Demo fallback
  }

  // Check if user is suspended in mock store
  if (MockCohortStore.isUserSuspended(userId)) {
    return {
      success: false,
      error: "Your account is currently suspended from participating in cohorts.",
    };
  }

  // 1. Validate length (1 - 1000 characters)
  const validation = validateMessageContent(body);
  if (!validation.valid || !validation.sanitized) {
    return { success: false, error: validation.error };
  }

  // 2. Validate rate limit (10 messages per minute)
  const rateLimit = checkCohortRateLimit(userId);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `You are sending messages too quickly. Please wait ${rateLimit.resetInSeconds} seconds.`,
    };
  }

  try {
    const serviceClient = createServiceClient();

    // Check cohort closing
    const { data: cohort } = await serviceClient
      .from("cohorts")
      .select("closes_at")
      .eq("id", cohortId)
      .maybeSingle();

    if (cohort && isCohortClosed(cohort.closes_at)) {
      return {
        success: false,
        error: "This cohort has closed for posting.",
      };
    }

    // Insert message
    const { data: newMsg, error } = await serviceClient
      .from("messages")
      .insert({
        cohort_id: cohortId,
        user_id: userId,
        body: validation.sanitized,
      })
      .select("id, cohort_id, user_id, body, created_at")
      .single();

    if (error || !newMsg) {
      // Fall back to Mock store
      recordCohortMessageSent(userId);
      const msg = MockCohortStore.addMessage(
        cohortId,
        userId,
        userProfile,
        validation.sanitized
      );
      revalidatePath(`/cohorts/${cohortId}`);
      revalidatePath("/cohorts");
      return { success: true, message: msg };
    }

    recordCohortMessageSent(userId);
    revalidatePath(`/cohorts/${cohortId}`);
    revalidatePath("/cohorts");

    return {
      success: true,
      message: {
        id: newMsg.id,
        cohort_id: newMsg.cohort_id,
        user_id: newMsg.user_id,
        first_name: userProfile.first_name,
        university_name: userProfile.university_name,
        programme: userProfile.programme,
        body: newMsg.body,
        created_at: newMsg.created_at,
        is_own: true,
      },
    };
  } catch {
    recordCohortMessageSent(userId);
    const msg = MockCohortStore.addMessage(
      cohortId,
      userId,
      userProfile,
      validation.sanitized
    );
    revalidatePath(`/cohorts/${cohortId}`);
    revalidatePath("/cohorts");
    return { success: true, message: msg };
  }
}

export async function acceptCohortRules(cohortId: string): Promise<{ success: boolean }> {
  let userId = "demo-user";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userId = user.id;

    const serviceClient = createServiceClient();
    await serviceClient
      .from("cohort_members")
      .update({ rules_accepted_at: new Date().toISOString() })
      .eq("cohort_id", cohortId)
      .eq("user_id", userId);
  } catch {
    // Fallback
  }

  MockCohortStore.acceptRules(cohortId, userId);
  revalidatePath(`/cohorts/${cohortId}`);
  revalidatePath("/cohorts");
  return { success: true };
}

export async function joinCohort(cohortId: string): Promise<{ success: boolean }> {
  let userId = "demo-user";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userId = user.id;

    const serviceClient = createServiceClient();
    await serviceClient
      .from("cohort_members")
      .upsert(
        {
          cohort_id: cohortId,
          user_id: userId,
          joined_at: new Date().toISOString(),
          left_at: null,
        },
        { onConflict: "cohort_id,user_id" }
      );
  } catch {
    // Fallback
  }

  MockCohortStore.joinCohort(cohortId, userId);
  revalidatePath(`/cohorts/${cohortId}`);
  revalidatePath("/cohorts");
  return { success: true };
}

export async function leaveCohort(cohortId: string): Promise<{ success: boolean }> {
  let userId = "demo-user";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userId = user.id;

    const serviceClient = createServiceClient();
    await serviceClient
      .from("cohort_members")
      .update({ left_at: new Date().toISOString() })
      .eq("cohort_id", cohortId)
      .eq("user_id", userId);
  } catch {
    // Fallback
  }

  MockCohortStore.leaveCohort(cohortId, userId);
  revalidatePath(`/cohorts/${cohortId}`);
  revalidatePath("/cohorts");
  return { success: true };
}

export async function reportCohortMessage(
  messageId: string,
  reason: string
): Promise<{ success: boolean; autoHidden?: boolean }> {
  let reporterId = "demo-user";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) reporterId = user.id;

    const serviceClient = createServiceClient();
    await serviceClient.from("message_reports").insert({
      message_id: messageId,
      reporter_id: reporterId,
      reason,
    });
  } catch {
    // Fallback
  }

  MockCohortStore.reportMessage(messageId, reporterId, reason);
  return { success: true };
}

export async function blockCohortUser(
  blockedUserId: string
): Promise<{ success: boolean }> {
  let blockerId = "demo-user";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) blockerId = user.id;

    const serviceClient = createServiceClient();
    await serviceClient.from("user_blocks").upsert({
      blocker_id: blockerId,
      blocked_id: blockedUserId,
    });
  } catch {
    // Fallback
  }

  MockCohortStore.blockUser(blockerId, blockedUserId);
  return { success: true };
}

export async function getAdminReportedMessages(): Promise<MessageReportItem[]> {
  try {
    const serviceClient = createServiceClient();
    const { data: reports, error } = await serviceClient
      .from("message_reports")
      .select(`
        id,
        message_id,
        reason,
        created_at,
        reporter_id,
        messages!inner (
          id,
          body,
          user_id,
          cohort_id,
          hidden,
          cohorts!inner (
            id,
            opportunities!inner (
              title
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error || !reports || reports.length === 0) {
      return MockCohortStore.getReportedMessages();
    }

    interface DbReportItem {
      id: string;
      message_id: string;
      reporter_id: string;
      reason: string;
      created_at: string;
      messages: {
        body: string;
        user_id: string;
        cohort_id: string;
        cohorts: {
          opportunities: {
            title: string;
          } | null;
        } | null;
      } | null;
    }

    return (reports as unknown as DbReportItem[]).map((r) => ({
      id: r.id,
      message_id: r.message_id,
      message_body: r.messages?.body || "",
      author_id: r.messages?.user_id || "",
      author_name: "Student",
      reporter_id: r.reporter_id,
      reason: r.reason,
      cohort_id: r.messages?.cohort_id || "",
      opportunity_title: r.messages?.cohorts?.opportunities?.title || "Opportunity",
      created_at: r.created_at,
      reports_count: 1,
    }));
  } catch {
    return MockCohortStore.getReportedMessages();
  }
}

export async function adminHideMessage(messageId: string): Promise<{ success: boolean }> {
  try {
    const serviceClient = createServiceClient();
    await serviceClient
      .from("messages")
      .update({ hidden: true })
      .eq("id", messageId);
  } catch {
    // Fallback
  }

  MockCohortStore.hideMessage(messageId);
  revalidatePath("/admin/moderation");
  return { success: true };
}

export async function adminDismissReports(messageId: string): Promise<{ success: boolean }> {
  try {
    const serviceClient = createServiceClient();
    await serviceClient
      .from("message_reports")
      .delete()
      .eq("message_id", messageId);
  } catch {
    // Fallback
  }

  MockCohortStore.dismissReports(messageId);
  revalidatePath("/admin/moderation");
  return { success: true };
}

export async function adminSuspendUser(userId: string): Promise<{ success: boolean }> {
  try {
    const serviceClient = createServiceClient();
    await serviceClient
      .from("profiles")
      .update({ suspended: true })
      .eq("id", userId);
  } catch {
    // Fallback
  }

  MockCohortStore.suspendUser(userId);
  revalidatePath("/admin/moderation");
  return { success: true };
}
