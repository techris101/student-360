import { describe, it, expect } from "vitest";
import { filterOpportunity, filterNewsItem } from "./filter";
import type { ExtractedOpportunity, ExtractedNews } from "@/lib/validation/schemas";

describe("Pipeline Filter Rules", () => {
  const baseOpportunity: ExtractedOpportunity = {
    is_opportunity: true,
    type: "scholarship",
    title: "Mastercard Foundation Scholars at UGHE",
    organisation: "University of Global Health Equity",
    summary: "Full scholarship for Rwandan and African students pursuing global health equity masters.",
    key_facts: ["Full tuition", "Stipend", "2-year program"],
    official_url: "https://ughe.org/admissions/scholarships/",
    deadline: "2026-10-31",
    deadline_rolling: false,
    opens_at: "2026-05-01",
    starts_at: "2026-09-01",
    location_scope: "rwanda",
    location_text: "Butaro, Rwanda",
    funding: "full",
    levels: ["master"],
    fields: ["Health", "Medicine"],
    eligibility: {
      rwandans_eligible: true,
      nationalities: ["Rwandan", "East African"],
      other: [],
    },
    plan_ahead: true,
    prepare_now: ["Maintain high GPA"],
    confidence: 0.95,
  };

  it("passes a valid, upcoming opportunity open to Rwandans", () => {
    const result = filterOpportunity(baseOpportunity, { today: "2026-09-23" });
    expect(result.passed).toBe(true);
  });

  it("rejects non-opportunities (articles/posts/general pages)", () => {
    const item = { ...baseOpportunity, is_opportunity: false };
    const result = filterOpportunity(item);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("not_an_opportunity");
  });

  it("rejects opportunities where Rwandans are explicitly not eligible", () => {
    const item: ExtractedOpportunity = {
      ...baseOpportunity,
      eligibility: {
        rwandans_eligible: false,
        other: [],
      },
    };
    const result = filterOpportunity(item);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("rwandans_excluded");
  });

  it("rejects opportunities restricted to nationalities excluding Rwanda", () => {
    const item: ExtractedOpportunity = {
      ...baseOpportunity,
      eligibility: {
        nationalities: ["Ghanaian", "Nigerian"],
        other: [],
      },
    };
    const result = filterOpportunity(item);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("rwandans_excluded");
  });

  it("passes opportunities open to 'all nationalities' or 'Sub-Saharan Africa'", () => {
    const item: ExtractedOpportunity = {
      ...baseOpportunity,
      eligibility: {
        nationalities: ["Sub-Saharan African countries"],
        other: [],
      },
    };
    const result = filterOpportunity(item);
    expect(result.passed).toBe(true);
  });

  it("rejects opportunities whose deadline has passed", () => {
    const item: ExtractedOpportunity = {
      ...baseOpportunity,
      deadline: "2026-08-15",
      deadline_rolling: false,
    };
    const result = filterOpportunity(item, { today: "2026-09-23" });
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("deadline_passed");
  });

  it("accepts opportunities with rolling deadlines even if deadline is not set", () => {
    const item: ExtractedOpportunity = {
      ...baseOpportunity,
      deadline: null,
      deadline_rolling: true,
    };
    const result = filterOpportunity(item, { today: "2026-09-23" });
    expect(result.passed).toBe(true);
  });

  describe("News Filter Rules", () => {
    const validNews: ExtractedNews = {
      relevant: true,
      relevance: 0.85,
      category: "universities",
      title: "HEC issues updated guidelines for national university scholarships",
      summary: "Higher Education Council introduces new eligibility criteria for STEM programs.",
      published_at: "2026-09-20",
    };

    it("passes relevant university/education news", () => {
      const result = filterNewsItem(validNews);
      expect(result.passed).toBe(true);
    });

    it("rejects low-relevance news (< 0.6)", () => {
      const item: ExtractedNews = {
        ...validNews,
        relevance: 0.45,
      };
      const result = filterNewsItem(item);
      expect(result.passed).toBe(false);
      expect(result.reason).toBe("low_relevance");
    });

    it("rejects news marked as not relevant", () => {
      const item: ExtractedNews = {
        ...validNews,
        relevant: false,
      };
      const result = filterNewsItem(item);
      expect(result.passed).toBe(false);
      expect(result.reason).toBe("low_relevance");
    });
  });
});
