import { createHash } from "node:crypto";

/**
 * Normalizes a URL for canonical matching:
 * - Lowercases protocol and hostname
 * - Removes common tracking parameters (utm_*, ref, gclid, etc.)
 * - Removes trailing slash
 * - Removes default ports and anchor hash fragments
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    url.hostname = url.hostname.toLowerCase();
    url.protocol = url.protocol.toLowerCase();

    // Remove tracking query parameters
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "ref",
      "source",
      "mc_cid",
      "mc_eid",
    ];

    for (const param of trackingParams) {
      url.searchParams.delete(param);
    }

    url.hash = "";

    // Normalize path by trimming trailing slash (unless root /)
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    url.pathname = pathname;

    // Sort remaining search parameters
    url.searchParams.sort();

    return url.toString();
  } catch {
    // If URL parsing fails, fallback to simple trim and lowercase
    return rawUrl.trim().toLowerCase().replace(/\/+$/, "");
  }
}

/**
 * Normalizes text by removing non-alphanumeric chars, lowercasing, and collapsing whitespace
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates content hash for normalized organisation + title
 */
export function generateContentHash(organisation: string, title: string): string {
  const normOrg = normalizeText(organisation);
  const normTitle = normalizeText(title);
  const combined = `${normOrg}::${normTitle}`;

  return createHash("sha256").update(combined).digest("hex");
}

/**
 * Computes trigram set for a string
 */
export function getTrigrams(str: string): Set<string> {
  const s = `  ${normalizeText(str)} `;
  const trigrams = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) {
    trigrams.add(s.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Computes trigram similarity (Dice coefficient) between two strings
 * Returns a score between 0.0 and 1.0 (matching pg_trgm behavior)
 */
export function calculateTrigramSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const tri1 = getTrigrams(s1);
  const tri2 = getTrigrams(s2);

  if (tri1.size === 0 || tri2.size === 0) return 0.0;

  let intersection = 0;
  for (const t of tri1) {
    if (tri2.has(t)) {
      intersection++;
    }
  }

  return (2 * intersection) / (tri1.size + tri2.size);
}

export interface CandidateItem {
  id?: string;
  official_url?: string | null;
  organisation: string;
  title: string;
  content_hash?: string | null;
}

export interface DedupeResult {
  isDuplicate: boolean;
  matchedId?: string;
  matchReason?: "url" | "content_hash" | "similarity";
  similarityScore?: number;
}

/**
 * Checks an incoming candidate against existing database items
 */
export function findDuplicate(
  incoming: CandidateItem,
  existingItems: CandidateItem[]
): DedupeResult {
  const incomingHash =
    incoming.content_hash ||
    generateContentHash(incoming.organisation, incoming.title);
  const incomingNormUrl = incoming.official_url
    ? normalizeUrl(incoming.official_url)
    : null;

  // 1. Canonical URL Match
  if (incomingNormUrl) {
    for (const item of existingItems) {
      if (item.official_url) {
        if (normalizeUrl(item.official_url) === incomingNormUrl) {
          return {
            isDuplicate: true,
            matchedId: item.id,
            matchReason: "url",
          };
        }
      }
    }
  }

  // 2. Content Hash Match (Exact Normalized Organisation + Title)
  for (const item of existingItems) {
    const itemHash =
      item.content_hash ||
      generateContentHash(item.organisation, item.title);
    if (itemHash === incomingHash) {
      return {
        isDuplicate: true,
        matchedId: item.id,
        matchReason: "content_hash",
      };
    }
  }

  // 3. Trigram Similarity (> 0.8) within same organisation
  const normIncomingOrg = normalizeText(incoming.organisation);

  for (const item of existingItems) {
    const normItemOrg = normalizeText(item.organisation);
    const orgSimilarity = calculateTrigramSimilarity(normIncomingOrg, normItemOrg);

    // If organisation matches closely
    if (orgSimilarity >= 0.7 || normIncomingOrg === normItemOrg) {
      const titleSimilarity = calculateTrigramSimilarity(
        incoming.title,
        item.title
      );
      if (titleSimilarity > 0.8) {
        return {
          isDuplicate: true,
          matchedId: item.id,
          matchReason: "similarity",
          similarityScore: titleSimilarity,
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Merges updates from an incoming duplicate into the existing record
 */
export function mergeOpportunityData<T extends Record<string, unknown>>(
  existing: T,
  incoming: Partial<T>
): T {
  const merged: Record<string, unknown> = { ...existing };

  for (const key of Object.keys(incoming)) {
    const incomingVal = incoming[key];
    const existingVal = existing[key];

    if (incomingVal !== undefined && incomingVal !== null) {
      if (Array.isArray(incomingVal) && incomingVal.length > 0) {
        merged[key] = incomingVal;
      } else if (
        typeof incomingVal === "object" &&
        !Array.isArray(incomingVal) &&
        existingVal &&
        typeof existingVal === "object" &&
        !Array.isArray(existingVal)
      ) {
        merged[key] = {
          ...(existingVal as Record<string, unknown>),
          ...(incomingVal as Record<string, unknown>),
        };
      } else {
        merged[key] = incomingVal;
      }
    }
  }

  merged.last_checked_at = new Date().toISOString();

  return merged as T;
}
