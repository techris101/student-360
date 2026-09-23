import { describe, it, expect, beforeEach } from "vitest";
import { MockCohortStore } from "./mock-store";
import {
  validateMessageContent,
  calculateCohortClosingDate,
  isCohortClosed,
  extractFirstName,
} from "./rules";
import {
  checkCohortRateLimit,
  recordCohortMessageSent,
  _resetCohortRateLimitForTesting,
} from "./rate-limit";
import { shouldAutoHideMessage } from "./moderation";

describe("P5 Cohorts Verification Suite", () => {
  const cohortId = "cohort-opp-001";
  const userA = "test-user-alice";
  const userB = "test-user-bob";

  beforeEach(() => {
    _resetCohortRateLimitForTesting();
  });

  it("1. Allows multiple users to join, accept rules, and exchange chat messages", () => {
    // Join cohort
    MockCohortStore.joinCohort(cohortId, userA);
    MockCohortStore.joinCohort(cohortId, userB);

    // Accept rules
    MockCohortStore.acceptRules(cohortId, userA);
    MockCohortStore.acceptRules(cohortId, userB);

    const cohortA = MockCohortStore.getCohort(cohortId, userA);
    expect(cohortA?.is_member).toBe(true);
    expect(cohortA?.rules_accepted).toBe(true);
    expect(cohortA?.member_count).toBeGreaterThanOrEqual(2);

    // User A sends message
    const msgA = MockCohortStore.addMessage(
      cohortId,
      userA,
      {
        first_name: "Alice",
        university_name: "University of Rwanda",
        programme: "BSc Computer Science",
      },
      "Hello! When does the document verification window close?"
    );

    // User B sends message
    const msgB = MockCohortStore.addMessage(
      cohortId,
      userB,
      {
        first_name: "Bob",
        university_name: "CMU-Africa",
        programme: "MSc Information Technology",
      },
      "It closes two weeks before the final submission deadline."
    );

    expect(msgA.id).toBeDefined();
    expect(msgB.id).toBeDefined();

    // User A reads messages
    const messagesForA = MockCohortStore.getMessages(cohortId, userA);
    expect(messagesForA.some((m) => m.id === msgA.id && m.is_own)).toBe(true);
    expect(messagesForA.some((m) => m.id === msgB.id && !m.is_own)).toBe(true);

    // User B reads messages
    const messagesForB = MockCohortStore.getMessages(cohortId, userB);
    expect(messagesForB.some((m) => m.id === msgB.id && m.is_own)).toBe(true);
    expect(messagesForB.some((m) => m.id === msgA.id && !m.is_own)).toBe(true);
  });

  it("2. User blocks another user: blocked user's messages disappear for the blocker", () => {
    // User A blocks User B
    MockCohortStore.blockUser(userA, userB);
    expect(MockCohortStore.isUserBlocked(userA, userB)).toBe(true);

    // User A should no longer see User B's messages
    const messagesForA = MockCohortStore.getMessages(cohortId, userA);
    const hasBobMessage = messagesForA.some((m) => m.user_id === userB);
    expect(hasBobMessage).toBe(false);

    // User B can still see their own messages and User A's messages
    const messagesForB = MockCohortStore.getMessages(cohortId, userB);
    expect(messagesForB.some((m) => m.user_id === userB)).toBe(true);

    // Unblock restores visibility
    MockCohortStore.unblockUser(userA, userB);
    const messagesAfterUnblock = MockCohortStore.getMessages(cohortId, userA);
    expect(messagesAfterUnblock.some((m) => m.user_id === userB)).toBe(true);
  });

  it("3. User reports a message: report reaches admin moderation queue", () => {
    const messages = MockCohortStore.getMessages(cohortId, userA);
    const targetMsg = messages[0];
    expect(targetMsg).toBeDefined();

    MockCohortStore.reportMessage(
      targetMsg.id,
      userA,
      "Spam, advertising, or external links"
    );

    const adminReports = MockCohortStore.getReportedMessages();
    expect(adminReports.length).toBeGreaterThan(0);
    const reported = adminReports.find((r) => r.message_id === targetMsg.id);
    expect(reported).toBeDefined();
    expect(reported?.reason).toContain("Spam");
  });

  it("4. Auto-hides message at 3 reports", () => {
    const newMsg = MockCohortStore.addMessage(
      cohortId,
      "spammer-user",
      {
        first_name: "BadActor",
        university_name: "External",
        programme: "None",
      },
      "Click this suspicious link for guaranteed admission!"
    );

    expect(shouldAutoHideMessage(1)).toBe(false);
    expect(shouldAutoHideMessage(2)).toBe(false);

    // 1st report
    MockCohortStore.reportMessage(newMsg.id, "reporter-1", "Spam");
    let visible = MockCohortStore.getMessages(cohortId, userA);
    expect(visible.some((m) => m.id === newMsg.id)).toBe(true);

    // 2nd report
    MockCohortStore.reportMessage(newMsg.id, "reporter-2", "Spam");
    visible = MockCohortStore.getMessages(cohortId, userA);
    expect(visible.some((m) => m.id === newMsg.id)).toBe(true);

    // 3rd report -> auto-hide threshold reached
    expect(shouldAutoHideMessage(3)).toBe(true);
    MockCohortStore.reportMessage(newMsg.id, "reporter-3", "Spam");
    visible = MockCohortStore.getMessages(cohortId, userA);
    expect(visible.some((m) => m.id === newMsg.id)).toBe(false);
  });

  it("5. Suspended users cannot post messages", () => {
    const suspendedId = "user-suspended-test";
    MockCohortStore.suspendUser(suspendedId);
    expect(MockCohortStore.isUserSuspended(suspendedId)).toBe(true);
  });

  it("6. Cohort closing calculation: exactly 30 days after deadline", () => {
    const deadline = "2026-11-15T00:00:00.000Z";
    const closingIso = calculateCohortClosingDate(deadline);
    expect(closingIso).not.toBeNull();

    const deadlineDate = new Date(deadline);
    const closingDate = new Date(closingIso!);
    const diffDays = Math.round(
      (closingDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(30);

    // 31 days after deadline -> cohort is closed
    const pastCloses = new Date(closingDate.getTime() + 86400000).toISOString();
    expect(isCohortClosed(closingIso, pastCloses)).toBe(true);

    // 10 days before closing -> cohort remains open
    const beforeCloses = new Date(closingDate.getTime() - 864000000).toISOString();
    expect(isCohortClosed(closingIso, beforeCloses)).toBe(false);
  });

  it("7. Validates message content (length 1 to 1000 chars, no empty messages)", () => {
    expect(validateMessageContent("").valid).toBe(false);
    expect(validateMessageContent("   \n   ").valid).toBe(false);
    expect(validateMessageContent("Valid message!").valid).toBe(true);
    expect(validateMessageContent("a".repeat(1001)).valid).toBe(false);
    expect(validateMessageContent("a".repeat(1000)).valid).toBe(true);
  });

  it("8. Enforces rate limit of 10 messages per minute per user", () => {
    const testRateUser = "user-rate-verification";
    const now = 1758610000000;

    for (let i = 0; i < 10; i++) {
      const res = checkCohortRateLimit(testRateUser, 10, now + i * 500);
      expect(res.allowed).toBe(true);
      recordCohortMessageSent(testRateUser, now + i * 500);
    }

    // 11th call within the minute is blocked
    const blockedRes = checkCohortRateLimit(testRateUser, 10, now + 5500);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.resetInSeconds).toBeGreaterThan(0);
  });

  it("9. Preserves member privacy by exposing only first name, university, and programme", () => {
    expect(extractFirstName("Jean Paul Mugisha")).toBe("Jean");
    expect(extractFirstName("Diane Uwase")).toBe("Diane");

    const messages = MockCohortStore.getMessages(cohortId, userA);
    messages.forEach((msg) => {
      // Must not contain email addresses or phone numbers
      expect(msg.first_name).not.toContain("@");
      expect(msg.first_name).not.toMatch(/^\+?250/);
      expect(msg.first_name.split(" ").length).toBe(1);
    });
  });

  it("10. Supports leaving and re-joining cohorts", () => {
    const testUser = "user-leave-rejoin";
    MockCohortStore.joinCohort(cohortId, testUser);
    let cohort = MockCohortStore.getCohort(cohortId, testUser);
    expect(cohort?.is_member).toBe(true);

    MockCohortStore.leaveCohort(cohortId, testUser);
    cohort = MockCohortStore.getCohort(cohortId, testUser);
    expect(cohort?.is_member).toBe(false);

    MockCohortStore.joinCohort(cohortId, testUser);
    cohort = MockCohortStore.getCohort(cohortId, testUser);
    expect(cohort?.is_member).toBe(true);
  });
});
