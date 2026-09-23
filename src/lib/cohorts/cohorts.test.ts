import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateCohortClosingDate,
  isCohortClosed,
  validateMessageContent,
  extractFirstName,
  COMMUNITY_RULES,
} from "./rules";
import {
  checkCohortRateLimit,
  recordCohortMessageSent,
  _resetCohortRateLimitForTesting,
} from "./rate-limit";
import {
  shouldAutoHideMessage,
  filterVisibleMessages,
  AUTO_HIDE_REPORT_THRESHOLD,
} from "./moderation";

describe("Cohort Rules & Logic", () => {
  it("calculates closing date exactly 30 days after opportunity deadline", () => {
    const deadline = "2026-10-15T00:00:00.000Z";
    const closing = calculateCohortClosingDate(deadline);
    expect(closing).not.toBeNull();

    const deadlineDate = new Date(deadline);
    const closingDate = new Date(closing!);
    const diffDays =
      (closingDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(30);
  });

  it("handles null or invalid deadline gracefully", () => {
    expect(calculateCohortClosingDate(null)).toBeNull();
    expect(calculateCohortClosingDate("invalid-date")).toBeNull();
  });

  it("checks cohort closed status accurately against closes_at", () => {
    const pastClosesAt = "2026-08-01T00:00:00.000Z";
    const futureClosesAt = "2026-12-01T00:00:00.000Z";
    const now = "2026-09-23T12:00:00.000Z";

    expect(isCohortClosed(pastClosesAt, now)).toBe(true);
    expect(isCohortClosed(futureClosesAt, now)).toBe(false);
    expect(isCohortClosed(null, now)).toBe(false);
  });

  it("validates message content length within 1-1000 characters", () => {
    expect(validateMessageContent("").valid).toBe(false);
    expect(validateMessageContent("   ").valid).toBe(false);
    expect(validateMessageContent("Hello fellow applicants!").valid).toBe(true);

    const long1001 = "a".repeat(1001);
    expect(validateMessageContent(long1001).valid).toBe(false);

    const exact1000 = "a".repeat(1000);
    expect(validateMessageContent(exact1000).valid).toBe(true);
  });

  it("extracts privacy-preserving first name only", () => {
    expect(extractFirstName("Jean Paul Mugisha")).toBe("Jean");
    expect(extractFirstName("Aline Uwase")).toBe("Aline");
    expect(extractFirstName("")).toBe("Student");
    expect(extractFirstName(null)).toBe("Student");
  });

  it("contains 5 concise community rules", () => {
    expect(COMMUNITY_RULES.length).toBe(5);
    expect(COMMUNITY_RULES[0].title).toBe("Respect and encouragement");
  });
});

describe("Cohort Rate Limiter (10 msgs / min)", () => {
  const userId = "test-cohort-user";
  const baseTime = 1758600000000;

  beforeEach(() => {
    _resetCohortRateLimitForTesting();
  });

  it("allows up to 10 messages within 60 seconds", () => {
    for (let i = 0; i < 10; i++) {
      const status = checkCohortRateLimit(userId, 10, baseTime + i * 1000);
      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(10 - i);
      recordCohortMessageSent(userId, baseTime + i * 1000);
    }

    // 11th message is blocked
    const blockedStatus = checkCohortRateLimit(userId, 10, baseTime + 11 * 1000);
    expect(blockedStatus.allowed).toBe(false);
    expect(blockedStatus.remaining).toBe(0);
    expect(blockedStatus.resetInSeconds).toBeGreaterThan(0);
  });

  it("resets rate limit window after 60 seconds", () => {
    for (let i = 0; i < 10; i++) {
      recordCohortMessageSent(userId, baseTime + i * 1000);
    }

    // 61+ seconds after the last message was recorded
    const futureTime = baseTime + 75 * 1000;
    const status = checkCohortRateLimit(userId, 10, futureTime);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(10);
  });
});

describe("Cohort Moderation (Auto-hide & Blocks)", () => {
  it("enforces auto-hide at 3 reports", () => {
    expect(AUTO_HIDE_REPORT_THRESHOLD).toBe(3);
    expect(shouldAutoHideMessage(1)).toBe(false);
    expect(shouldAutoHideMessage(2)).toBe(false);
    expect(shouldAutoHideMessage(3)).toBe(true);
    expect(shouldAutoHideMessage(5)).toBe(true);
  });

  it("filters out hidden and blocked user messages", () => {
    const messages = [
      { id: "m1", user_id: "u1", body: "Hello all", hidden: false },
      { id: "m2", user_id: "u2", body: "Spam link", hidden: true },
      { id: "m3", user_id: "u3", body: "From annoying user", hidden: false },
      { id: "m4", user_id: "u1", body: "Good luck", hidden: false },
    ];

    const blockedUserIds = new Set(["u3"]);
    const visible = filterVisibleMessages(messages, blockedUserIds);

    expect(visible.map((m) => m.id)).toEqual(["m1", "m4"]);
  });
});
