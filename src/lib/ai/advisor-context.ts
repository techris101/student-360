import { ADVISOR_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { StudentProfileData } from "@/lib/eligibility/types";
import { SEED_OPPORTUNITIES, OpportunityItem } from "@/lib/data/opportunities";
import { rankOpportunities } from "@/lib/ranking/rank";

export interface ApplicationContextItem {
  opportunity_id: string;
  title: string;
  organisation: string;
  status: string;
  deadline: string | null;
}

export interface AdvisorContextOptions {
  profile: StudentProfileData;
  applications?: ApplicationContextItem[];
  allOpportunities?: OpportunityItem[];
  today?: string;
}

/**
 * Builds the compact student profile JSON under 600 tokens
 */
export function buildCompactProfile(profile: StudentProfileData): string {
  const gaps: string[] = [];
  if (!profile.gpa) gaps.push("GPA missing");
  const hasLangTest = profile.languages?.some((l) => Boolean(l.test));
  if (!hasLangTest) gaps.push("No English test recorded");
  if (!profile.experience || profile.experience.length === 0) {
    gaps.push("No work experience added");
  }

  const compact = {
    first_name: profile.full_name?.split(" ")[0] || "Student",
    university: "University of Rwanda",
    programme: profile.fields?.[0] || "Undergraduate degree",
    level: profile.level || "bachelor",
    year: profile.year_of_study || 3,
    gpa: profile.gpa
      ? `${profile.gpa} / ${profile.gpa_scale || 4.0}`
      : "Not provided",
    fields: profile.fields || [],
    interests: profile.interests || [],
    languages: profile.languages?.map((l) => ({
      lang: l.language,
      level: l.level,
      test: l.test,
      score: l.score,
    })) || [],
    experience_summary: profile.experience
      ?.map((e) => `${e.role} at ${e.organisation}`)
      .join("; ") || "None listed",
    profile_gaps: gaps,
  };

  return JSON.stringify(compact, null, 2);
}

/**
 * Builds the compact applications JSON
 */
export function buildApplicationsContext(
  applications: ApplicationContextItem[] = []
): string {
  if (applications.length === 0) {
    return "[] (No tracked applications yet)";
  }

  return JSON.stringify(
    applications.map((app) => ({
      id: app.opportunity_id,
      title: app.title,
      organisation: app.organisation,
      status: app.status,
      deadline: app.deadline || "Rolling",
    })),
    null,
    2
  );
}

/**
 * Builds the top 15 matched opportunities context
 */
export function buildMatchedOpportunitiesContext(
  profile: StudentProfileData,
  opportunities: OpportunityItem[] = SEED_OPPORTUNITIES,
  today: string
): string {
  const ranked = rankOpportunities(opportunities, profile, {
    showNotEligible: false,
    today,
  }).slice(0, 15);

  const matched = ranked.map(({ opportunity, evaluation }) => {
    let eligibilitySummary = "Eligible";
    if (evaluation.unknown > 0) {
      eligibilitySummary = `${evaluation.met} of ${evaluation.total} met (${evaluation.unknown} to verify)`;
    } else if (evaluation.notMet > 0) {
      eligibilitySummary = `${evaluation.met} of ${evaluation.total} met`;
    }

    return {
      id: opportunity.id,
      title: opportunity.title,
      organisation: opportunity.organisation,
      type: opportunity.type,
      deadline: opportunity.deadline_rolling
        ? "Rolling"
        : opportunity.deadline || "Unknown",
      funding: opportunity.funding,
      eligibility: eligibilitySummary,
    };
  });

  return JSON.stringify(matched, null, 2);
}

/**
 * Assembles the full Advisor system prompt with all dynamic data variables
 */
export function assembleAdvisorSystemPrompt(options: AdvisorContextOptions): string {
  const today = options.today || new Date().toISOString().slice(0, 10);
  const compactProfile = buildCompactProfile(options.profile);
  const applicationsJson = buildApplicationsContext(options.applications);
  const matchedJson = buildMatchedOpportunitiesContext(
    options.profile,
    options.allOpportunities || SEED_OPPORTUNITIES,
    today
  );

  return ADVISOR_SYSTEM_PROMPT
    .replace("{{today}}", today)
    .replace("{{student_profile}}", compactProfile)
    .replace("{{applications}}", applicationsJson)
    .replace("{{matched_opportunities}}", matchedJson);
}
