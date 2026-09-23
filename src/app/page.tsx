import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, HelpCircle, ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpportunityRow } from "@/components/opportunities/opportunity-row";
import { SEED_OPPORTUNITIES } from "@/lib/data/opportunities";

export const metadata: Metadata = {
  title: "Student 360 — Real opportunities for Rwandan university students",
  description:
    "Every scholarship, fellowship, and internship open to Rwandan university students, checked against your profile requirements.",
  openGraph: {
    title: "Student 360 — Rwandan University Student Opportunities",
    description:
      "Every opportunity open to Rwandan university students, checked against your profile.",
    url: "https://student-360.vercel.app",
    siteName: "Student 360",
    locale: "en_RW",
    type: "website",
  },
};

export default function HomePage() {
  // 5 verified live opportunities from the dataset
  const liveOpportunities = SEED_OPPORTUNITIES.slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      {/* Minimal Top Header */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)] sticky top-0 z-40">
        <div className="max-w-[840px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Student <span className="text-[var(--teal)]">360</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/opportunities"
              className="text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] hidden sm:inline-block"
            >
              Browse feed
            </Link>
            <Link href="/sign-in">
              <Button variant="secondary" className="text-xs h-8 px-3">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[840px] w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-16 sm:space-y-20">
        {/* Hero Section per DESIGN.md */}
        <section className="space-y-5">
          <h1 className="text-3xl sm:text-[36px] font-semibold tracking-tight text-[var(--ink)] leading-[1.2] max-w-[700px]">
            Every opportunity open to Rwandan university students, checked against
            your profile.
          </h1>

          <p className="text-base sm:text-lg text-[var(--ink-2)] leading-relaxed max-w-[650px]">
            Scholarships, fellowships, and internships with verified Rwandan
            eligibility, real deadlines, and requirements matched to your academic stage.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/sign-in">
              <Button variant="primary" className="h-10 px-5 text-sm font-medium">
                Create your profile
              </Button>
            </Link>
            <Link href="/opportunities">
              <Button variant="secondary" className="h-10 px-5 text-sm font-medium">
                Browse opportunities
              </Button>
            </Link>
          </div>
        </section>

        {/* Live List of 5 Real Opportunities per DESIGN.md */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
            <h2 className="text-sm font-semibold text-[var(--ink)] uppercase tracking-wider text-[var(--ink-2)]">
              Recently verified opportunities
            </h2>
            <Link
              href="/opportunities"
              className="text-xs font-medium text-[var(--teal)] hover:underline inline-flex items-center gap-1"
            >
              <span>View all {SEED_OPPORTUNITIES.length} opportunities</span>
              <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          </div>

          <div className="divide-y divide-[var(--line)] rounded-[6px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
            {liveOpportunities.map((opp) => (
              <OpportunityRow
                key={opp.id}
                id={opp.id}
                title={opp.title}
                organisation={opp.organisation}
                type={opp.type}
                funding={opp.funding}
                location_scope={opp.location_scope}
                deadline={opp.deadline}
                deadline_rolling={opp.deadline_rolling}
                plan_ahead={opp.plan_ahead}
              />
            ))}
          </div>
        </section>

        {/* Section 1: How matching works (Signature Requirement Check) */}
        <section className="space-y-4 pt-4 border-t border-[var(--line)]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal)]">
              <ShieldCheck size={15} strokeWidth={1.5} />
              <span>Requirement Check</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">
              How matching works
            </h2>
            <p className="text-sm text-[var(--ink-2)] leading-relaxed max-w-[650px]">
              We evaluate official requirements against your university, programme,
              year of study, GPA, and test scores. No invented percentages or
              unverifiable success probabilities.
            </p>
          </div>

          {/* Signature Requirement Check Panel from DESIGN.md */}
          <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-5 border-l-4 border-l-[var(--teal)] space-y-4">
            <div>
              <div className="text-xs font-semibold text-[var(--ink-2)] uppercase tracking-wide">
                Example Evaluation
              </div>
              <div className="text-base font-semibold text-[var(--ink)] mt-0.5">
                You meet 3 of 5 stated requirements
              </div>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5 text-[var(--ink)]">
                <Check size={18} strokeWidth={2} className="text-[var(--teal)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Open to Rwandan nationals</span>
                  <div className="text-xs text-[var(--ink-2)]">Matches your citizenship</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-[var(--ink)]">
                <Check size={18} strokeWidth={2} className="text-[var(--teal)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Bachelor&apos;s students in year 2 or above</span>
                  <div className="text-xs text-[var(--ink-2)]">Matches Year 3 standing</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-[var(--ink)]">
                <Check size={18} strokeWidth={2} className="text-[var(--teal)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Field: STEM, Health, or Computer Science</span>
                  <div className="text-xs text-[var(--ink-2)]">Matches your programme</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-[var(--ink)]">
                <X size={18} strokeWidth={2} className="text-[var(--red)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Minimum GPA 3.5 / 4.0</span>
                  <div className="text-xs text-[var(--red)]">Your current recorded GPA is 3.2 / 4.0</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-[var(--ink)]">
                <HelpCircle size={18} strokeWidth={1.5} className="text-[var(--ink-2)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">IELTS 6.5 or equivalent English test</span>
                  <div className="text-xs text-[var(--ink-2)]">Add your English test score to confirm</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: The Advisor */}
        <section className="space-y-3 pt-4 border-t border-[var(--line)]">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal)]">
            <Sparkles size={15} strokeWidth={1.5} />
            <span>AI Advisor</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">
            An honest study and career advisor
          </h2>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed max-w-[650px]">
            The Advisor knows your academic background and our verified database. It
            identifies gaps in your profile, critiques motivation statements, plans
            timelines to impending deadlines, and tells you directly when an
            opportunity is not a realistic fit. Free for students with a transparent
            daily cap.
          </p>
        </section>

        {/* Section 3: Cohorts */}
        <section className="space-y-3 pt-4 border-t border-[var(--line)]">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal)]">
            <Users size={15} strokeWidth={1.5} />
            <span>Peer Cohorts</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">
            Cohorts for active applicants
          </h2>
          <p className="text-sm text-[var(--ink-2)] leading-relaxed max-w-[650px]">
            When you mark an opportunity as Applying or Submitted, you automatically
            join a shared group discussion with other Rwandan students applying to the
            same programme. Compare notes on required documents, interview stages, and
            transcripts. Closed 30 days after the application deadline.
          </p>
        </section>
      </main>

      {/* Footer per DESIGN.md and BUILD_PLAN P8 */}
      <footer className="border-t border-[var(--line)] bg-[var(--surface)] mt-16 py-8">
        <div className="max-w-[840px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--ink-2)]">
          <div>
            <span className="font-semibold text-[var(--ink)]">Student 360</span> · Academic
            and career platform for university students in Rwanda.
          </div>

          <nav className="flex flex-wrap items-center gap-4">
            <Link href="/about" className="hover:text-[var(--ink)] hover:underline">
              About
            </Link>
            <Link href="/privacy" className="hover:text-[var(--ink)] hover:underline">
              Privacy policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--ink)] hover:underline">
              Terms of service
            </Link>
            <Link href="/community-rules" className="hover:text-[var(--ink)] hover:underline">
              Community rules
            </Link>
            <Link href="/contact" className="hover:text-[var(--ink)] hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
