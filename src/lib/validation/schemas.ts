import { z } from "zod";

export const OpportunityTypeSchema = z.enum([
  "scholarship",
  "fellowship",
  "internship",
  "course",
  "competition",
  "conference",
  "grant",
  "exchange",
  "research",
]);

export const LocationScopeSchema = z.enum([
  "rwanda",
  "africa",
  "abroad",
  "online",
  "mixed",
]);

export const FundingTypeSchema = z.enum(["full", "partial", "none", "unknown"]);

export const EligibilityRuleSchema = z.object({
  rwandans_eligible: z.boolean().nullable().optional(),
  nationalities: z.array(z.string()).nullable().optional(),
  regions: z.array(z.string()).nullable().optional(),
  levels: z.array(z.string()).nullable().optional(),
  years_of_study: z.array(z.number()).nullable().optional(),
  fields: z.array(z.string()).nullable().optional(),
  min_gpa: z
    .object({
      value: z.number(),
      scale: z.number(),
    })
    .nullable()
    .optional(),
  max_age: z.number().nullable().optional(),
  age_on: z.string().nullable().optional(),
  gender: z.enum(["female", "male"]).nullable().optional(),
  language_tests: z
    .array(
      z.object({
        test: z.string(),
        min_score: z.union([z.number(), z.string()]),
      })
    )
    .nullable()
    .optional(),
  work_experience_years: z.number().nullable().optional(),
  other: z.array(z.string()).default([]),
});

export const ExtractedOpportunitySchema = z.object({
  is_opportunity: z.boolean().default(true),
  type: OpportunityTypeSchema.default("scholarship"),
  title: z.string().min(1),
  organisation: z.string().min(1),
  summary: z.string().max(600),
  key_facts: z.array(z.string()).max(6).default([]),
  official_url: z.string().url().nullable().optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  deadline_rolling: z.boolean().default(false),
  opens_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  starts_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  location_scope: LocationScopeSchema.default("rwanda"),
  location_text: z.string().nullable().optional(),
  funding: FundingTypeSchema.default("unknown"),
  levels: z.array(z.string()).default([]),
  fields: z.array(z.string()).default([]),
  eligibility: EligibilityRuleSchema.default({ other: [] }),
  plan_ahead: z.boolean().default(false),
  prepare_now: z.array(z.string()).max(6).nullable().optional(),
  confidence: z.number().min(0).max(1).default(1.0),
});

export type ExtractedOpportunity = z.infer<typeof ExtractedOpportunitySchema>;

export const ExtractedNewsSchema = z.object({
  relevant: z.boolean().default(true),
  relevance: z.number().min(0).max(1).default(0.8),
  category: z
    .enum(["universities", "policy", "funding", "careers"])
    .nullable()
    .default("universities"),
  title: z.string().min(1),
  summary: z.string().max(400),
  published_at: z.string().nullable().optional(),
});

export type ExtractedNews = z.infer<typeof ExtractedNewsSchema>;
