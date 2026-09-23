import { describe, it, expect } from "vitest";
import {
  computeApplicationCounts,
  filterUpcomingDeadlines,
  canRequestProgressReview,
  validateProgressReviewWordCount,
  checkDeadlineReminderStage,
  type ApplicationWithOpportunity,
} from "./progress";
import type { ApplicationStatus } from "@/lib/supabase/types";
import {
  assembleProgressReviewPrompt,
  generateFallbackProgressReview,
} from "@/lib/ai/progress-review";

describe("Progress Pure Logic & Rules", () => {
  describe("computeApplicationCounts", () => {
    it("correctly computes 5 top status numbers per PRODUCT F5", () => {
      const sampleApps: { status: ApplicationStatus }[] = [
        { status: "saved" },
        { status: "saved" },
        { status: "applying" },
        { status: "submitted" },
        { status: "interview" },
        { status: "accepted" },
        { status: "rejected" },
        { status: "withdrawn" },
      ];

      const counts = computeApplicationCounts(sampleApps);

      expect(counts.saved).toBe(2);
      expect(counts.applied).toBe(2); // applying + submitted
      expect(counts.interview).toBe(1);
      expect(counts.accepted).toBe(1);
      expect(counts.rejected).toBe(1);
      expect(counts.withdrawn).toBe(1);
      expect(counts.total).toBe(8);
    });

    it("returns zeros for empty applications", () => {
      const counts = computeApplicationCounts([]);
      expect(counts.saved).toBe(0);
      expect(counts.applied).toBe(0);
      expect(counts.interview).toBe(0);
      expect(counts.accepted).toBe(0);
      expect(counts.rejected).toBe(0);
      expect(counts.total).toBe(0);
    });
  });

  describe("filterUpcomingDeadlines", () => {
    const baseNow = new Date("2026-10-01T12:00:00Z");

    const makeApp = (
      id: string,
      status: ApplicationStatus,
      deadline: string | null
    ): ApplicationWithOpportunity => ({
      id,
      user_id: "user-1",
      opportunity_id: `opp-${id}`,
      status,
      had_interview: null,
      notes: null,
      created_at: baseNow.toISOString(),
      updated_at: baseNow.toISOString(),
      opportunity: {
        id: `opp-${id}`,
        title: `Opportunity ${id}`,
        organisation: "Test Org",
        type: "scholarship",
        deadline,
        deadline_rolling: false,
        funding: "fully_funded",
        location_scope: "rwanda",
        location_text: "Kigali",
        official_url: "https://example.com",
      },
    });

    it("only includes saved or active items with future deadlines and sorts ascending", () => {
      const apps: ApplicationWithOpportunity[] = [
        makeApp("1", "saved", "2026-10-15T00:00:00Z"), // +14 days
        makeApp("2", "applying", "2026-10-05T00:00:00Z"), // +4 days (closest)
        makeApp("3", "submitted", "2026-10-20T00:00:00Z"), // +19 days
        makeApp("4", "saved", "2026-09-20T00:00:00Z"), // past deadline -> excluded
        makeApp("5", "rejected", "2026-10-10T00:00:00Z"), // status rejected -> excluded
        makeApp("6", "saved", null), // rolling / null deadline -> excluded
      ];

      const upcoming = filterUpcomingDeadlines(apps, baseNow);

      expect(upcoming).toHaveLength(3);
      expect(upcoming[0].id).toBe("2"); // 2026-10-05
      expect(upcoming[1].id).toBe("1"); // 2026-10-15
      expect(upcoming[2].id).toBe("3"); // 2026-10-20
    });
  });

  describe("canRequestProgressReview (7-day rule)", () => {
    const baseNow = new Date("2026-10-10T10:00:00Z");

    it("allows review if never requested before", () => {
      const result = canRequestProgressReview(null, baseNow);
      expect(result.allowed).toBe(true);
      expect(result.daysRemaining).toBe(0);
      expect(result.nextAvailableDate).toBeNull();
    });

    it("blocks review if requested 3 days ago", () => {
      const threeDaysAgo = new Date("2026-10-07T10:00:00Z");
      const result = canRequestProgressReview(threeDaysAgo, baseNow);

      expect(result.allowed).toBe(false);
      expect(result.daysRemaining).toBe(4);
      expect(result.nextAvailableDate).toEqual(
        new Date("2026-10-14T10:00:00Z")
      );
    });

    it("allows review if requested exactly 7 days ago or more", () => {
      const sevenDaysAgo = new Date("2026-10-03T10:00:00Z");
      const result = canRequestProgressReview(sevenDaysAgo, baseNow);

      expect(result.allowed).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });
  });

  describe("validateProgressReviewWordCount", () => {
    it("validates content under 180 words", () => {
      const sampleReview =
        "You have saved three scholarships and applied to one. Your primary bottleneck is submitting applications before the upcoming 15 October deadline. Focus on completing your motivation letter for the Mastercard Foundation Scholars Program this week, then submit your transcript.";
      const res = validateProgressReviewWordCount(sampleReview, 180);
      expect(res.valid).toBe(true);
      expect(res.wordCount).toBeLessThanOrEqual(180);
      expect(res.text).toBe(sampleReview);
    });

    it("trims content exceeding 180 words with ellipsis", () => {
      const longText = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
      const res = validateProgressReviewWordCount(longText, 180);
      expect(res.valid).toBe(false);
      expect(res.wordCount).toBe(200);
      expect(res.text.split(" ").length).toBe(180);
      expect(res.text.endsWith("...")).toBe(true);
    });
  });

  describe("checkDeadlineReminderStage (7 days & 1 day)", () => {
    const baseNow = new Date("2026-10-10T12:00:00Z");

    it("detects 7-day reminder window", () => {
      // exactly 7 days = 2026-10-17T12:00:00Z (168 hours)
      const target = "2026-10-17T12:00:00Z";
      expect(checkDeadlineReminderStage(target, baseNow)).toBe("7_days");
    });

    it("detects 1-day reminder window", () => {
      // exactly 24 hours = 2026-10-11T12:00:00Z
      const target = "2026-10-11T12:00:00Z";
      expect(checkDeadlineReminderStage(target, baseNow)).toBe("1_day");
    });

    it("returns null for non-matching windows", () => {
      // 3 days
      expect(checkDeadlineReminderStage("2026-10-13T12:00:00Z", baseNow)).toBeNull();
      // past
      expect(checkDeadlineReminderStage("2026-10-09T12:00:00Z", baseNow)).toBeNull();
    });
  });

  describe("Progress Review Prompt & Fallback", () => {
    const data = {
      stats: {
        saved: 3,
        applied: 1,
        interview: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
        total: 4,
      },
      applications: [
        {
          title: "DAAD In-Country/In-Region Scholarship",
          organisation: "DAAD",
          status: "applying",
          deadline: "2026-11-15",
        },
        {
          title: "Mastercard Foundation Scholars",
          organisation: "UR",
          status: "saved",
          deadline: "2026-10-25",
        },
      ],
      profileGaps: ["English test score (IELTS/TOEFL)"],
      upcomingDeadlines: [
        {
          title: "Mastercard Foundation Scholars",
          deadline: "2026-10-25",
        },
      ],
    };

    it("assembles prompt with real stats, gaps, and deadlines without placeholders", () => {
      const prompt = assembleProgressReviewPrompt(data);

      expect(prompt).toContain("DAAD");
      expect(prompt).toContain("Mastercard Foundation");
      expect(prompt).toContain("English test score");
      expect(prompt).not.toContain("{{stats}}");
      expect(prompt).not.toContain("{{applications}}");
      expect(prompt).not.toContain("{{profile_gaps}}");
      expect(prompt).not.toContain("{{upcoming_deadlines}}");
    });

    it("generates honest fallback review under 180 words matching rules", () => {
      const review = generateFallbackProgressReview(data);

      const words = review.trim().split(/\s+/).length;
      expect(words).toBeLessThanOrEqual(180);
      expect(review).toContain("1 active application");
      expect(review).toContain("Mastercard Foundation Scholars");
      expect(review).toContain("English test score");
    });
  });
});
