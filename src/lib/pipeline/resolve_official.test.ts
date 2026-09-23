import { describe, it, expect } from "vitest";
import {
  resolveOfficialUrl,
  isAggregatorOrSocialDomain,
} from "./resolve_official";

describe("Official URL Resolution", () => {
  it("recognizes aggregator and social domains", () => {
    expect(isAggregatorOrSocialDomain("https://opportunitydesk.org/2026/scholarship/")).toBe(true);
    expect(isAggregatorOrSocialDomain("https://www.opportunitiesforafricans.com/fellowship")).toBe(true);
    expect(isAggregatorOrSocialDomain("https://facebook.com/post/123")).toBe(true);
    expect(isAggregatorOrSocialDomain("https://bit.ly/3xyz")).toBe(true);
    expect(isAggregatorOrSocialDomain("https://ughe.org/admissions")).toBe(false);
    expect(isAggregatorOrSocialDomain("https://www.daad.de/en/find-funding")).toBe(false);
  });

  it("passes official URLs directly from official sources", () => {
    const result = resolveOfficialUrl(
      "https://ur.ac.rw/scholarships/ace-ds",
      null,
      false
    );
    expect(result.needsReview).toBe(false);
    expect(result.officialUrl).toBe("https://ur.ac.rw/scholarships/ace-ds");
  });

  it("extracts and validates official URL when discovered on an aggregator", () => {
    const result = resolveOfficialUrl(
      "https://opportunitydesk.org/2026/05/chevening-scholarship/",
      "https://www.chevening.org/scholarships/",
      true
    );
    expect(result.needsReview).toBe(false);
    expect(result.isAggregatorResolved).toBe(true);
    expect(result.officialUrl).toBe("https://www.chevening.org/scholarships/");
  });

  it("flags for review when discovered on aggregator and official link is missing or pointing to another aggregator", () => {
    const resultMissing = resolveOfficialUrl(
      "https://opportunitydesk.org/2026/05/unknown-fellowship/",
      null,
      true
    );
    expect(resultMissing.needsReview).toBe(true);
    expect(resultMissing.officialUrl).toBeNull();

    const resultAnotherAggregator = resolveOfficialUrl(
      "https://opportunitydesk.org/2026/05/unknown-fellowship/",
      "https://afterschoolafrica.com/fellowship",
      true
    );
    expect(resultAnotherAggregator.needsReview).toBe(true);
    expect(resultAnotherAggregator.officialUrl).toBeNull();
  });
});
