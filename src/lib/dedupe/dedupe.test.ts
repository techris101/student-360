import { describe, it, expect } from "vitest";
import {
  normalizeUrl,
  generateContentHash,
  calculateTrigramSimilarity,
  findDuplicate,
  mergeOpportunityData,
} from "./dedupe";

describe("Deduplication Engine", () => {
  describe("normalizeUrl", () => {
    it("strips trailing slashes, tracking query params and lowercases host", () => {
      const url1 = "https://WWW.Chevening.org/scholarship/?utm_source=twitter&utm_medium=social#overview";
      const url2 = "https://www.chevening.org/scholarship";

      expect(normalizeUrl(url1)).toBe(url2);
    });

    it("sorts query parameters", () => {
      const urlA = "https://example.com/apply?b=2&a=1";
      const urlB = "https://example.com/apply?a=1&b=2";

      expect(normalizeUrl(urlA)).toBe(normalizeUrl(urlB));
    });
  });

  describe("generateContentHash", () => {
    it("generates identical hashes for minor punctuation or whitespace variations", () => {
      const hash1 = generateContentHash(
        "Mastercard Foundation",
        "Scholars Program 2026/2027"
      );
      const hash2 = generateContentHash(
        "  mastercard foundation  ",
        "scholars   program  2026 2027"
      );

      expect(hash1).toBe(hash2);
    });

    it("generates different hashes for distinct opportunities", () => {
      const hashA = generateContentHash("DAAD", "Master Scholarship in Germany");
      const hashB = generateContentHash("DAAD", "PhD Research Grant in Germany");

      expect(hashA).not.toBe(hashB);
    });
  });

  describe("calculateTrigramSimilarity", () => {
    it("returns 1.0 for identical strings", () => {
      expect(calculateTrigramSimilarity("DAAD In-Country Scholarships", "DAAD In-Country Scholarships")).toBe(1.0);
    });

    it("returns high similarity (>0.8) for minor typo or title variation", () => {
      const title1 = "Chevening Master's Scholarship 2026";
      const title2 = "Chevening Masters Scholarship 2026";
      const score = calculateTrigramSimilarity(title1, title2);
      expect(score).toBeGreaterThan(0.85);
    });

    it("returns low similarity (<0.5) for different titles", () => {
      const title1 = "Rwanda Biomedical Centre Medical Internship";
      const title2 = "Global Health Corps Leadership Fellowship";
      const score = calculateTrigramSimilarity(title1, title2);
      expect(score).toBeLessThan(0.5);
    });
  });

  describe("findDuplicate", () => {
    const existing = [
      {
        id: "item-1",
        organisation: "Chevening",
        title: "Chevening Scholarships 2026",
        official_url: "https://www.chevening.org/scholarships/",
      },
      {
        id: "item-2",
        organisation: "University of Rwanda",
        title: "ACE-DS Masters Scholarship",
        official_url: "https://ur.ac.rw/scholarships/ace-ds",
      },
    ];

    it("detects duplicate by canonical URL", () => {
      const incoming = {
        organisation: "Different Title or Aggregator",
        title: "Apply for Chevening in the UK",
        official_url: "https://www.chevening.org/scholarships/?utm_campaign=promo",
      };

      const result = findDuplicate(incoming, existing);
      expect(result.isDuplicate).toBe(true);
      expect(result.matchedId).toBe("item-1");
      expect(result.matchReason).toBe("url");
    });

    it("detects duplicate by content hash", () => {
      const incoming = {
        organisation: "Chevening",
        title: "Chevening Scholarships 2026",
        official_url: "https://another-link.com",
      };

      const result = findDuplicate(incoming, existing);
      expect(result.isDuplicate).toBe(true);
      expect(result.matchedId).toBe("item-1");
      expect(result.matchReason).toBe("content_hash");
    });

    it("detects duplicate by title similarity (>0.8) within same organisation", () => {
      const incoming = {
        organisation: "University of Rwanda",
        title: "ACE-DS Master Scholarships",
        official_url: "https://ur.ac.rw/ace-ds-scholarships",
      };

      const result = findDuplicate(incoming, existing);
      expect(result.isDuplicate).toBe(true);
      expect(result.matchedId).toBe("item-2");
      expect(result.matchReason).toBe("similarity");
    });

    it("does not flag non-duplicate", () => {
      const incoming = {
        organisation: "Rhodes Trust",
        title: "Rhodes Scholarship 2026",
        official_url: "https://www.rhodeshouse.ox.ac.uk",
      };

      const result = findDuplicate(incoming, existing);
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe("mergeOpportunityData", () => {
    it("merges fresh incoming fields into existing and updates last_checked_at", () => {
      const existing: {
        id: string;
        title: string;
        summary: string;
        deadline: string;
        key_facts: string[];
        last_checked_at?: string;
      } = {
        id: "opp-123",
        title: "Old Title",
        summary: "Old Summary",
        deadline: "2026-11-01",
        key_facts: ["Fact 1"],
      };

      const incoming = {
        title: "Updated Title",
        deadline: "2026-12-15",
        key_facts: ["Fact 1", "Fact 2"],
      };

      const merged = mergeOpportunityData(existing, incoming);
      expect(merged.id).toBe("opp-123");
      expect(merged.title).toBe("Updated Title");
      expect(merged.summary).toBe("Old Summary");
      expect(merged.deadline).toBe("2026-12-15");
      expect(merged.key_facts).toEqual(["Fact 1", "Fact 2"]);
      expect(merged.last_checked_at).toBeDefined();
    });
  });
});
