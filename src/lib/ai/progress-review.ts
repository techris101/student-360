import { generateText } from "ai";
import { modelSmart } from "@/lib/ai/client";
import { PROGRESS_REVIEW_PROMPT } from "@/lib/ai/prompts";
import {
  validateProgressReviewWordCount,
  type ApplicationCounts,
} from "@/lib/progress/progress";

export interface ProgressReviewData {
  stats: ApplicationCounts;
  applications: Array<{
    title: string;
    organisation: string;
    status: string;
    deadline: string | null;
  }>;
  profileGaps: string[];
  upcomingDeadlines: Array<{
    title: string;
    deadline: string;
  }>;
}

export function assembleProgressReviewPrompt(data: ProgressReviewData): string {
  const statsStr = JSON.stringify(data.stats);
  const appsStr = JSON.stringify(
    data.applications.slice(0, 10).map((a) => ({
      title: a.title,
      org: a.organisation,
      status: a.status,
      deadline: a.deadline,
    }))
  );
  const gapsStr =
    data.profileGaps.length > 0 ? data.profileGaps.join(", ") : "None reported";
  const deadlinesStr =
    data.upcomingDeadlines.length > 0
      ? data.upcomingDeadlines
          .slice(0, 5)
          .map((d) => `${d.title}: ${d.deadline}`)
          .join("; ")
      : "No impending deadlines within 30 days";

  return PROGRESS_REVIEW_PROMPT.replace("{{stats}}", `Stats: ${statsStr}`)
    .replace("{{applications}}", `Applications: ${appsStr}`)
    .replace("{{profile_gaps}}", `Profile gaps: ${gapsStr}`)
    .replace("{{upcoming_deadlines}}", `Upcoming deadlines: ${deadlinesStr}`);
}

/**
 * Fallback honest review generator when AI API key is not present or offline.
 * Respects Prompt 5 rules: max 180 words, plain English, honest, up to 3 next actions.
 */
export function generateFallbackProgressReview(data: ProgressReviewData): string {
  const { stats, applications, profileGaps, upcomingDeadlines } = data;

  const lines: string[] = [];

  // 1. Where they stand
  if (stats.total === 0) {
    lines.push(
      "You have not saved or applied to any opportunities yet, which leaves your pipeline empty."
    );
  } else if (stats.saved > 0 && stats.applied === 0) {
    lines.push(
      `You have saved ${stats.saved} ${
        stats.saved === 1 ? "opportunity" : "opportunities"
      } but have not yet submitted or marked any as applying.`
    );
  } else if (stats.applied > 0) {
    lines.push(
      `You have ${stats.applied} active application${
        stats.applied === 1 ? "" : "s"
      } in progress across ${stats.total} total tracked opportunities.`
    );
  } else {
    lines.push(
      `You have tracked ${stats.total} opportunities on your progress board.`
    );
  }

  // 2. Next actions
  const actions: string[] = [];

  if (upcomingDeadlines.length > 0) {
    const nextOpp = upcomingDeadlines[0];
    actions.push(
      `Prioritise ${nextOpp.title} which closes on ${nextOpp.deadline}; submit all required documents before the final 48 hours.`
    );
  } else if (stats.saved > 0) {
    const firstSaved = applications.find((a) => a.status === "saved");
    if (firstSaved) {
      actions.push(
        `Review the requirement checklist for ${firstSaved.title} and decide whether to apply or archive it.`
      );
    }
  } else {
    actions.push(
      "Browse the opportunities feed, check your eligibility against verified scholarships, and save at least two fitting programmes."
    );
  }

  if (profileGaps.length > 0) {
    actions.push(
      `Resolve your profile gap (${profileGaps[0]}) in your profile settings so eligibility checks can accurately evaluate your fit.`
    );
  }

  if (actions.length < 3 && stats.total > 0 && stats.applied > 0) {
    actions.push(
      "Join the cohort discussion for your active applications to compare preparation notes with fellow Rwandan applicants."
    );
  }

  lines.push(...actions.slice(0, 3));

  const text = lines.join(" ");
  return validateProgressReviewWordCount(text, 180).text;
}

/**
 * Generates an honest progress review using Google Gemini AI SDK.
 */
export async function generateProgressReview(
  data: ProgressReviewData
): Promise<string> {
  const prompt = assembleProgressReviewPrompt(data);

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return generateFallbackProgressReview(data);
  }

  try {
    const response = await generateText({
      model: modelSmart,
      prompt,
      temperature: 0.2,
    });

    const validated = validateProgressReviewWordCount(response.text, 180);
    return validated.text;
  } catch (err: unknown) {
    console.warn("AI review generation failed, using fallback:", err);
    return generateFallbackProgressReview(data);
  }
}
