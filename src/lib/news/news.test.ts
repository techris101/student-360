import { describe, it, expect } from "vitest";
import {
  filterPublishedNews,
  validateNewsSummary,
  countWords,
  CATEGORY_LABELS,
} from "./news";
import { SEED_NEWS, NewsItem } from "@/lib/data/news";

describe("News Feed & Filter Engine (PRODUCT F4)", () => {
  const referenceDate = "2026-09-23T12:00:00.000Z";

  const sampleItems: NewsItem[] = [
    {
      id: "n-1",
      title: "Recent University Announcement",
      summary: "Short summary of recent campus event.",
      url: "https://ur.ac.rw/recent",
      published_at: "2026-09-20T10:00:00.000Z", // 3 days old -> included
      category: "universities",
      relevance: 0.95,
      status: "published",
    },
    {
      id: "n-2",
      title: "Old Policy Document",
      summary: "This article was published two months ago.",
      url: "https://mineduc.gov.rw/old",
      published_at: "2026-07-15T10:00:00.000Z", // ~70 days old -> excluded
      category: "policy",
      relevance: 0.9,
      status: "published",
    },
    {
      id: "n-3",
      title: "Pending Bursary Update",
      summary: "Unreviewed announcement about bursary forms.",
      url: "https://hec.gov.rw/pending",
      published_at: "2026-09-22T10:00:00.000Z",
      category: "funding",
      relevance: 0.5,
      status: "pending_review", // Not published -> excluded
    },
    {
      id: "n-4",
      title: "Tech Career Expo in Kigali",
      summary: "Annual hiring fair for university tech graduates.",
      url: "https://rdb.rw/expo",
      published_at: "2026-09-10T10:00:00.000Z", // 13 days old -> included
      category: "careers",
      relevance: 0.92,
      status: "published",
    },
  ];

  it("filters items within rolling 30-day window and omits expired items", () => {
    const results = filterPublishedNews(sampleItems, {
      todayIso: referenceDate,
    });

    const ids = results.map((r) => r.id);
    expect(ids).toContain("n-1");
    expect(ids).toContain("n-4");
    expect(ids).not.toContain("n-2"); // older than 30 days
    expect(ids).not.toContain("n-3"); // pending_review
  });

  it("filters published news by category", () => {
    const uniResults = filterPublishedNews(sampleItems, {
      category: "universities",
      todayIso: referenceDate,
    });
    expect(uniResults.length).toBe(1);
    expect(uniResults[0].id).toBe("n-1");

    const careerResults = filterPublishedNews(sampleItems, {
      category: "careers",
      todayIso: referenceDate,
    });
    expect(careerResults.length).toBe(1);
    expect(careerResults[0].id).toBe("n-4");

    const allResults = filterPublishedNews(sampleItems, {
      category: "all",
      todayIso: referenceDate,
    });
    expect(allResults.length).toBe(2);
  });

  it("filters published news by search query across title and summary", () => {
    const searchExpo = filterPublishedNews(sampleItems, {
      query: "Expo",
      todayIso: referenceDate,
    });
    expect(searchExpo.length).toBe(1);
    expect(searchExpo[0].id).toBe("n-4");

    const searchCampus = filterPublishedNews(sampleItems, {
      query: "campus",
      todayIso: referenceDate,
    });
    expect(searchCampus.length).toBe(1);
    expect(searchCampus[0].id).toBe("n-1");

    const searchNone = filterPublishedNews(sampleItems, {
      query: "nonexistent term",
      todayIso: referenceDate,
    });
    expect(searchNone.length).toBe(0);
  });

  it("enforces max 60 words for news summaries", () => {
    const shortText = "This is a brief summary well under sixty words.";
    const validRes = validateNewsSummary(shortText);
    expect(validRes.valid).toBe(true);
    expect(validRes.wordCount).toBe(9);

    const longText = Array(61).fill("word").join(" ");
    const invalidRes = validateNewsSummary(longText);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.wordCount).toBe(61);
    expect(invalidRes.error).toContain("exceeds 60 words");

    expect(validateNewsSummary("").valid).toBe(false);
  });

  it("verifies all SEED_NEWS items satisfy quality and length rules", () => {
    expect(SEED_NEWS.length).toBeGreaterThanOrEqual(20);

    SEED_NEWS.forEach((item) => {
      // 1. Valid title
      expect(item.title.trim().length).toBeGreaterThan(10);

      // 2. Summary under 60 words
      const words = countWords(item.summary);
      expect(words).toBeLessThanOrEqual(60);

      // 3. Official URL with https
      expect(item.url).toMatch(/^https?:\/\//);

      // 4. Recognized category
      expect(["universities", "policy", "funding", "careers"]).toContain(
        item.category
      );

      // 5. Relevance score >= 0.6
      expect(item.relevance).toBeGreaterThanOrEqual(0.6);
    });
  });

  it("has valid category display labels", () => {
    expect(CATEGORY_LABELS.universities).toBe("University Announcements");
    expect(CATEGORY_LABELS.policy).toBe("Policy & Reforms");
    expect(CATEGORY_LABELS.funding).toBe("Bursaries & Loans");
    expect(CATEGORY_LABELS.careers).toBe("Jobs & Careers");
  });
});
