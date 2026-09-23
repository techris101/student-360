import { SEED_OPPORTUNITIES } from "@/lib/data/opportunities";
import { calculateCohortClosingDate, isCohortClosed } from "./rules";
import type {
  CohortItem,
  CohortMessageItem,
  MessageReportItem,
} from "./types";

interface StoredMember {
  cohort_id: string;
  user_id: string;
  rules_accepted_at: string | null;
  left_at: string | null;
  first_name: string;
  university_name: string;
  programme: string;
}

interface StoredMessage {
  id: string;
  cohort_id: string;
  user_id: string;
  first_name: string;
  university_name: string;
  programme: string;
  body: string;
  hidden: boolean;
  created_at: string;
}

interface StoredReport {
  id: string;
  message_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
}

// Global in-memory fallback state
const seedCohorts: Map<string, CohortItem> = new Map();
const cohortMembers: StoredMember[] = [];
const cohortMessages: StoredMessage[] = [];
const messageReports: StoredReport[] = [];
const userBlocks: Set<string> = new Set(); // "blockerId:blockedId"
const suspendedUsers: Set<string> = new Set();

function initSeedCohorts() {
  if (seedCohorts.size > 0) return;

  SEED_OPPORTUNITIES.slice(0, 15).forEach((opp, idx) => {
    const cohortId = `cohort-${opp.id}`;
    const closesAt = calculateCohortClosingDate(opp.deadline);
    const closed = isCohortClosed(closesAt);

    seedCohorts.set(cohortId, {
      id: cohortId,
      opportunity_id: opp.id,
      opportunity_title: opp.title,
      organisation: opp.organisation,
      opportunity_type: opp.type,
      deadline: opp.deadline,
      closes_at: closesAt,
      member_count: idx < 3 ? 3 : 1, // First 3 have active members to demonstrate chat
      is_member: idx < 2, // User is member of first 2
      rules_accepted: idx === 0, // Accepted rules in first
      is_closed: closed,
    });

    // Seed dummy peer members for the first 3 cohorts
    if (idx < 3) {
      cohortMembers.push(
        {
          cohort_id: cohortId,
          user_id: "demo-user",
          rules_accepted_at: idx === 0 ? "2026-09-20T10:00:00Z" : null,
          left_at: null,
          first_name: "Jean",
          university_name: "University of Rwanda",
          programme: "BSc Computer Science",
        },
        {
          cohort_id: cohortId,
          user_id: "user-peer-1",
          rules_accepted_at: "2026-09-21T08:30:00Z",
          left_at: null,
          first_name: "Diane",
          university_name: "African Leadership University",
          programme: "Software Engineering",
        },
        {
          cohort_id: cohortId,
          user_id: "user-peer-2",
          rules_accepted_at: "2026-09-22T09:15:00Z",
          left_at: null,
          first_name: "Patrick",
          university_name: "CMU-Africa",
          programme: "MSc Information Technology",
        }
      );

      // Seed chat messages
      cohortMessages.push(
        {
          id: `msg-${cohortId}-1`,
          cohort_id: cohortId,
          user_id: "user-peer-1",
          first_name: "Diane",
          university_name: "African Leadership University",
          programme: "Software Engineering",
          body: "Hello everyone! Has anyone started preparing the certified academic transcripts for this call yet?",
          hidden: false,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: `msg-${cohortId}-2`,
          cohort_id: cohortId,
          user_id: "user-peer-2",
          first_name: "Patrick",
          university_name: "CMU-Africa",
          programme: "MSc Information Technology",
          body: "Yes, I requested mine from the registrar yesterday. Usually takes 3-5 working days. Make sure to get the English translation if yours is in French.",
          hidden: false,
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        }
      );
    }
  });
}

// Initialize on module load
initSeedCohorts();

export function resolveStoredCohortId(cohortId: string): string {
  initSeedCohorts();
  if (seedCohorts.has(cohortId)) return cohortId;
  const match = Array.from(seedCohorts.values()).find(
    (c) => c.opportunity_id === cohortId || c.id === `cohort-${cohortId}`
  );
  return match?.id || cohortId;
}

