import { describe, it, expect } from "vitest";
import {
  calculateDeadlineProximity,
  calculateFieldOverlap,
  rankOpportunities,
  scoreOpportunity,
} from "./rank";
import type { StudentProfileData } from "@/lib/eligibility/types";

describe("Opportunity Ranking Engine", () => {
  const profile: StudentProfileData = {
    id: "user-1",
    nationality: "Rwandan",
    level: "bachelor",
    fields: ["Computer Science"],
    interests: ["Artificial Intelligence"],
  };

  const today = "2026-09-23";

  describe("calculateDeadlineProximity", () => {
    it("gives higher scores for deadlines closer within 60 days", () => {
      const closeDeadline = "2026-10-03"; // 10 days away
      const furtherDeadline = "2026-11-12"; // 50 days away

      const scoreClose = calculateDeadlineProximity(closeDeadline, false, today);
      const scoreFurther = calculateDeadlineProximity(furtherDeadline, false, today);

      expect(scoreClose).toBeGreaterThan(scoreFurther);
    });

    it("returns 0.0 for past deadlines", () => {
      const pastDeadline = "2026-09-01";
      expect(calculateDeadlineProximity(pastDeadline, false, today)).toBe(0.0);
    });

    it("returns 0.5 for rolling deadlines", () => {
      expect(calculateDeadlineProximity(null, true, today)).toBe(0.5);
    });
  });

  describe("calculateFieldOverlap", () => {
    it("returns 1.0 when opportunity is open to all fields", () => {
      expect(calculateFieldOverlap(["All fields"], profile)).toBe(1.0);
    });

    it("returns high overlap when student fields match opportunity fields", () => {
      const overlap = calculateFieldOverlap(
        ["Computer Science", "Information Systems"],
        profile
      );
      expect(overlap).toBeGreaterThanOrEqual(0.7);
    });

    it("returns low score when student fields have no match", () => {
      const overlap = calculateFieldOverlap(["Agriculture", "Forestry"], profile);
      expect(overlap).toBeLessThan(0.3);
    });
  });

  describe("rankOpportunities", () => {
    const oppA = {
      id: "opp-high-fit",
      title: "Google AI Fellowship",
      organisation: "Google",
      deadline: "2026-10-15", // 22 days away
      fields: ["Computer Science"],
      eligibility: {
        rwandans_eligible: true,
        levels: ["bachelor"],
      },
    };

    const oppB = {
      id: "opp-low-fit",
      title: "Mining Engineering Grant",
      organisation: "Mining Corp",
      deadline: "2026-12-30",
      fields: ["Mining"],
      eligibility: {
        rwandans_eligible: true,
        levels: ["bachelor"],
      },
    };

    const oppHardFail = {
      id: "opp-hard-fail",
      title: "PhD Medical Research Award",
      organisation: "Health Institute",
      deadline: "2026-10-20",
      fields: ["Medicine"],
      eligibility: {
        rwandans_eligible: true,
        levels: ["phd"], // Profile is bachelor -> hardFail
      },
    };

    it("ranks higher fit and closer deadline ahead of lower fit", () => {
      const results = rankOpportunities([oppB, oppA], profile, { today });
      expect(results[0].opportunity.id).toBe("opp-high-fit");
      expect(results[1].opportunity.id).toBe("opp-low-fit");
    });

    it("excludes hard failures by default", () => {
      const results = rankOpportunities([oppA, oppHardFail], profile, { today });
      expect(results.length).toBe(1);
      expect(results[0].opportunity.id).toBe("opp-high-fit");
    });

    it("includes hard failures at bottom when showNotEligible is true", () => {
      const results = rankOpportunities([oppA, oppHardFail], profile, {
        today,
        showNotEligible: true,
      });
      expect(results.length).toBe(2);
      expect(results[1].opportunity.id).toBe("opp-hard-fail");
      expect(results[1].evaluation.hardFail).toBe(true);
    });

    it("calculates individual deterministic scores with scoreOpportunity", () => {
      const evaluation = {
        checks: [],
        met: 3,
        notMet: 0,
        unknown: 0,
        total: 3,
        hardFail: false,
        overallStatus: "eligible" as const,
      };
      const scoreData = scoreOpportunity(evaluation, oppA, profile, today);
      expect(scoreData.score).toBeGreaterThan(0.5);
      expect(scoreData.eligibilityRatio).toBe(1.0);
    });
  });
});
