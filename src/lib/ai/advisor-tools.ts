import { tool } from "ai";
import { z } from "zod";
import { SEED_OPPORTUNITIES, OpportunityItem } from "@/lib/data/opportunities";
import { evaluate } from "@/lib/eligibility/evaluate";
import type { StudentProfileData } from "@/lib/eligibility/types";

export interface SearchOpportunitiesParams {
  query: string;
  type?: string;
  funding?: string;
}

export interface OpportunitySearchResult {
  count: number;
  results: Array<{
    id: string;
    title: string;
    organisation: string;
    type: string;
    deadline: string | null;
    funding: string;
    location: string | null;
    summary: string;
    link: string;
  }>;
}

export function searchOpportunities(
  params: SearchOpportunitiesParams,
  opportunities: OpportunityItem[] = SEED_OPPORTUNITIES
): OpportunitySearchResult {
  const { query, type, funding } = params;
  const q = query.toLowerCase().trim();

  const matches = opportunities
    .filter((opp) => {
      if (opp.status !== "published") return false;
      if (type && opp.type !== type) return false;
      if (funding && opp.funding !== funding) return false;

      if (q) {
        const keywords = q
          .split(/\s+/)
          .map((k) => k.trim())
          .filter((k) => k.length > 2);

        if (keywords.length > 0) {
          const matchAny = keywords.some(
            (k) =>
              opp.title.toLowerCase().includes(k) ||
              opp.organisation.toLowerCase().includes(k) ||
              opp.summary.toLowerCase().includes(k) ||
              opp.fields.some((f) => f.toLowerCase().includes(k))
          );
          if (!matchAny) return false;
        }
      }

      return true;
    })
    .slice(0, 8);

  return {
    count: matches.length,
    results: matches.map((opp) => ({
      id: opp.id,
      title: opp.title,
      organisation: opp.organisation,
      type: opp.type,
      deadline: opp.deadline_rolling ? "Rolling" : opp.deadline,
      funding: opp.funding,
      location: opp.location_text || opp.location_scope,
      summary: opp.summary,
      link: `/opportunities/${opp.id}`,
    })),
  };
}

export function getOpportunityDetails(
  id: string,
  profile: StudentProfileData,
  opportunities: OpportunityItem[] = SEED_OPPORTUNITIES,
  today: string = new Date().toISOString().slice(0, 10)
) {
  const opp = opportunities.find((o) => o.id === id);
  if (!opp) {
    return { error: `Opportunity with ID '${id}' not found in the database.` };
  }

  const evaluation = evaluate(profile, opp.eligibility, today);

  return {
    id: opp.id,
    title: opp.title,
    organisation: opp.organisation,
    type: opp.type,
    deadline: opp.deadline_rolling ? "Rolling" : opp.deadline,
    funding: opp.funding,
    location: opp.location_text || opp.location_scope,
    summary: opp.summary,
    key_facts: opp.key_facts,
    official_url: opp.official_url,
    plan_ahead: opp.plan_ahead,
    prepare_now: opp.prepare_now,
    eligibility_evaluation: {
      met: evaluation.met,
      notMet: evaluation.notMet,
      unknown: evaluation.unknown,
      total: evaluation.total,
      hardFail: evaluation.hardFail,
      overallStatus: evaluation.overallStatus,
      checks: evaluation.checks.map((c) => ({
        status: c.status,
        label: c.label,
        hint: c.hint,
      })),
    },
    link: `/opportunities/${opp.id}`,
  };
}

export function createAdvisorTools(
  profile: StudentProfileData,
  opportunities: OpportunityItem[] = SEED_OPPORTUNITIES,
  today: string = new Date().toISOString().slice(0, 10)
) {
  return {
    search_opportunities: tool({
      description:
        "Search published opportunities when a student asks about programmes, keywords, or types not in the immediate match list.",
      inputSchema: z.object({
        query: z.string().describe("Search keywords, field, or organisation name"),
        type: z
          .enum([
            "scholarship",
            "fellowship",
            "internship",
            "course",
            "competition",
            "conference",
            "grant",
            "exchange",
            "research",
          ])
          .optional()
          .describe("Optional opportunity type filter"),
        funding: z
          .enum(["full", "partial", "none", "unknown"])
          .optional()
          .describe("Optional funding level filter"),
      }),
      execute: async ({ query, type, funding }) => {
        return searchOpportunities({ query, type, funding }, opportunities);
      },
    }),

    get_opportunity: tool({
      description:
        "Get complete details, requirements, and live eligibility checks for a specific opportunity by ID.",
      inputSchema: z.object({
        id: z.string().describe("The opportunity ID, e.g. opp-001"),
      }),
      execute: async ({ id }) => {
        return getOpportunityDetails(id, profile, opportunities, today);
      },
    }),
  };
}
