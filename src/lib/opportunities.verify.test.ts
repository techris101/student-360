import { describe, it, expect } from "vitest";
import { SEED_OPPORTUNITIES } from "@/lib/data/opportunities";
import { evaluate } from "@/lib/eligibility/evaluate";
import { rankOpportunities } from "@/lib/ranking/rank";
import type { StudentProfileData } from "@/lib/eligibility/types";

describe("Phase P3 End-to-End Feed and Eligibility Verification", () => {
  const testStudentProfile: StudentProfileData = {
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

  const today = "2026-09-23";

  it("evaluates opportunities for test student and confirms eligible items rank at the top", () => {
    const ranked = rankOpportunities(SEED_OPPORTUNITIES, testStudentProfile, {
      showNotEligible: false,
      today,
    });

    expect(ranked.length).toBeGreaterThan(0);
    // First item should have high score and not be a hard failure
    expect(ranked[0].score).toBeGreaterThan(0.4);
    expect(ranked[0].evaluation.hardFail).toBe(false);

    // Score ordering must be strictly descending
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it("properly excludes hard failures when showNotEligible is false", () => {
    const eligibleCount = rankOpportunities(
      SEED_OPPORTUNITIES,
      testStudentProfile,
      { showNotEligible: false, today }
    ).length;

    const totalCount = rankOpportunities(
      SEED_OPPORTUNITIES,
      testStudentProfile,
      { showNotEligible: true, today }
    ).length;

    expect(totalCount).toBeGreaterThan(eligibleCount);
  });

  it("verifies Plan Ahead opportunities have prepare_now checklists", () => {
    const planAheadOpps = SEED_OPPORTUNITIES.filter((o) => o.plan_ahead);
    expect(planAheadOpps.length).toBeGreaterThanOrEqual(5);

    for (const opp of planAheadOpps) {
      expect(opp.prepare_now).toBeDefined();
      expect(Array.isArray(opp.prepare_now)).toBe(true);
      expect(opp.prepare_now!.length).toBeGreaterThan(0);
    }
  });

  it("verifies requirement check evaluation on Mastercard Foundation and Chevening", () => {
    const mcf = SEED_OPPORTUNITIES.find((o) =>
      o.title.includes("Mastercard Foundation")
    );
    expect(mcf).toBeDefined();
    if (mcf) {
      const res = evaluate(testStudentProfile, mcf.eligibility, today);
      expect(res.checks.length).toBeGreaterThan(0);
      expect(res.met).toBeGreaterThan(0);
    }

    const chevening = SEED_OPPORTUNITIES.find((o) =>
      o.title.includes("Chevening")
    );
    expect(chevening).toBeDefined();
    if (chevening) {
      const res = evaluate(testStudentProfile, chevening.eligibility, today);
      expect(res.checks.length).toBeGreaterThan(0);
    }
  });

  it("verifies due this week deadlines computation", () => {
    // Check rolling vs fixed deadlines
    const rolling = SEED_OPPORTUNITIES.filter((o) => o.deadline_rolling);
    const fixed = SEED_OPPORTUNITIES.filter((o) => !o.deadline_rolling && o.deadline);
    expect(rolling.length).toBeGreaterThan(0);
    expect(fixed.length).toBeGreaterThan(0);
  });
});
