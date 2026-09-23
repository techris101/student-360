import { describe, it, expect } from "vitest";
import { evaluate, calculateAge, calculateExperienceYears } from "./evaluate";
import type { StudentProfileData, OpportunityEligibilityRule } from "./types";

describe("Eligibility Evaluation Engine", () => {
  const baseProfile: StudentProfileData = {
    id: "student-1",
    full_name: "Keza Aline",
    nationality: "Rwandan",
    level: "bachelor",
    year_of_study: 3,
    gpa: 3.5,
    gpa_scale: 4.0,
    date_of_birth: "2003-05-14",
    gender: "female",
    fields: ["Computer Science", "Information Technology"],
    languages: [
      { language: "English", level: "Fluent", test: "IELTS", score: 7.0 },
      { language: "French", level: "Intermediate" },
    ],
    experience: [
      {
        role: "Software Developer Intern",
        organisation: "BK Tech House",
        start: "2024-01-01",
        end: "2025-06-30",
        summary: "Full stack web development",
      },
      {
        role: "Teaching Assistant",
        organisation: "University of Rwanda",
        start: "2025-07-01",
        end: "2026-06-30",
      },
    ],
  };

  const today = "2026-09-23";

  // --- 1 to 5: Nationality & Rwandan eligibility ---
  it("1. passes when Rwandans are explicitly eligible", () => {
    const rule: OpportunityEligibilityRule = { rwandans_eligible: true };
    const res = evaluate(baseProfile, rule, today);
    expect(res.checks[0].status).toBe("met");
    expect(res.hardFail).toBe(false);
  });

  it("2. hardFails when Rwandans are explicitly excluded", () => {
    const rule: OpportunityEligibilityRule = { rwandans_eligible: false };
    const res = evaluate(baseProfile, rule, today);
    expect(res.checks[0].status).toBe("not_met");
    expect(res.hardFail).toBe(true);
    expect(res.overallStatus).toBe("not_eligible");
  });

  it("3. passes when student nationality is in the allowed list", () => {
    const rule: OpportunityEligibilityRule = {
      nationalities: ["Rwandan", "Kenyan", "Ugandan"],
    };
    const res = evaluate(baseProfile, rule, today);
    expect(res.checks[0].status).toBe("met");
    expect(res.hardFail).toBe(false);
  });

  it("4. hardFails when student nationality is excluded from nationality list", () => {
    const rule: OpportunityEligibilityRule = {
      nationalities: ["Nigerian", "Ghanaian"],
    };
    const res = evaluate(baseProfile, rule, today);
    expect(res.checks[0].status).toBe("not_met");
    expect(res.hardFail).toBe(true);
  });

  it("5. returns unknown when profile nationality is missing", () => {
    const profileNoNat = { ...baseProfile, nationality: null };
    const rule: OpportunityEligibilityRule = { rwandans_eligible: true };
    const res = evaluate(profileNoNat, rule, today);
    expect(res.checks[0].status).toBe("unknown");
    expect(res.checks[0].hint).toContain("Add your nationality");
  });

  // --- 6 to 8: Degree level ---
  it("6. passes when degree level matches", () => {
    const rule: OpportunityEligibilityRule = { levels: ["bachelor", "master"] };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "level");
    expect(check?.status).toBe("met");
    expect(res.hardFail).toBe(false);
  });

  it("7. hardFails when degree level is not met", () => {
    const rule: OpportunityEligibilityRule = { levels: ["phd"] };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "level");
    expect(check?.status).toBe("not_met");
    expect(res.hardFail).toBe(true);
  });

  it("8. returns unknown when profile degree level is missing", () => {
    const profileNoLevel = { ...baseProfile, level: null };
    const rule: OpportunityEligibilityRule = { levels: ["master"] };
    const res = evaluate(profileNoLevel, rule, today);
    const check = res.checks.find((c) => c.rule === "level");
    expect(check?.status).toBe("unknown");
  });

  // --- 9 to 11: Year of study ---
  it("9. passes when year of study matches", () => {
    const rule: OpportunityEligibilityRule = { years_of_study: [2, 3, 4] };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "year_of_study");
    expect(check?.status).toBe("met");
  });

  it("10. marks not_met when year of study does not match", () => {
    const rule: OpportunityEligibilityRule = { years_of_study: [4, 5] };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "year_of_study");
    expect(check?.status).toBe("not_met");
    expect(res.hardFail).toBe(false); // soft rule
  });

  it("11. returns unknown when year of study is missing", () => {
    const profileNoYear = { ...baseProfile, year_of_study: null };
    const rule: OpportunityEligibilityRule = { years_of_study: [3] };
    const res = evaluate(profileNoYear, rule, today);
    const check = res.checks.find((c) => c.rule === "year_of_study");
    expect(check?.status).toBe("unknown");
  });

  // --- 12 to 15: Field of study ---
  it("12. passes when student field of study matches opportunity field", () => {
    const rule: OpportunityEligibilityRule = {
      fields: ["Computer Science", "Information Systems"],
    };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "field");
    expect(check?.status).toBe("met");
  });

  it("13. marks not_met when student field of study does not match", () => {
    const rule: OpportunityEligibilityRule = {
      fields: ["Law", "Public Policy"],
    };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "field");
    expect(check?.status).toBe("not_met");
  });

  it("14. passes any profile when opportunity is open to all fields", () => {
    const rule: OpportunityEligibilityRule = { fields: ["All fields"] };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "field");
    expect(check?.status).toBe("met");
  });

  it("15. returns unknown when profile fields are missing", () => {
    const profileNoFields = { ...baseProfile, fields: [] };
    const rule: OpportunityEligibilityRule = { fields: ["Engineering"] };
    const res = evaluate(profileNoFields, rule, today);
    const check = res.checks.find((c) => c.rule === "field");
    expect(check?.status).toBe("unknown");
  });

  // --- 16 to 19: GPA and scale conversion ---
  it("16. passes when GPA on the same scale satisfies minimum requirement", () => {
    const rule: OpportunityEligibilityRule = {
      min_gpa: { value: 3.3, scale: 4.0 },
    };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "gpa");
    expect(check?.status).toBe("met");
  });

  it("17. converts GPA scales linearly: 16/20 meets 3.0/4.0", () => {
    const profileFrenchScale = {
      ...baseProfile,
      gpa: 16,
      gpa_scale: 20,
    };
    const rule: OpportunityEligibilityRule = {
      min_gpa: { value: 3.0, scale: 4.0 },
    };
    const res = evaluate(profileFrenchScale, rule, today);
    const check = res.checks.find((c) => c.rule === "gpa");
    expect(check?.status).toBe("met"); // 16/20 * 4 = 3.2 >= 3.0
  });

  it("18. fails when GPA scale conversion falls below minimum", () => {
    const profileFrenchScale = {
      ...baseProfile,
      gpa: 14,
      gpa_scale: 20,
    };
    const rule: OpportunityEligibilityRule = {
      min_gpa: { value: 3.2, scale: 4.0 },
    };
    const res = evaluate(profileFrenchScale, rule, today);
    const check = res.checks.find((c) => c.rule === "gpa");
    expect(check?.status).toBe("not_met"); // 14/20 * 4 = 2.8 < 3.2
  });

  it("19. returns unknown when profile GPA or GPA scale is missing", () => {
    const profileNoGpa = { ...baseProfile, gpa: null, gpa_scale: null };
    const rule: OpportunityEligibilityRule = {
      min_gpa: { value: 3.5, scale: 4.0 },
    };
    const res = evaluate(profileNoGpa, rule, today);
    const check = res.checks.find((c) => c.rule === "gpa");
    expect(check?.status).toBe("unknown");
  });

  // --- 20 to 22: Age constraints ---
  it("20. passes when student age is below maximum age limit", () => {
    const rule: OpportunityEligibilityRule = { max_age: 26 };
    // Born 2003-05-14, age on 2026-09-23 is 23
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "age");
    expect(check?.status).toBe("met");
    expect(res.hardFail).toBe(false);
  });

  it("21. hardFails when student exceeds maximum age limit", () => {
    const rule: OpportunityEligibilityRule = { max_age: 21 };
    // Age 23 > 21
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "age");
    expect(check?.status).toBe("not_met");
    expect(res.hardFail).toBe(true);
  });

  it("22. calculates age relative to age_on parameter when specified", () => {
    const rule: OpportunityEligibilityRule = {
      max_age: 23,
      age_on: "2027-01-01",
    };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "age");
    expect(check?.status).toBe("met"); // 23 on 2027-01-01
  });

  // --- 23 to 24: Gender requirements ---
  it("23. passes when gender requirement matches", () => {
    const rule: OpportunityEligibilityRule = { gender: "female" };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "gender");
    expect(check?.status).toBe("met");
    expect(res.hardFail).toBe(false);
  });

  it("24. hardFails when gender does not match", () => {
    const rule: OpportunityEligibilityRule = { gender: "male" };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "gender");
    expect(check?.status).toBe("not_met");
    expect(res.hardFail).toBe(true);
  });

  // --- 25 to 26: Language tests ---
  it("25. passes when student test score meets or exceeds minimum score", () => {
    const rule: OpportunityEligibilityRule = {
      language_tests: [{ test: "IELTS", min_score: 6.5 }],
    };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "language");
    expect(check?.status).toBe("met"); // 7.0 >= 6.5
  });

  it("26. marks not_met when test score is below required score", () => {
    const rule: OpportunityEligibilityRule = {
      language_tests: [{ test: "IELTS", min_score: 7.5 }],
    };
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "language");
    expect(check?.status).toBe("not_met"); // 7.0 < 7.5
  });

  // --- 27 to 28: Work experience & other items ---
  it("27. passes when accumulated work experience meets required threshold", () => {
    const rule: OpportunityEligibilityRule = { work_experience_years: 2 };
    // Profile has 18 months + 12 months = 30 months = 2.5 years >= 2 years
    const res = evaluate(baseProfile, rule, today);
    const check = res.checks.find((c) => c.rule === "work_experience");
    expect(check?.status).toBe("met");
  });

  it("28. returns unknown for other manual requirements with check hint", () => {
    const rule: OpportunityEligibilityRule = {
      other: ["Must submit 3 recommendation letters", "Valid passport"],
    };
    const res = evaluate(baseProfile, rule, today);
    const otherChecks = res.checks.filter((c) => c.rule === "other");
    expect(otherChecks.length).toBe(2);
    expect(otherChecks[0].status).toBe("unknown");
    expect(otherChecks[0].hint).toBe("Check on the official page");
  });

  it("29. correctly calculates student age on specified reference date", () => {
    const age = calculateAge("2003-05-15", "2026-05-15");
    expect(age).toBe(23);
    const ageBeforeBday = calculateAge("2003-05-15", "2026-05-14");
    expect(ageBeforeBday).toBe(22);
  });

  it("30. correctly calculates accumulated experience in fractional years", () => {
    const years = calculateExperienceYears(baseProfile.experience);
    expect(years).toBeGreaterThanOrEqual(2.0);
  });
});
