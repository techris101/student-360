import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Users, Calendar, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { RequirementPanel } from "@/components/opportunities/requirement-panel";
import { StatusControl } from "@/components/opportunities/status-control";
import { RightRail, DueItem } from "@/components/opportunities/right-rail";
import { SEED_OPPORTUNITIES, OpportunityItem } from "@/lib/data/opportunities";
import { evaluate } from "@/lib/eligibility/evaluate";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfileData } from "@/lib/eligibility/types";
import type { ApplicationStatus } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Not specified";
  const d = new Date(`${dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00Z`}`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Fetch opportunity
  let opportunity: OpportunityItem | null = null;

  try {
    const supabase = await createClient();
    const { data: dbOpp } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (dbOpp) {
      opportunity = {
        id: dbOpp.id,
        type: dbOpp.type as OpportunityItem["type"],
        title: dbOpp.title,
        organisation: dbOpp.organisation,
        summary: dbOpp.summary,
        key_facts: (dbOpp.key_facts as string[]) || [],
        official_url: dbOpp.official_url,
        deadline: dbOpp.deadline,
        deadline_rolling: dbOpp.deadline_rolling,
        opens_at: dbOpp.opens_at,
        starts_at: dbOpp.starts_at,
        location_scope: dbOpp.location_scope as OpportunityItem["location_scope"],
        location_text: dbOpp.location_text,
        funding: dbOpp.funding as OpportunityItem["funding"],
        levels: dbOpp.levels || [],
        fields: dbOpp.fields || [],
        eligibility: (dbOpp.eligibility as OpportunityItem["eligibility"]) || {},
        plan_ahead: dbOpp.plan_ahead,
        prepare_now: (dbOpp.prepare_now as string[]) || null,
        status: dbOpp.status as OpportunityItem["status"],
        confidence: dbOpp.confidence,
        content_hash: dbOpp.content_hash || "",
        first_seen_at: dbOpp.first_seen_at,
        last_checked_at: dbOpp.last_checked_at,
        published_at: dbOpp.published_at,
      };
    }
  } catch {
    // DB query failed or offline
  }

  // Fallback to SEED_OPPORTUNITIES
  if (!opportunity) {
    opportunity = SEED_OPPORTUNITIES.find((opp) => opp.id === id) || null;
  }

  if (!opportunity) {
    notFound();
  }

  // 2. Fetch user profile and application status
  let profile: StudentProfileData = DEFAULT_STUDENT_PROFILE;
  let userEmail = "student@university.ac.rw";
  let userName = "Jean Mugisha";
  let userRole: "user" | "admin" = "user";
  let initialStatus: ApplicationStatus | null = null;
  let cohortMemberCount = 12; // Realistic seed count

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

      // Check current user's application status
      const { data: appData } = await supabase
        .from("applications")
        .select("status")
        .eq("user_id", user.id)
        .eq("opportunity_id", id)
        .maybeSingle();

      if (appData) {
        initialStatus = appData.status as ApplicationStatus;
      }

      // Check cohort count
      const { data: cohortData } = await supabase
        .from("cohorts")
        .select("id")
        .eq("opportunity_id", id)
        .maybeSingle();

      if (cohortData) {
        const { count } = await supabase
          .from("cohort_members")
          .select("id", { count: "exact", head: true })
          .eq("cohort_id", cohortData.id);

        if (typeof count === "number") {
          cohortMemberCount = Math.max(1, count);
        }
      }
    }
  } catch {
    // Continue with mock states
  }

  // 3. Evaluate eligibility
  const today = new Date().toISOString().slice(0, 10);
  const evaluation = evaluate(profile, opportunity.eligibility, today);

  // 4. Calculate Due Items for Right Rail
  const todayDate = new Date();
  const dueItems: DueItem[] = SEED_OPPORTUNITIES.filter((opp) => {
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

  return (
    <AppShell
      pageTitle="Opportunity detail"
      user={userObj}
      rightRail={<RightRail profile={profile} dueItems={dueItems} />}
    >
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to opportunities</span>
          </Link>
        </div>

        {/* Opportunity Header (DESIGN.md: Title 24/600, Organisation, type, location) */}
        <div className="space-y-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-[var(--ink)] leading-tight">
              {opportunity.title}
            </h1>
            <p className="text-sm font-medium text-[var(--ink-2)]">
              {opportunity.organisation} · <span className="capitalize">{opportunity.type}</span> ·{" "}
              {opportunity.location_text || opportunity.location_scope}
            </p>
          </div>

          {/* Action Row: Apply on official site & Status control */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={opportunity.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-[var(--teal)] hover:bg-[#0c5945] rounded-[4px] transition-colors"
            >
              <span>Apply on the official site</span>
              <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
            </a>

            <StatusControl
              opportunityId={opportunity.id}
              initialStatus={initialStatus}
            />
          </div>
        </div>

        <div className="border-t border-[var(--line)]" />

        {/* Requirement Check: The centrepiece of the product */}
        <RequirementPanel evaluation={evaluation} />

        <div className="border-t border-[var(--line)]" />

        {/* Summary (DESIGN.md: max 80 words) */}
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            About this opportunity
          </h2>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed">
            {opportunity.summary}
          </p>
        </div>

        {/* Key Facts (DESIGN.md: Definition list: Deadline, Funding, Duration, Location, Starts) */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Key facts
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm bg-[var(--surface)] border border-[var(--line)] p-4 rounded-[4px]">
            <div>
              <dt className="text-xs text-[var(--muted)] font-medium">Deadline</dt>
              <dd className="text-sm text-[var(--ink)] font-medium pt-0.5 tabular-nums">
                {opportunity.deadline_rolling
                  ? "Rolling deadline"
                  : formatDate(opportunity.deadline)}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-[var(--muted)] font-medium">Funding</dt>
              <dd className="text-sm text-[var(--ink)] font-medium pt-0.5 capitalize">
                {opportunity.funding} funding
              </dd>
            </div>

            <div>
              <dt className="text-xs text-[var(--muted)] font-medium">Location</dt>
              <dd className="text-sm text-[var(--ink)] font-medium pt-0.5 capitalize">
                {opportunity.location_text || opportunity.location_scope}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-[var(--muted)] font-medium">Programme starts</dt>
              <dd className="text-sm text-[var(--ink)] font-medium pt-0.5 tabular-nums">
                {opportunity.starts_at ? formatDate(opportunity.starts_at) : "See official site"}
              </dd>
            </div>

            {opportunity.opens_at && (
              <div>
                <dt className="text-xs text-[var(--muted)] font-medium">Applications open</dt>
                <dd className="text-sm text-[var(--ink)] font-medium pt-0.5 tabular-nums">
                  {formatDate(opportunity.opens_at)}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-xs text-[var(--muted)] font-medium">Target level</dt>
              <dd className="text-sm text-[var(--ink)] font-medium pt-0.5 capitalize">
                {opportunity.levels.join(", ") || "All university levels"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Plan Ahead Section (PRODUCT F1) */}
        {opportunity.plan_ahead && opportunity.prepare_now && opportunity.prepare_now.length > 0 && (
          <div className="space-y-3 bg-[var(--surface-2)] border border-[var(--line)] p-5 rounded-[4px]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--teal)]" strokeWidth={2} />
                <h2 className="text-base font-semibold text-[var(--ink)]">
                  Plan ahead: How to prepare now
                </h2>
              </div>
              <p className="text-xs text-[var(--ink-2)]">
                Actionable preparation checklist derived from official eligibility requirements for future application cycles:
              </p>
            </div>

            <ul className="space-y-2 pt-1">
              {opportunity.prepare_now.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-[var(--ink)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source Attribution (DESIGN.md: Last checked [date] from [source]) */}
        <div className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--line)]">
          Last checked {formatDate(opportunity.last_checked_at)} from {opportunity.organisation} official portal.
        </div>

        {/* Cohort Section (DESIGN.md: Cohort: 14 students applying — Open cohort) */}
        <div className="bg-[var(--surface)] border border-[var(--line)] p-4 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--surface-2)] text-[var(--teal)] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">
                Cohort: {cohortMemberCount} students applying
              </p>
              <p className="text-xs text-[var(--ink-2)]">
                Connect and share application preparation with fellow applicants.
              </p>
            </div>
          </div>

          <Link
            href={`/cohorts/${opportunity.id}`}
            className="inline-flex items-center justify-center h-9 px-4 text-xs font-medium bg-[var(--surface)] border border-[var(--line-strong)] text-[var(--ink)] rounded-[4px] hover:bg-[var(--surface-2)] transition-colors self-start sm:self-auto shrink-0"
          >
            Open cohort
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
