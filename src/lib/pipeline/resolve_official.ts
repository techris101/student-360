export const KNOWN_AGGREGATOR_DOMAINS = [
  "opportunitydesk.org",
  "opportunitiesforafricans.com",
  "afterschoolafrica.com",
  "youthop.com",
  "scholars4dev.com",
  "armacad.info",
  "advance-africa.com",
  "heysuccess.com",
  "chances4youth.org",
  "indabax.rw",
];

export const NON_OFFICIAL_DOMAINS = [
  ...KNOWN_AGGREGATOR_DOMAINS,
  "facebook.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "instagram.com",
  "youtube.com",
  "t.me",
  "telegram.org",
  "whatsapp.com",
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "google.com",
  "forms.gle",
  "wordpress.com",
];

/**
 * Checks whether a given URL belongs to an aggregator or generic social platform
 */
export function isAggregatorOrSocialDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return NON_OFFICIAL_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return true;
  }
}

export interface ResolveOfficialResult {
  officialUrl: string | null;
  isAggregatorResolved: boolean;
  needsReview: boolean;
  reviewReason?: string;
}

/**
 * Resolves the genuine official link for an opportunity
 * If discovered on an aggregator, ensures that an aggregator link is NEVER saved as official
 */
export function resolveOfficialUrl(
  discoveredUrl: string,
  extractedOfficialUrl: string | null | undefined,
  isAggregatorSource: boolean
): ResolveOfficialResult {
  // If the source itself is not an aggregator and the discovered URL is not an aggregator
  if (!isAggregatorSource && !isAggregatorOrSocialDomain(discoveredUrl)) {
    return {
      officialUrl: discoveredUrl,
      isAggregatorResolved: false,
      needsReview: false,
    };
  }

  // If source is an aggregator or discovered on an aggregator domain
  if (extractedOfficialUrl) {
    if (!isAggregatorOrSocialDomain(extractedOfficialUrl)) {
      return {
        officialUrl: extractedOfficialUrl,
        isAggregatorResolved: true,
        needsReview: false,
      };
    }
  }

  // If no official URL could be resolved
  return {
    officialUrl: null,
    isAggregatorResolved: false,
    needsReview: true,
    reviewReason: "Discovered on aggregator but missing verified official organization URL",
  };
}
