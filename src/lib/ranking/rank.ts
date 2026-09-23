import type {
  EvaluationResult,
  StudentProfileData,
  OpportunityEligibilityRule,
} from "@/lib/eligibility/types";
import { evaluate } from "@/lib/eligibility/evaluate";

export interface RankableOpportunity {
  id: string;
  title: string;
  organisation: string;
  deadline: string | null;
  deadline_rolling?: boolean;
  fields?: string[];
  eligibility?: OpportunityEligibilityRule | null;
}

export interface RankedOpportunity<T extends RankableOpportunity = RankableOpportunity> {
  opportunity: T;
  evaluation: EvaluationResult;
  score: number;
  eligibilityRatio: number;
  fieldOverlap: number;
  deadlineProximity: number;
}

export interface RankingOptions {
  today?: string;
  showNotEligible?: boolean;
}

/**
 * Calculates deadline proximity score between 0.0 and 1.0
 * Closer deadlines within 60 days score higher; past deadlines score 0.0
 */
export function calculateDeadlineProximity(
  deadline: string | null,
  rolling: boolean | undefined,
  today: string
): number {
  if (rolling || !deadline) {
    return 0.5; // neutral score for rolling deadlines
  }

  const deadlineTime = new Date(`${deadline}T23:59:59Z`).getTime();
  const todayTime = new Date(`${today}T00:00:00Z`).getTime();

  const diffDays = Math.ceil((deadlineTime - todayTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 0.0; // Past deadline
  }

  if (diffDays <= 60) {
    // Closer deadlines within 60 days score higher (e.g. 1 day = ~0.98, 60 days = 0.0)
    return Math.max(0, 1.0 - diffDays / 60);
  }

  return 0.1; // Far future (>60 days)
}

/**
 * Calculates overlap between student's fields/interests and opportunity fields
 */
export function calculateFieldOverlap(
  oppFields: string[] | undefined,
  profile: StudentProfileData | null
): number {
  if (!oppFields || oppFields.length === 0) return 0.5;

  const normalizedOppFields = oppFields.map((f) => f.toLowerCase().trim());
  const isAll = normalizedOppFields.some(
    (f) => f === "all" || f === "all fields" || f === "all disciplines"
  );
  if (isAll) return 1.0;

  if (!profile) return 0.5;

  const studentInterests = [
    ...(profile.fields || []),
    ...(profile.interests || []),
  ].map((f) => f.toLowerCase().trim());

  if (studentInterests.length === 0) return 0.5;

  const matches = studentInterests.filter((interest) =>
    normalizedOppFields.some(
      (of) => of.includes(interest) || interest.includes(of)
    )
  );

  if (matches.length > 0) {
    return Math.min(1.0, 0.5 + (matches.length / studentInterests.length) * 0.5);
  }

  return 0.1;
}

/**
 * Computes deterministic ranking score for an opportunity relative to a student profile
 */
export function scoreOpportunity(
  evaluation: EvaluationResult,
  opportunity: RankableOpportunity,
  profile: StudentProfileData | null,
  today: string
): {
  score: number;
  eligibilityRatio: number;
  fieldOverlap: number;
  deadlineProximity: number;
} {
  // Eligibility ratio: met / (met + notMet)
  let eligibilityRatio = 0.5;
  const decidedCount = evaluation.met + evaluation.notMet;
  if (decidedCount > 0) {
    eligibilityRatio = evaluation.met / decidedCount;
  }

  const fieldOverlap = calculateFieldOverlap(opportunity.fields, profile);
  const deadlineProximity = calculateDeadlineProximity(
    opportunity.deadline,
    opportunity.deadline_rolling,
    today
  );

  // Score formula: ratio * 0.5 + overlap * 0.3 + proximity * 0.2
  let score =
    eligibilityRatio * 0.5 + fieldOverlap * 0.3 + deadlineProximity * 0.2;

  // Penalize hard failures unless explicitly allowed
  if (evaluation.hardFail) {
    score *= 0.1;
  }

  return {
    score: Math.round(score * 1000) / 1000,
    eligibilityRatio,
    fieldOverlap,
    deadlineProximity,
  };
}

/**
 * Sorts and filters a list of opportunities for a given student profile
 */
export function rankOpportunities<T extends RankableOpportunity>(
  opportunities: T[],
  profile: StudentProfileData | null,
  options: RankingOptions = {}
): RankedOpportunity<T>[] {
  const today = options.today || new Date().toISOString().slice(0, 10);
  const showNotEligible = options.showNotEligible ?? false;

  const ranked: RankedOpportunity<T>[] = [];

  for (const opp of opportunities) {
    const evaluation = evaluate(profile, opp.eligibility, today);

    // If hard failure and user has not toggled showNotEligible, skip
    if (evaluation.hardFail && !showNotEligible) {
      continue;
    }

    const { score, eligibilityRatio, fieldOverlap, deadlineProximity } =
      scoreOpportunity(evaluation, opp, profile, today);

    ranked.push({
      opportunity: opp,
      evaluation,
      score,
      eligibilityRatio,
      fieldOverlap,
      deadlineProximity,
    });
  }

  // Sort descending by score
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}
