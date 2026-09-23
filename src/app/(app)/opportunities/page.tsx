import React, { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { OpportunityRow } from "@/components/opportunities/opportunity-row";
import { OpportunityFilters } from "@/components/opportunities/opportunity-filters";
import { RightRail, DueItem } from "@/components/opportunities/right-rail";
import { SEED_OPPORTUNITIES, OpportunityItem } from "@/lib/data/opportunities";
import { rankOpportunities } from "@/lib/ranking/rank";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfileData } from "@/lib/eligibility/types";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    funding?: string;
    location_scope?: string;
    plan_ahead?: string;
    show_not_eligible?: string;
    sort?: string;
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 20;

// Default profile for demo / unauthenticated sessions
const DEFAULT_STUDENT_PROFILE: StudentProfileData = {
  full_name: "Jean Mugisha",
  nationality: "Rwanda",
  level: "bachelor",
  year_of_study: 3,
  gpa: 3.65,
  gpa_scale: 4.0,
  fields: ["Computer Science", "Information Technology", "STEM"],
  interests: ["Software Engineering", "Artificial Intelligence"],
  languages: [
    { language: "English", level: "fluent" },
    { language: "Kinyarwanda", level: "native" },
  ],
  experience: [
    {
      role: "Software Engineering Intern",
      organisation: "Irembo",
      start: "2025-06",
      end: "2025-09",
    },
  ],
};

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q || "").toLowerCase().trim();
  const type = params.type || "all";
  const funding = params.funding || "all";
  const locationScope = params.location_scope || "all";
  const planAhead = params.plan_ahead === "true";
  const showNotEligible = params.show_not_eligible === "true";
  const sort = params.sort || "eligible";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  // 1. Fetch user session and profile from Supabase
  let profile: StudentProfileData = DEFAULT_STUDENT_PROFILE;
  let userEmail = "student@university.ac.rw";
  let userName = "Jean Mugisha";
  let userRole: "user" | "admin" = "user";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || userEmail;
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (dbProfile) {
        userName = dbProfile.full_name || userName;
        userRole = dbProfile.role || "user";
        profile = {
          id: dbProfile.id,
          full_name: dbProfile.full_name,
          nationality: dbProfile.nationality,
          level: dbProfile.level,
          year_of_study: dbProfile.year_of_study,
          gpa: dbProfile.gpa,
          gpa_scale: dbProfile.gpa_scale,
          date_of_birth: dbProfile.date_of_birth,
          gender: dbProfile.gender,
          fields: dbProfile.fields,
          interests: dbProfile.interests,
          languages: dbProfile.languages as StudentProfileData["languages"],
          experience: dbProfile.experience as StudentProfileData["experience"],
        };
      }
    }
  } catch {
    // Continue with default test profile if database is unreachable
  }

  // 2. Fetch opportunities (DB with SEED_OPPORTUNITIES fallback)
  let rawOpportunities: OpportunityItem[] = SEED_OPPORTUNITIES;

  try {
    const supabase = await createClient();
    const { data: dbOpps } = await supabase
      .from("opportunities")
      .select("*")
      .eq("status", "published");

    if (dbOpps && dbOpps.length > 0) {
      // Map DB rows to OpportunityItem structure
      rawOpportunities = dbOpps.map((opp) => ({
        id: opp.id,
        type: opp.type as OpportunityItem["type"],
        title: opp.title,
        organisation: opp.organisation,
        summary: opp.summary,
        key_facts: (opp.key_facts as string[]) || [],
        official_url: opp.official_url,
        deadline: opp.deadline,
        deadline_rolling: opp.deadline_rolling,
        opens_at: opp.opens_at,
        starts_at: opp.starts_at,
        location_scope: opp.location_scope as OpportunityItem["location_scope"],
        location_text: opp.location_text,
        funding: opp.funding as OpportunityItem["funding"],
        levels: opp.levels || [],
        fields: opp.fields || [],
        eligibility: (opp.eligibility as OpportunityItem["eligibility"]) || {},
        plan_ahead: opp.plan_ahead,
        prepare_now: (opp.prepare_now as string[]) || null,
        status: opp.status as OpportunityItem["status"],
        confidence: opp.confidence,
        content_hash: opp.content_hash || "",
        first_seen_at: opp.first_seen_at,
        last_checked_at: opp.last_checked_at,
        published_at: opp.published_at,
      }));
    }
  } catch {
    // Fall back to SEED_OPPORTUNITIES
  }

  // 3. Filter opportunities
  const filtered = rawOpportunities.filter((opp) => {
    // Plan ahead
    if (planAhead && !opp.plan_ahead) return false;

    // Type
    if (type !== "all" && opp.type !== type) return false;

    // Funding
    if (funding !== "all" && opp.funding !== funding) return false;

    // Location
    if (locationScope !== "all" && opp.location_scope !== locationScope)
      return false;

    // Text search query
    if (q) {
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchOrg = opp.organisation.toLowerCase().includes(q);
      const matchSummary = opp.summary.toLowerCase().includes(q);
      const matchFields = opp.fields.some((f) => f.toLowerCase().includes(q));
      if (!matchTitle && !matchOrg && !matchSummary && !matchFields) {
        return false;
      }
    }

    return true;
  });

  // 4. Rank and evaluate
  const today = new Date().toISOString().slice(0, 10);
  let ranked = rankOpportunities<OpportunityItem>(filtered, profile, {
    showNotEligible,
    today,
  });

  // 5. Apply explicit sorts if requested
  if (sort === "deadline") {
    ranked = [...ranked].sort((a, b) => {
      if (a.opportunity.deadline_rolling && !b.opportunity.deadline_rolling) return 1;
      if (!a.opportunity.deadline_rolling && b.opportunity.deadline_rolling) return -1;
      if (!a.opportunity.deadline) return 1;
      if (!b.opportunity.deadline) return -1;
      return a.opportunity.deadline.localeCompare(b.opportunity.deadline);
    });
  } else if (sort === "newest") {
    ranked = [...ranked].sort((a, b) => {
      const dateA = a.opportunity.published_at || a.opportunity.first_seen_at;
      const dateB = b.opportunity.published_at || b.opportunity.first_seen_at;
      return dateB.localeCompare(dateA);
    });
  }

  // 6. Pagination
  const totalCount = ranked.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = ranked.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 7. Calculate "Due this week" for Right Rail (closing within 7 days)
  const todayDate = new Date();
  const dueItems: DueItem[] = rawOpportunities
    .filter((opp) => {
      if (!opp.deadline || opp.deadline_rolling) return false;
      const d = new Date(`${opp.deadline}T23:59:59Z`);
      const diffDays = Math.ceil(
        (d.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays >= 0 && diffDays <= 7;
    })
    .map((opp) => {
      const d = new Date(`${opp.deadline}T23:59:59Z`);
      const diffDays = Math.ceil(
        (d.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: opp.id,
        title: opp.title,
        organisation: opp.organisation,
        deadline: opp.deadline || "",
        daysRemaining: diffDays,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const userObj = {
    name: userName,
    email: userEmail,
    initials: initials || "ST",
    role: userRole,
  };

  // Helper to build pagination link
  const createPageLink = (pageNumber: number) => {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.type && params.type !== "all") p.set("type", params.type);
    if (params.funding && params.funding !== "all")
      p.set("funding", params.funding);
    if (params.location_scope && params.location_scope !== "all")
      p.set("location_scope", params.location_scope);
    if (params.plan_ahead) p.set("plan_ahead", params.plan_ahead);
    if (params.show_not_eligible)
      p.set("show_not_eligible", params.show_not_eligible);
    if (params.sort && params.sort !== "eligible") p.set("sort", params.sort);
    p.set("page", String(pageNumber));
    return `/opportunities?${p.toString()}`;
  };

  return (
    <AppShell
      pageTitle="Opportunities"
      user={userObj}
      rightRail={<RightRail profile={profile} dueItems={dueItems} />}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[var(--ink)]">
            Opportunities
          </h1>
          <p className="text-sm text-[var(--ink-2)]">
            Every scholarship, fellowship, and academic award verified for Rwandan university students.
          </p>
        </div>

        {/* Filters */}
        <Suspense fallback={<div className="h-28 bg-[var(--surface-2)]" />}>
          <OpportunityFilters
            initialQuery={params.q || ""}
            initialType={type}
            initialFunding={funding}
            initialLocation={locationScope}
            initialSort={sort}
            initialPlanAhead={planAhead}
            initialShowNotEligible={showNotEligible}
          />
        </Suspense>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-[var(--ink-2)] pt-1">
          <span>
            {totalCount === 0
              ? "0 opportunities found"
              : `Showing ${startIndex + 1}–${Math.min(
                  startIndex + ITEMS_PER_PAGE,
                  totalCount
                )} of ${totalCount} opportunities`}
          </span>

          {!showNotEligible && (
            <span className="text-[var(--muted)] hidden sm:inline">
              Ineligible opportunities hidden
            </span>
          )}
        </div>

        {/* Opportunities List */}
        {paginatedList.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[var(--surface)] border border-[var(--line)] p-6 rounded-[4px]">
            <p className="text-sm font-medium text-[var(--ink)]">
              No opportunities match your filters.
            </p>
            <p className="text-xs text-[var(--ink-2)] max-w-md mx-auto">
              Try clearing some filters, broadening your search term, or turning on &quot;Show not eligible&quot;.
            </p>
            <div className="pt-2">
              <Link
                href="/opportunities"
                className="inline-block text-xs font-medium text-[var(--teal)] hover:underline"
              >
                Clear all filters
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {paginatedList.map(({ opportunity, evaluation }) => (
              <OpportunityRow
                key={opportunity.id}
                id={opportunity.id}
                title={opportunity.title}
                organisation={opportunity.organisation}
                type={opportunity.type}
                funding={opportunity.funding}
                location_scope={opportunity.location_scope}
                deadline={opportunity.deadline}
                deadline_rolling={opportunity.deadline_rolling}
                plan_ahead={opportunity.plan_ahead}
                evaluation={evaluation}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-[var(--line)]">
            <div>
              {currentPage > 1 ? (
                <Link
                  href={createPageLink(currentPage - 1)}
                  className="inline-flex items-center justify-center h-9 px-4 text-xs font-medium bg-[var(--surface)] border border-[var(--line-strong)] text-[var(--ink)] rounded-[4px] hover:bg-[var(--surface-2)] transition-colors"
                >
                  Previous
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center h-9 px-4 text-xs font-medium bg-[var(--surface-2)] text-[var(--muted)] rounded-[4px] cursor-not-allowed">
                  Previous
                </span>
              )}
            </div>

            <span className="text-xs text-[var(--ink-2)] tabular-nums">
              Page {currentPage} of {totalPages}
            </span>

            <div>
              {currentPage < totalPages ? (
                <Link
                  href={createPageLink(currentPage + 1)}
                  className="inline-flex items-center justify-center h-9 px-4 text-xs font-medium bg-[var(--surface)] border border-[var(--line-strong)] text-[var(--ink)] rounded-[4px] hover:bg-[var(--surface-2)] transition-colors"
                >
                  Next
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center h-9 px-4 text-xs font-medium bg-[var(--surface-2)] text-[var(--muted)] rounded-[4px] cursor-not-allowed">
                  Next
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
