import { SEED_NEWS, NewsItem } from "@/lib/data/news";

export type NewsCategory = "universities" | "policy" | "funding" | "careers";

export interface NewsFilterParams {
  category?: string;
  query?: string;
  todayIso?: string;
}

/**
 * Filter published news within a rolling 30-day window per PRODUCT F4.
 * Items older than 30 days drop off the feed.
 */
export function filterPublishedNews(
  items: NewsItem[] = SEED_NEWS,
  params: NewsFilterParams = {}
): NewsItem[] {
  const { category, query, todayIso = new Date().toISOString() } = params;
  const nowMs = new Date(todayIso).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const windowStartMs = nowMs - thirtyDaysMs;

  const q = (query || "").trim().toLowerCase();

  return items.filter((item) => {
    // 1. Only published items
    if (item.status !== "published") return false;

    // 2. 30-day rolling window
    const pubMs = new Date(item.published_at).getTime();
    if (isNaN(pubMs) || pubMs < windowStartMs) return false;

    // 3. Category filter
    if (category && category !== "all" && item.category !== category) {
      return false;
    }

    // 4. Query search
    if (q) {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary) return false;
    }

    return true;
  });
}

/**
 * Validates news summary length (max 60 words per PRODUCT F4).
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateNewsSummary(summary: string): {
  valid: boolean;
  wordCount: number;
  error?: string;
} {
  const count = countWords(summary);
  if (count === 0) {
    return { valid: false, wordCount: 0, error: "Summary cannot be empty." };
  }
  if (count > 60) {
    return {
      valid: false,
      wordCount: count,
      error: `Summary exceeds 60 words (${count} words).`,
    };
  }
  return { valid: true, wordCount: count };
}

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  universities: "University Announcements",
  policy: "Policy & Reforms",
  funding: "Bursaries & Loans",
  careers: "Jobs & Careers",
};
