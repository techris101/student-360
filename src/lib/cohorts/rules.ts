export const COMMUNITY_RULES = [
  {
    title: "Respect and encouragement",
    description:
      "Be respectful and supportive to fellow applicants. Everyone is navigating the same application journey.",
  },
  {
    title: "Stay on topic",
    description:
      "Focus discussions on this specific opportunity: eligibility, application steps, required documents, and preparation tips.",
  },
  {
    title: "No solicitation, ads, or spam",
    description:
      "Do not promote external services, paid agency help, unverified group links, or unsolicited direct contacts.",
  },
  {
    title: "Protect private information",
    description:
      "Never share passwords, national ID numbers, banking details, or request financial transactions from others.",
  },
  {
    title: "Zero tolerance for harassment",
    description:
      "Abuse, discrimination, or fraud leads to immediate message removal and permanent account suspension.",
  },
] as const;

/**
 * Calculates cohort closing date: exactly 30 days after the opportunity's deadline.
 * Per PRODUCT F3: Cohorts close for posting 30 days after the opportunity's deadline and stay readable.
 */
export function calculateCohortClosingDate(
  deadline: string | null
): string | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;

  // Add 30 days
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

/**
 * Checks if a cohort is closed for posting.
 */
export function isCohortClosed(
  closesAt: string | null,
  nowIso: string = new Date().toISOString()
): boolean {
  if (!closesAt) return false;
  return new Date(nowIso).getTime() >= new Date(closesAt).getTime();
}

/**
 * Validates message length: 1 to 1,000 characters.
 */
export function validateMessageContent(body: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Message cannot be empty." };
  }
  if (trimmed.length > 1000) {
    return {
      valid: false,
      error: `Message is too long (${trimmed.length}/1000 characters).`,
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Privacy helper: extracts first name only.
 * Per PRODUCT F3: Members see each other's first name, university, and programme only.
 */
export function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return "Student";
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || "Student";
}
