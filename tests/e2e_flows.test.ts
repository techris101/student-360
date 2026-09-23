import { describe, it, expect } from "vitest";
import { evaluate } from "@/lib/eligibility/evaluate";
import { rankOpportunities } from "@/lib/ranking/rank";
import { SEED_OPPORTUNITIES } from "@/lib/data/opportunities";
import { SEED_NEWS } from "@/lib/data/news";
import { filterPublishedNews } from "@/lib/news/news";
import { calculateCohortClosingDate, isCohortClosed } from "@/lib/cohorts/rules";
import { checkCohortRateLimit } from "@/lib/cohorts/rate-limit";
import {
  computeApplicationCounts,
  filterUpcomingDeadlines,
  canRequestProgressReview,
  type ApplicationWithOpportunity,
} from "@/lib/progress/progress";
import { generateFallbackProgressReview } from "@/lib/ai/progress-review";
import type { StudentProfileData } from "@/lib/eligibility/types";

describe("E2E Smoke Verification Suite (All Core Flows)", () => {
  const testStudentProfile: StudentProfileData = {
    full_name: "Aline Uwase",
    nationality: "Rwanda",
    level: "bachelor",
    year_of_study: 3,
    gpa: 3.7,
    gpa_scale: 4.0,
    fields: ["Computer Science", "Information Technology", "STEM"],
    languages: [
      { language: "English", level: "fluent", test: "IELTS", score: 7.0 },
      { language: "Kinyarwanda", level: "native" },
    ],
    experience: [
      {
        role: "Frontend Developer Trainee",
        organisation: "Rwanda Coding Academy",
        start: "2024-01",
        end: "2024-08",
      },
    ],
  };

  it("Flow 1: Deterministic Eligibility & Ranking on Opportunities Feed", () => {
    const opp = SEED_OPPORTUNITIES[0];
    const evalResult = evaluate(testStudentProfile, opp.eligibility, "2026-10-01");

    expect(evalResult).toBeDefined();
    expect(evalResult.total).toBeGreaterThanOrEqual(1);
    expect(evalResult.hardFail).toBe(false);

    // Feed ranking (filters hard fails)
    const ranked = rankOpportunities(SEED_OPPORTUNITIES, testStudentProfile, {
      today: "2026-10-01",
    });
    expect(ranked.length).toBeGreaterThan(50);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[ranked.length - 1].score);
  });

  it("Flow 2: Cohort Rules, Gating & 10 msgs/min Rate Limiting", () => {
    const userId = "test-student-aline";

    // Rate limit test (10 msgs/min)
    const check1 = checkCohortRateLimit(userId, 10, Date.now());
    expect(check1.allowed).toBe(true);

    // Cohort closing check: 30 days post-deadline
    const futureDeadline = "2026-11-30T00:00:00Z";
    const pastDeadline = "2026-08-01T00:00:00Z";
    const testNow = "2026-10-01T00:00:00Z";

    const futureClosesAt = calculateCohortClosingDate(futureDeadline);
    const pastClosesAt = calculateCohortClosingDate(pastDeadline);

    expect(isCohortClosed(futureClosesAt, testNow)).toBe(false);
    expect(isCohortClosed(pastClosesAt, testNow)).toBe(true);
  });

  it("Flow 3: News Feed 30-Day Window & Category Filtering", () => {
    const testNow = "2026-09-23T10:00:00Z";
    const freshNews = filterPublishedNews(SEED_NEWS, { todayIso: testNow });
    expect(freshNews.length).toBeGreaterThanOrEqual(1);

    const fundingNews = filterPublishedNews(SEED_NEWS, {
      category: "funding",
      todayIso: testNow,
    });
    expect(fundingNews.every((n) => n.category === "funding")).toBe(true);
  });

  it("Flow 4: Progress Tracker, Deadlines & Weekly Advisor Review", () => {
    const now = new Date("2026-10-01T10:00:00Z");
    const sampleApps: ApplicationWithOpportunity[] = [
      {
        id: "app-1",
        user_id: "u1",
        opportunity_id: "opp-001",
        status: "applying",
        had_interview: null,
        notes: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        opportunity: {
          id: "opp-001",
          title: "Bilateral Scholarships",
          organisation: "HEC",
          type: "scholarship",
          deadline: "2026-10-15T00:00:00Z",
          deadline_rolling: false,
          funding: "fully_funded",
          location_scope: "rwanda",
          location_text: "Kigali",
          official_url: "https://hec.gov.rw",
        },
      },
    ];

    const counts = computeApplicationCounts(sampleApps);
    expect(counts.saved).toBe(0);
    expect(counts.applied).toBe(1);

    const deadlines = filterUpcomingDeadlines(sampleApps, now);
    expect(deadlines.length).toBe(1);

    // Review cooldown
    const cooldown = canRequestProgressReview(null, now);
    expect(cooldown.allowed).toBe(true);

    const review = generateFallbackProgressReview({
      stats: counts,
      applications: sampleApps.map((a) => ({
        title: a.opportunity.title,
        organisation: a.opportunity.organisation,
        status: a.status,
        deadline: a.opportunity.deadline,
      })),
      profileGaps: [],
      upcomingDeadlines: [
        {
          title: "Bilateral Scholarships",
          deadline: "15 Oct 2026",
        },
      ],
    });

    expect(review).toBeDefined();
    expect(review.length).toBeGreaterThan(20);
    expect(review.split(/\s+/).length).toBeLessThanOrEqual(180);
  });
});
