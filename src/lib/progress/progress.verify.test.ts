import { describe, it, expect } from "vitest";
import {
  computeApplicationCounts,
  filterUpcomingDeadlines,
  canRequestProgressReview,
  validateProgressReviewWordCount,
  checkDeadlineReminderStage,
  type ApplicationWithOpportunity,
} from "./progress";
import {
  assembleProgressReviewPrompt,
  generateFallbackProgressReview,
} from "@/lib/ai/progress-review";
import { runDeadlineReminders } from "../../../scripts/pipeline/reminders";
import { runWeeklyDigest } from "../../../scripts/pipeline/digest";

describe("Phase P7 Verification — Progress, AI Review & Notifications", () => {
  const mockNow = new Date("2026-10-15T10:00:00Z");

  const testApplications: ApplicationWithOpportunity[] = [
    {
      id: "test-app-1",
      user_id: "test-user-1",
      opportunity_id: "opp-1",
      status: "saved",
      had_interview: null,
      notes: null,
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-01T00:00:00Z",
      opportunity: {
        id: "opp-1",
        title: "Mastercard Foundation Scholars at UR",
        organisation: "University of Rwanda",
        type: "scholarship",
        deadline: "2026-10-22T10:00:00Z", // exactly 7 days from mockNow
        deadline_rolling: false,
        funding: "fully_funded",
        location_scope: "rwanda",
        location_text: "Huye / Kigali",
        official_url: "https://ur.ac.rw/mcf",
      },
    },
    {
      id: "test-app-2",
      user_id: "test-user-1",
      opportunity_id: "opp-2",
      status: "applying",
      had_interview: null,
      notes: "Drafting essays",
      created_at: "2026-10-05T00:00:00Z",
      updated_at: "2026-10-05T00:00:00Z",
      opportunity: {
        id: "opp-2",
        title: "DAAD In-Region Postgraduate Scholarships",
        organisation: "DAAD",
        type: "scholarship",
        deadline: "2026-10-16T10:00:00Z", // exactly 1 day (24h) from mockNow
        deadline_rolling: false,
        funding: "fully_funded",
        location_scope: "regional",
        location_text: "East Africa",
        official_url: "https://daad.de",
      },
    },
    {
      id: "test-app-3",
      user_id: "test-user-1",
      opportunity_id: "opp-3",
      status: "submitted",
      had_interview: null,
      notes: "Submitted via portal",
      created_at: "2026-10-02T00:00:00Z",
      updated_at: "2026-10-10T00:00:00Z",
      opportunity: {
        id: "opp-3",
        title: "Government Bilateral Scholarships",
        organisation: "HEC Rwanda",
        type: "scholarship",
        deadline: "2026-11-30T00:00:00Z",
        deadline_rolling: false,
        funding: "fully_funded",
        location_scope: "international",
        location_text: "Various",
        official_url: "https://hec.gov.rw",
      },
    },
    {
      id: "test-app-4",
      user_id: "test-user-1",
      opportunity_id: "opp-4",
      status: "accepted",
      had_interview: true, // outcome data collected per PRODUCT F5
      notes: "Received offer letter",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-10-08T00:00:00Z",
      opportunity: {
        id: "opp-4",
        title: "Kigali Tech Summer Fellowship",
        organisation: "Rwanda Information Society Authority",
        type: "fellowship",
        deadline: "2026-09-15T00:00:00Z",
        deadline_rolling: false,
        funding: "paid",
        location_scope: "rwanda",
        location_text: "Kigali",
        official_url: "https://risa.rw",
      },
    },
  ];

  it("1. Computes 5 tabular status numbers correctly", () => {
    const counts = computeApplicationCounts(testApplications);
    expect(counts.saved).toBe(1);
    expect(counts.applied).toBe(2); // applying + submitted
    expect(counts.interview).toBe(0);
    expect(counts.accepted).toBe(1);
    expect(counts.rejected).toBe(0);
    expect(counts.total).toBe(4);
  });

  it("2. Filters upcoming deadlines for saved & applying items and sorts by urgency", () => {
    const upcoming = filterUpcomingDeadlines(testApplications, mockNow);
    expect(upcoming).toHaveLength(3); // excludes past/accepted
    // Most urgent first: DAAD (1 day away) -> Mastercard (7 days away) -> HEC (46 days away)
    expect(upcoming[0].id).toBe("test-app-2");
    expect(upcoming[1].id).toBe("test-app-1");
    expect(upcoming[2].id).toBe("test-app-3");
  });

  it("3. Enforces 7-day review cooldown and calculates next available date accurately", () => {
    // Case A: never reviewed
    const initialStatus = canRequestProgressReview(null, mockNow);
    expect(initialStatus.allowed).toBe(true);
    expect(initialStatus.daysRemaining).toBe(0);
    expect(initialStatus.nextAvailableDate).toBeNull();

    // Case B: reviewed today
    const reviewedTodayStatus = canRequestProgressReview(mockNow, mockNow);
    expect(reviewedTodayStatus.allowed).toBe(false);
    expect(reviewedTodayStatus.daysRemaining).toBe(7);
    expect(reviewedTodayStatus.nextAvailableDate).toEqual(
      new Date("2026-10-22T10:00:00Z")
    );

    // Case C: reviewed 5 days ago (2 days remaining)
    const fiveDaysAgo = new Date("2026-10-10T10:00:00Z");
    const midStatus = canRequestProgressReview(fiveDaysAgo, mockNow);
    expect(midStatus.allowed).toBe(false);
    expect(midStatus.daysRemaining).toBe(2);

    // Case D: reviewed 8 days ago (allowed again)
    const eightDaysAgo = new Date("2026-10-07T10:00:00Z");
    const allowedAgain = canRequestProgressReview(eightDaysAgo, mockNow);
    expect(allowedAgain.allowed).toBe(true);
  });

  it("4. Generates honest advisor review complying with Prompt 5 (max 180 words, no percentages)", () => {
    const reviewData = {
      stats: computeApplicationCounts(testApplications),
      applications: testApplications.map((a) => ({
        title: a.opportunity.title,
        organisation: a.opportunity.organisation,
        status: a.status,
        deadline: a.opportunity.deadline,
      })),
      profileGaps: ["Official English language proficiency test"],
      upcomingDeadlines: [
        {
          title: "DAAD In-Region Postgraduate Scholarships",
          deadline: "16 Oct 2026",
        },
      ],
    };

    const prompt = assembleProgressReviewPrompt(reviewData);
    expect(prompt).toContain("DAAD In-Region Postgraduate Scholarships");

    const reviewText = generateFallbackProgressReview(reviewData);
    const validated = validateProgressReviewWordCount(reviewText, 180);

    expect(validated.valid).toBe(true);
    expect(validated.wordCount).toBeLessThanOrEqual(180);
    expect(reviewText).not.toMatch(/%|probability|chance of acceptance|guaranteed/i);
    expect(reviewText).toContain("DAAD In-Region Postgraduate Scholarships");
    expect(reviewText).toContain("English language");
  });

  it("5. Triggers 7-day and 1-day deadline reminder stages accurately", () => {
    // 7 days away
    expect(
      checkDeadlineReminderStage("2026-10-22T10:00:00Z", mockNow)
    ).toBe("7_days");

    // 1 day away
    expect(
      checkDeadlineReminderStage("2026-10-16T10:00:00Z", mockNow)
    ).toBe("1_day");

    // 15 days away -> null
    expect(
      checkDeadlineReminderStage("2026-10-30T10:00:00Z", mockNow)
    ).toBeNull();
  });

  it("6. Runs deadline reminders routine cleanly without throwing errors", async () => {
    const result = await runDeadlineReminders(mockNow);
    expect(result.checkedApplications).toBeGreaterThanOrEqual(1);
    expect(result.errors).toHaveLength(0);
  });

  it("7. Runs weekly digest routine cleanly without throwing errors", async () => {
    const result = await runWeeklyDigest(mockNow);
    expect(result.studentsProcessed).toBeGreaterThanOrEqual(1);
    expect(result.errors).toHaveLength(0);
  });
});
