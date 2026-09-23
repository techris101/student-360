import type {
  Check,
  EvaluationResult,
  OpportunityEligibilityRule,
  StudentProfileData,
} from "./types";

/**
 * Calculates a person's age in years on a specific target date
 */
export function calculateAge(dobIso: string, targetDateIso: string): number {
  const birth = new Date(dobIso);
  const target = new Date(targetDateIso);

  let age = target.getFullYear() - birth.getFullYear();
  const monthDiff = target.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculates total cumulative work experience in years from experience history
 */
export function calculateExperienceYears(
  experience?: StudentProfileData["experience"]
): number {
  if (!experience || experience.length === 0) return 0;

  let totalMonths = 0;

  for (const exp of experience) {
    if (!exp.start) continue;
    const start = new Date(exp.start);
    const end = exp.end ? new Date(exp.end) : new Date();

    const diffMonths =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    if (diffMonths > 0) {
      totalMonths += diffMonths;
    }
  }

  return Math.round((totalMonths / 12) * 10) / 10;
}

/**
 * Pure evaluation function assessing a student profile against opportunity requirements
 */
export function evaluate(
  profile: StudentProfileData | null,
  eligibility: OpportunityEligibilityRule | null | undefined,
  today: string
): EvaluationResult {
  const checks: Check[] = [];

  if (!eligibility) {
    return {
      checks: [],
      met: 0,
      notMet: 0,
      unknown: 0,
      total: 0,
      hardFail: false,
      overallStatus: "eligible",
    };
  }

  // 1. Nationality / Rwandans Eligible (Hard Rule)
  if (eligibility.rwandans_eligible !== undefined && eligibility.rwandans_eligible !== null) {
    if (eligibility.rwandans_eligible === false) {
      const isRwandan = !profile?.nationality || profile.nationality.toLowerCase().includes("rwand");
      checks.push({
        rule: "nationality",
        status: isRwandan ? "not_met" : "unknown",
        label: "Not open to Rwandan nationals",
        hint: "This opportunity excludes Rwandan citizens",
        isHardRule: true,
      });
    } else {
      const isRwandan = profile?.nationality?.toLowerCase().includes("rwand");
      if (!profile?.nationality) {
        checks.push({
          rule: "nationality",
          status: "unknown",
          label: "Open to Rwandan nationals",
          hint: "Add your nationality to verify",
          isHardRule: true,
        });
      } else if (isRwandan) {
        checks.push({
          rule: "nationality",
          status: "met",
          label: "Open to Rwandan nationals",
          isHardRule: true,
        });
      } else {
        checks.push({
          rule: "nationality",
          status: "not_met",
          label: "Open to Rwandan nationals",
          hint: `Your nationality is ${profile.nationality}`,
          isHardRule: true,
        });
      }
    }
  } else if (eligibility.nationalities && eligibility.nationalities.length > 0) {
    if (!profile?.nationality) {
      checks.push({
        rule: "nationality",
        status: "unknown",
        label: `Eligible nationalities: ${eligibility.nationalities.slice(0, 3).join(", ")}`,
        hint: "Add your nationality to check",
        isHardRule: true,
      });
    } else {
      const userNat = profile.nationality.toLowerCase().trim();
      const isMatch = eligibility.nationalities.some((n) => {
        const lower = n.toLowerCase().trim();
        return (
          lower === "all" ||
          lower.includes("all nationalities") ||
          lower.includes("africa") ||
          lower.includes(userNat) ||
          userNat.includes(lower)
        );
      });

      if (isMatch) {
        checks.push({
          rule: "nationality",
          status: "met",
          label: `Open to your nationality (${profile.nationality})`,
          isHardRule: true,
        });
      } else {
        checks.push({
          rule: "nationality",
          status: "not_met",
          label: `Restricted to ${eligibility.nationalities.join(", ")}`,
          hint: `Your profile nationality is ${profile.nationality}`,
          isHardRule: true,
        });
      }
    }
  }

  // 2. Degree Level (Hard Rule)
  if (eligibility.levels && eligibility.levels.length > 0) {
    if (!profile?.level) {
      checks.push({
        rule: "level",
        status: "unknown",
        label: `Degree level: ${eligibility.levels.join(", ")}`,
        hint: "Add your study level to check",
        isHardRule: true,
      });
    } else {
      const userLevel = profile.level.toLowerCase().trim();
      const isMatch = eligibility.levels.some(
        (l) => l.toLowerCase().trim() === userLevel
      );

      if (isMatch) {
        checks.push({
          rule: "level",
          status: "met",
          label: `${profile.level.charAt(0).toUpperCase() + profile.level.slice(1)} students eligible`,
          isHardRule: true,
        });
      } else {
        checks.push({
          rule: "level",
          status: "not_met",
          label: `Requires ${eligibility.levels.join(" or ")} level`,
          hint: `Your profile degree level is ${profile.level}`,
          isHardRule: true,
        });
      }
    }
  }

  // 3. Year of Study (Soft Rule)
  if (eligibility.years_of_study && eligibility.years_of_study.length > 0) {
    if (profile?.year_of_study === undefined || profile?.year_of_study === null) {
      checks.push({
        rule: "year_of_study",
        status: "unknown",
        label: `Eligible years of study: ${eligibility.years_of_study.join(", ")}`,
        hint: "Add your current year of study to check",
        isHardRule: false,
      });
    } else {
      const isMatch = eligibility.years_of_study.includes(profile.year_of_study);
      if (isMatch) {
        checks.push({
          rule: "year_of_study",
          status: "met",
          label: `Year ${profile.year_of_study} students eligible`,
          isHardRule: false,
        });
      } else {
        checks.push({
          rule: "year_of_study",
          status: "not_met",
          label: `Requires year ${eligibility.years_of_study.join(" or ")}`,
          hint: `You are in year ${profile.year_of_study}`,
          isHardRule: false,
        });
      }
    }
  }

  // 4. Field of Study / Discipline (Soft Rule)
  if (eligibility.fields && eligibility.fields.length > 0) {
    const oppFields = eligibility.fields.map((f) => f.toLowerCase().trim());
    const isAllFields = oppFields.some(
      (f) => f === "all" || f === "all fields" || f === "all disciplines"
    );

    if (isAllFields) {
      checks.push({
        rule: "field",
        status: "met",
        label: "Open to all academic fields",
        isHardRule: false,
      });
    } else if (!profile?.fields || profile.fields.length === 0) {
      checks.push({
        rule: "field",
        status: "unknown",
        label: `Fields: ${eligibility.fields.slice(0, 3).join(", ")}`,
        hint: "Add your study fields to check",
        isHardRule: false,
      });
    } else {
      const userFields = profile.fields.map((f) => f.toLowerCase().trim());
      const matchedField = userFields.find((uf) =>
        oppFields.some(
          (of) => of.includes(uf) || uf.includes(of)
        )
      );

      if (matchedField) {
        checks.push({
          rule: "field",
          status: "met",
          label: `Field match: ${matchedField}`,
          isHardRule: false,
        });
      } else {
        checks.push({
          rule: "field",
          status: "not_met",
          label: `Fields: ${eligibility.fields.join(", ")}`,
          hint: `Your field is ${profile.fields.join(", ")}`,
          isHardRule: false,
        });
      }
    }
  }

  // 5. Minimum GPA (Soft Rule)
  if (eligibility.min_gpa) {
    const reqGpa = eligibility.min_gpa.value;
    const reqScale = eligibility.min_gpa.scale;

    if (
      profile?.gpa === undefined ||
      profile?.gpa === null ||
      profile?.gpa_scale === undefined ||
      profile?.gpa_scale === null
    ) {
      checks.push({
        rule: "gpa",
        status: "unknown",
        label: `Minimum GPA ${reqGpa}/${reqScale}`,
        hint: "Add your GPA and scale to check",
        isHardRule: false,
      });
    } else {
      // Linear conversion between known scales
      const normalizedUserGpa =
        profile.gpa_scale === reqScale
          ? profile.gpa
          : (profile.gpa / profile.gpa_scale) * reqScale;

      const roundedNorm = Math.round(normalizedUserGpa * 100) / 100;

      if (roundedNorm >= reqGpa) {
        checks.push({
          rule: "gpa",
          status: "met",
          label: `Minimum GPA ${reqGpa}/${reqScale}`,
          hint: `Yours is ${profile.gpa}/${profile.gpa_scale}`,
          isHardRule: false,
        });
      } else {
        checks.push({
          rule: "gpa",
          status: "not_met",
          label: `Minimum GPA ${reqGpa}/${reqScale}`,
          hint: `Yours is ${profile.gpa}/${profile.gpa_scale}`,
          isHardRule: false,
        });
      }
    }
  }

  // 6. Maximum Age (Hard Rule)
  if (eligibility.max_age !== undefined && eligibility.max_age !== null) {
    const targetDate = eligibility.age_on || today;

    if (!profile?.date_of_birth) {
      checks.push({
        rule: "age",
        status: "unknown",
        label: `Maximum age: ${eligibility.max_age} years`,
        hint: "Add your date of birth to check",
        isHardRule: true,
      });
    } else {
      const studentAge = calculateAge(profile.date_of_birth, targetDate);

      if (studentAge <= eligibility.max_age) {
        checks.push({
          rule: "age",
          status: "met",
          label: `Age requirement met (${studentAge} years old, max ${eligibility.max_age})`,
          isHardRule: true,
        });
      } else {
        checks.push({
          rule: "age",
          status: "not_met",
          label: `Maximum age is ${eligibility.max_age} years`,
          hint: `You are ${studentAge} years old on ${targetDate}`,
          isHardRule: true,
        });
      }
    }
  }

  // 7. Gender (Hard Rule)
  if (eligibility.gender) {
    if (!profile?.gender) {
      checks.push({
        rule: "gender",
        status: "unknown",
        label: `Dedicated to ${eligibility.gender} applicants`,
        hint: "Specify your gender to check",
        isHardRule: true,
      });
    } else {
      const isMatch = profile.gender.toLowerCase() === eligibility.gender.toLowerCase();
      if (isMatch) {
        checks.push({
          rule: "gender",
          status: "met",
          label: `Dedicated to ${eligibility.gender} applicants`,
          isHardRule: true,
        });
      } else {
        checks.push({
          rule: "gender",
          status: "not_met",
          label: `Dedicated to ${eligibility.gender} applicants`,
          hint: `Your profile gender is ${profile.gender}`,
          isHardRule: true,
        });
      }
    }
  }

  // 8. Language Tests (Soft Rule)
  if (eligibility.language_tests && eligibility.language_tests.length > 0) {
    for (const reqTest of eligibility.language_tests) {
      const studentTests = profile?.languages || [];
      const matchedRecord = studentTests.find(
        (l) => l.test && l.test.toLowerCase().includes(reqTest.test.toLowerCase())
      );

      if (!matchedRecord || matchedRecord.score === undefined || matchedRecord.score === null) {
        checks.push({
          rule: "language",
          status: "unknown",
          label: `${reqTest.test} minimum score ${reqTest.min_score}`,
          hint: `Add your ${reqTest.test} test score to check`,
          isHardRule: false,
        });
      } else {
        const studentScore = parseFloat(String(matchedRecord.score));
        const requiredScore = parseFloat(String(reqTest.min_score));

        if (!isNaN(studentScore) && !isNaN(requiredScore)) {
          if (studentScore >= requiredScore) {
            checks.push({
              rule: "language",
              status: "met",
              label: `${reqTest.test} ${reqTest.min_score}`,
              hint: `You scored ${studentScore}`,
              isHardRule: false,
            });
          } else {
            checks.push({
              rule: "language",
              status: "not_met",
              label: `${reqTest.test} minimum score ${reqTest.min_score}`,
              hint: `Your score is ${studentScore}`,
              isHardRule: false,
            });
          }
        } else {
          checks.push({
            rule: "language",
            status: "unknown",
            label: `${reqTest.test} score ${reqTest.min_score}`,
            hint: `Recorded score: ${matchedRecord.score}`,
            isHardRule: false,
          });
        }
      }
    }
  }

  // 9. Work Experience (Soft Rule)
  if (
    eligibility.work_experience_years !== undefined &&
    eligibility.work_experience_years !== null &&
    eligibility.work_experience_years > 0
  ) {
    const requiredYears = eligibility.work_experience_years;
    const userYears = calculateExperienceYears(profile?.experience);

    if (!profile?.experience || profile.experience.length === 0) {
      checks.push({
        rule: "work_experience",
        status: "unknown",
        label: `Requires ${requiredYears} year${requiredYears > 1 ? "s" : ""} work experience`,
        hint: "Add your work experience to check",
        isHardRule: false,
      });
    } else if (userYears >= requiredYears) {
      checks.push({
        rule: "work_experience",
        status: "met",
        label: `${requiredYears} year${requiredYears > 1 ? "s" : ""} work experience`,
        hint: `You have ${userYears} years recorded`,
        isHardRule: false,
      });
    } else {
      checks.push({
        rule: "work_experience",
        status: "not_met",
        label: `Requires ${requiredYears} year${requiredYears > 1 ? "s" : ""} work experience`,
        hint: `You have ${userYears} years recorded`,
        isHardRule: false,
      });
    }
  }

  // 10. Other Items (Always unknown)
  if (eligibility.other && eligibility.other.length > 0) {
    for (const otherItem of eligibility.other) {
      checks.push({
        rule: "other",
        status: "unknown",
        label: otherItem,
        hint: "Check on the official page",
        isHardRule: false,
      });
    }
  }

  const met = checks.filter((c) => c.status === "met").length;
  const notMet = checks.filter((c) => c.status === "not_met").length;
  const unknown = checks.filter((c) => c.status === "unknown").length;
  const total = checks.length;

  const hardFail = checks.some((c) => c.isHardRule && c.status === "not_met");

  let overallStatus: "eligible" | "not_eligible" | "check_requirements" = "eligible";
  if (hardFail || notMet > 0) {
    overallStatus = "not_eligible";
  } else if (unknown > 0 && met < total) {
    overallStatus = "check_requirements";
  } else {
    overallStatus = "eligible";
  }

  return {
    checks,
    met,
    notMet,
    unknown,
    total,
    hardFail,
    overallStatus,
  };
}
