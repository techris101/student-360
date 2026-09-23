import { describe, it, expect, beforeEach } from "vitest";
import {
  buildCompactProfile,
  buildApplicationsContext,
  buildMatchedOpportunitiesContext,
  assembleAdvisorSystemPrompt,
} from "./advisor-context";
import {
  searchOpportunities,
  getOpportunityDetails,
} from "./advisor-tools";
import {
  checkDailyUsage,
  incrementDailyUsage,
  getKigaliDateString,
  _resetFallbackUsageForTesting,
} from "./rate-limit";
import { SEED_OPPORTUNITIES } from "@/lib/data/opportunities";
import type { StudentProfileData } from "@/lib/eligibility/types";

describe("AI Advisor Context & Engine", () => {
  const profile: StudentProfileData = {
    full_name: "Jean Mugisha",
    nationality: "Rwanda",
    level: "bachelor",
    year_of_study: 3,
    gpa: 3.65,
    gpa_scale: 4.0,
    fields: ["Computer Science", "Information Technology", "STEM"],
    interests: ["Software Engineering", "Artificial Intelligence"],
    languages: [
      { language: "English", level: "fluent", test: "IELTS", score: 7.5 },
      { language: "Kinyarwanda", level: "native" },
    ],
    experience: [
      {
        role: "Software Engineering Intern",
        organisation: "Irembo",
        start: "2024-06",
        end: "2024-09",
      },
    ],
  };

  const applications = [
    {
      opportunity_id: "opp-001",
      title: "Government of Rwanda Bilateral Higher Education Scholarships",
      organisation: "Higher Education Council (HEC)",
      status: "applying",
      deadline: "2026-10-31",
    },
  ];

  const today = "2026-09-23";

  it("builds compact profile under 600 tokens with gaps identified", () => {
    const compact = buildCompactProfile(profile);
    const parsed = JSON.parse(compact);

    expect(parsed.first_name).toBe("Jean");
    expect(parsed.gpa).toBe("3.65 / 4");
    expect(parsed.level).toBe("bachelor");
    expect(compact.length).toBeLessThan(1500); // Well under 600 tokens
  });

  it("builds applications context with opportunity IDs and status", () => {
    const appCtx = buildApplicationsContext(applications);
    const parsed = JSON.parse(appCtx);

    expect(parsed.length).toBe(1);
    expect(parsed[0].id).toBe("opp-001");
    expect(parsed[0].status).toBe("applying");
  });

  it("builds top matched opportunities with eligibility summaries", () => {
    const matched = buildMatchedOpportunitiesContext(
      profile,
      SEED_OPPORTUNITIES,
      today
    );
    const parsed = JSON.parse(matched);

    expect(parsed.length).toBeLessThanOrEqual(15);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0].id).toBeDefined();
    expect(parsed[0].eligibility).toBeDefined();
  });

  it("assembles system prompt replacing all variables without residue", () => {
    const prompt = assembleAdvisorSystemPrompt({
      profile,
      applications,
      allOpportunities: SEED_OPPORTUNITIES,
      today,
    });

    expect(prompt).toContain(today);
    expect(prompt).not.toContain("{{today}}");
    expect(prompt).not.toContain("{{student_profile}}");
    expect(prompt).not.toContain("{{applications}}");
    expect(prompt).not.toContain("{{matched_opportunities}}");
    expect(prompt).toContain("Student 360 Advisor");
  });

  it("executes searchOpportunities with keyword query and filters", () => {
    const result = searchOpportunities(
      {
        query: "scholarship",
        type: "scholarship",
      },
      SEED_OPPORTUNITIES
    );

    expect(result.count).toBeGreaterThan(0);
    expect(result.results[0].type).toBe("scholarship");
    expect(result.results[0].link).toContain("/opportunities/");
  });

  it("retrieves opportunity details and returns live eligibility checks", () => {
    const result = getOpportunityDetails(
      "opp-001",
      profile,
      SEED_OPPORTUNITIES,
      today
    );

    expect(result.id).toBe("opp-001");
    expect(result.eligibility_evaluation).toBeDefined();
    expect(result.eligibility_evaluation?.checks.length).toBeGreaterThan(0);
  });
});

describe("AI Daily Message Cap & Rate Limiter", () => {
  const userId = "test-advisor-user-rate";
  const date = "2026-09-23";

  beforeEach(() => {
    _resetFallbackUsageForTesting();
  });

  it("starts with full remaining count", async () => {
    const status = await checkDailyUsage(userId, date);
    expect(status.count).toBe(0);
    expect(status.remaining).toBe(status.cap);
    expect(status.allowed).toBe(true);
  });

  it("increments usage and decreases remaining count", async () => {
    await incrementDailyUsage(userId, date);
    await incrementDailyUsage(userId, date);

    const status = await checkDailyUsage(userId, date);
    expect(status.count).toBe(2);
    expect(status.remaining).toBe(status.cap - 2);
    expect(status.allowed).toBe(true);
  });

  it("blocks user when daily message cap is reached", async () => {
    for (let i = 0; i < 30; i++) {
      await incrementDailyUsage(userId, date);
    }

    const status = await checkDailyUsage(userId, date);
    expect(status.count).toBe(30);
    expect(status.remaining).toBe(0);
    expect(status.allowed).toBe(false);
  });

  it("calculates Kigali date string correctly", () => {
    const kigaliDate = getKigaliDateString(new Date("2026-09-23T23:30:00Z"));
    // 23:30 UTC + 2 hours = 01:30 next day (2026-09-24)
    expect(kigaliDate).toBe("2026-09-24");
  });
});