export const MockCohortStore = {
  listCohorts(userId: string = "demo-user"): CohortItem[] {
    initSeedCohorts();
    return Array.from(seedCohorts.values()).map((c) => {
      const userMember = cohortMembers.find(
        (m) => m.cohort_id === c.id && m.user_id === userId && !m.left_at
      );
      const totalMembers = cohortMembers.filter(
        (m) => m.cohort_id === c.id && !m.left_at
      ).length;

      return {
        ...c,
        member_count: Math.max(c.member_count, totalMembers),
        is_member: !!userMember,
        rules_accepted: !!userMember?.rules_accepted_at,
      };
    });
  },

  getCohort(cohortId: string, userId: string = "demo-user"): CohortItem | null {
    initSeedCohorts();
    const resolvedId = resolveStoredCohortId(cohortId);
    const c = seedCohorts.get(resolvedId);
    if (!c) return null;

    const userMember = cohortMembers.find(
      (m) => m.cohort_id === c.id && m.user_id === userId && !m.left_at
    );
    const totalMembers = cohortMembers.filter(
      (m) => m.cohort_id === c.id && !m.left_at
    ).length;

    return {
      ...c,
      member_count: Math.max(c.member_count, totalMembers),
      is_member: !!userMember,
      rules_accepted: !!userMember?.rules_accepted_at,
    };
  },

  getMessages(
    cohortId: string,
    currentUserId: string = "demo-user",
    limit: number = 50
  ): CohortMessageItem[] {
    initSeedCohorts();
    const resolvedId = resolveStoredCohortId(cohortId);

    // Find who current user has blocked
    const blocked = new Set<string>();
    userBlocks.forEach((blockKey) => {
      const [blocker, target] = blockKey.split(":");
      if (blocker === currentUserId) {
        blocked.add(target);
      }
    });

    return cohortMessages
      .filter((m) => m.cohort_id === resolvedId && !m.hidden && !blocked.has(m.user_id))
      .slice(-limit)
      .map((m) => ({
        id: m.id,
        cohort_id: m.cohort_id,
        user_id: m.user_id,
        first_name: m.first_name,
        university_name: m.university_name,
        programme: m.programme,
        body: m.body,
        created_at: m.created_at,
        is_own: m.user_id === currentUserId,
      }));
  },

  addMessage(
    cohortId: string,
    userId: string,
    profile: { first_name: string; university_name: string; programme: string },
    body: string
  ): CohortMessageItem {
    initSeedCohorts();
    const resolvedId = resolveStoredCohortId(cohortId);
    const newMsg: StoredMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      cohort_id: resolvedId,
      user_id: userId,
      first_name: profile.first_name,
      university_name: profile.university_name,
      programme: profile.programme,
      body,
      hidden: false,
      created_at: new Date().toISOString(),
    };

    cohortMessages.push(newMsg);

    return {
      id: newMsg.id,
      cohort_id: newMsg.cohort_id,
      user_id: newMsg.user_id,
      first_name: newMsg.first_name,
      university_name: newMsg.university_name,
      programme: newMsg.programme,
      body: newMsg.body,
      created_at: newMsg.created_at,
      is_own: true,
    };
  },

  acceptRules(cohortId: string, userId: string = "demo-user") {
    initSeedCohorts();
    const resolvedId = resolveStoredCohortId(cohortId);
    const member = cohortMembers.find(
      (m) => m.cohort_id === resolvedId && m.user_id === userId
    );
    if (member) {
      member.rules_accepted_at = new Date().toISOString();
    } else {
      cohortMembers.push({
        cohort_id: resolvedId,
        user_id: userId,
        rules_accepted_at: new Date().toISOString(),
        left_at: null,
        first_name: "Jean",
        university_name: "University of Rwanda",
        programme: "BSc Computer Science",
      });
    }
  },

  joinCohort(cohortId: string, userId: string = "demo-user") {
    initSeedCohorts();
    const resolvedId = resolveStoredCohortId(cohortId);
    const member = cohortMembers.find(
      (m) => m.cohort_id === resolvedId && m.user_id === userId
    );
    if (member) {
      member.left_at = null;
    } else {
      cohortMembers.push({
        cohort_id: resolvedId,
        user_id: userId,
        rules_accepted_at: null,
        left_at: null,
        first_name: "Jean",
        university_name: "University of Rwanda",
        programme: "BSc Computer Science",
      });
    }
  },

  leaveCohort(cohortId: string, userId: string = "demo-user") {
    initSeedCohorts();
    const resolvedId = resolveStoredCohortId(cohortId);
    const member = cohortMembers.find(
      (m) => m.cohort_id === resolvedId && m.user_id === userId
    );
    if (member) {
      member.left_at = new Date().toISOString();
    }
  },

  reportMessage(messageId: string, reporterId: string, reason: string) {
    initSeedCohorts();
    messageReports.push({
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      message_id: messageId,
      reporter_id: reporterId,
      reason,
      created_at: new Date().toISOString(),
    });

    // Check 3 reports auto-hide
    const count = messageReports.filter((r) => r.message_id === messageId).length;
    if (count >= 3) {
      const msg = cohortMessages.find((m) => m.id === messageId);
      if (msg) msg.hidden = true;
    }
  },

  blockUser(blockerId: string, blockedId: string) {
    userBlocks.add(`${blockerId}:${blockedId}`);
  },

  unblockUser(blockerId: string, blockedId: string) {
    userBlocks.delete(`${blockerId}:${blockedId}`);
  },

  isUserBlocked(blockerId: string, targetId: string): boolean {
    return userBlocks.has(`${blockerId}:${targetId}`);
  },

  suspendUser(userId: string) {
    suspendedUsers.add(userId);
  },

  isUserSuspended(userId: string): boolean {
    return suspendedUsers.has(userId);
  },

  getReportedMessages(): MessageReportItem[] {
    initSeedCohorts();
    const grouped = new Map<string, { reports: StoredReport[]; msg?: StoredMessage }>();

    messageReports.forEach((rep) => {
      const cur = grouped.get(rep.message_id) || {
        reports: [],
        msg: cohortMessages.find((m) => m.id === rep.message_id),
      };
      cur.reports.push(rep);
      grouped.set(rep.message_id, cur);
    });

    const items: MessageReportItem[] = [];
    grouped.forEach(({ reports, msg }, messageId) => {
      if (!msg) return;
      const cohort = seedCohorts.get(msg.cohort_id);
      items.push({
        id: reports[0].id,
        message_id: messageId,
        message_body: msg.body,
        author_id: msg.user_id,
        author_name: msg.first_name,
        reporter_id: reports[0].reporter_id,
        reason: reports.map((r) => r.reason).join("; "),
        cohort_id: msg.cohort_id,
        opportunity_title: cohort?.opportunity_title || "Opportunity",
        created_at: reports[0].created_at,
        reports_count: reports.length,
      });
    });

    return items;
  },

  hideMessage(messageId: string) {
    const msg = cohortMessages.find((m) => m.id === messageId);
    if (msg) msg.hidden = true;
  },

  dismissReports(messageId: string) {
    const remaining = messageReports.filter((r) => r.message_id !== messageId);
    messageReports.length = 0;
    messageReports.push(...remaining);
  },
};
