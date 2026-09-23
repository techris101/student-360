import type { ExtractedOpportunity, ExtractedNews } from "@/lib/validation/schemas";

export interface FilterResult {
  passed: boolean;
  reason?:
    | "not_an_opportunity"
    | "rwandans_excluded"
    | "deadline_passed"
    | "low_confidence"
    | "low_relevance"
    | "missing_required_fields";
  detail?: string;
}

/**
 * Gets today's date in Africa/Kigali (UTC+2) formatted as YYYY-MM-DD
 */
export function getTodayKigali(): string {
  const now = new Date();
  const kigaliTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Africa/Kigali" })
  );
  return kigaliTime.toISOString().slice(0, 10);
}

/**
 * Filter an extracted opportunity according to pipeline rules
 */
export function filterOpportunity(
  opp: ExtractedOpportunity,
  options: { today?: string } = {}
): FilterResult {
  const today = options.today || getTodayKigali();

  // 1. Is it an opportunity?
  if (opp.is_opportunity === false) {
    return {
      passed: false,
      reason: "not_an_opportunity",
      detail: "Item identified as a general page, news article, or blog post",
    };
  }

  // 2. Minimum fields check
  if (!opp.title || !opp.organisation) {
    return {
      passed: false,
      reason: "missing_required_fields",
      detail: "Missing title or organisation",
    };
  }

  // 3. Are Rwandans eligible?
  if (opp.eligibility?.rwandans_eligible === false) {
    return {
      passed: false,
      reason: "rwandans_excluded",
      detail: "Stated as not eligible for Rwandan citizens",
    };
  }

  // Check explicit nationality list if present
  if (
    opp.eligibility?.nationalities &&
    opp.eligibility.nationalities.length > 0
  ) {
    const nats = opp.eligibility.nationalities.map((n) => n.toLowerCase().trim());
    const isRwandaCovered = nats.some(
      (n) =>
        n.includes("rwanda") ||
        n.includes("africa") ||
        n.includes("all") ||
        n.includes("any") ||
        n.includes("developing") ||
        n.includes("global south") ||
        n.includes("commonwealth") ||
        n.includes("east africa")
    );

    if (!isRwandaCovered) {
      return {
        passed: false,
        reason: "rwandans_excluded",
        detail: `Nationalities specified do not include Rwanda (${nats.join(", ")})`,
      };
    }
  }

  // 4. Has the deadline passed?
  if (opp.deadline && !opp.deadline_rolling) {
    if (opp.deadline < today) {
      return {
        passed: false,
        reason: "deadline_passed",
        detail: `Deadline was ${opp.deadline} (today is ${today})`,
      };
    }
  }

  return { passed: true };
}

/**
 * Filter extracted news item according to pipeline rules
 */
export function filterNewsItem(news: ExtractedNews): FilterResult {
  if (news.relevant === false || news.relevance < 0.6) {
    return {
      passed: false,
      reason: "low_relevance",
      detail: `News item relevance score (${news.relevance}) is below threshold (0.6)`,
    };
  }

  if (!news.title || !news.summary) {
    return {
      passed: false,
      reason: "missing_required_fields",
      detail: "Missing title or summary",
    };
  }

  return { passed: true };
}
