import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  X,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Users,
  Search,
  Building2,
  GraduationCap,
  Calendar,
  Award,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEED_OPPORTUNITIES } from "@/lib/data/opportunities";

export const metadata: Metadata = {
  title: "Student 360 — Real Opportunities for Rwandan University Students",
  description:
    "Every verified scholarship, fellowship, and academic grant open to Rwandan university students, checked deterministically against your academic profile.",
  openGraph: {
    title: "Student 360 — Rwandan Higher Education Opportunities",
    description:
      "Every opportunity open to Rwandan university students, checked against your academic profile.",
    url: "https://student-360.vercel.app",
    siteName: "Student 360",
    locale: "en_RW",
    type: "website",
  },
};

const VERIFIED_INSTITUTIONS = [
  "University of Rwanda (UR)",
  "University of Global Health Equity (UGHE)",
  "African Leadership University (ALU)",
  "Adventist University of Central Africa (AUCA)",
  "Université Libre de Kigali (ULK)",
  "Carnegie Mellon University Africa",
];

const MONITORED_SOURCES = [
  { name: "HEC Rwanda", role: "Higher Education Council" },
  { name: "MINEDUC", role: "Ministry of Education" },
  { name: "Mastercard Foundation", role: "Scholars Program" },
  { name: "Imbuto Foundation", role: "National Scholarships" },
  { name: "DAAD Germany", role: "Regional & German Grants" },
  { name: "Chevening UK", role: "FCDO Postgraduate Fellowships" },
];

export default function HomePage() {
  // Top 5 live opportunities with high relevance
  const liveOpportunities = SEED_OPPORTUNITIES.slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col antialiased selection:bg-[var(--teal-subtle)] selection:text-[var(--teal)]">
      {/* Top Header */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              Student
            </span>
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-[4px] bg-[var(--teal-subtle)] text-[var(--teal)] border border-[var(--teal)]/15">
              360
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--ink-2)]">
            <Link
              href="/opportunities"
              className="hover:text-[var(--ink)] transition-colors"
            >
              Opportunities
            </Link>
            <Link
              href="/cohorts"
              className="hover:text-[var(--ink)] transition-colors"
            >
              Cohorts
            </Link>
            <Link
              href="/news"
              className="hover:text-[var(--ink)] transition-colors"
            >
              News
            </Link>
            <Link
              href="/about"
              className="hover:text-[var(--ink)] transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/opportunities"
              className="text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] hidden sm:inline-block"
            >
              Browse 62 Calls
            </Link>
            <Link href="/sign-in">
              <Button variant="secondary" size="sm" className="h-8.5 px-3.5 text-xs font-medium">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="max-w-3xl space-y-6">
            {/* Context Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]">
              <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />
              <span>Academic Year 2026/2027 · Rwanda Higher Education</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-[var(--ink)] leading-[1.12] text-balance">
              Every verified opportunity open to Rwandan university students.
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-xl text-[var(--ink-2)] leading-relaxed max-w-2xl font-normal">
              Scholarships, research fellowships, and internships with audited Rwandan
              eligibility, confirmed deadlines, and deterministic requirement matching.
              Zero guesswork. Zero expired links.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/opportunities">
                <Button variant="primary" className="h-11 px-6 text-sm font-medium gap-2">
                  <span>Browse verified opportunities</span>
                  <ArrowRight size={15} />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="secondary" className="h-11 px-6 text-sm font-medium">
                  Create student profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Search & Filters Bar */}
          <div className="mt-12 p-3 sm:p-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] max-w-4xl">
            <form action="/opportunities" method="GET" className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                />
                <input
                  type="text"
                  name="q"
                  placeholder="Search by programme, university, or keyword (e.g., Mastercard, STEM, Masters)..."
                  className="w-full h-11 pl-10 pr-4 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent transition-all"
                />
              </div>
              <Button type="submit" variant="primary" className="h-11 px-6 text-sm font-medium shrink-0">
                Search feed
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--line)]/60 text-xs">
              <span className="text-[var(--muted)] font-medium">Quick filters:</span>
              <Link
                href="/opportunities?type=scholarship"
                className="px-2.5 py-1 rounded-[4px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
              >
                Scholarships
              </Link>
              <Link
                href="/opportunities?type=fellowship"
                className="px-2.5 py-1 rounded-[4px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
              >
                Fellowships
              </Link>
              <Link
                href="/opportunities?funding=fully_funded"
                className="px-2.5 py-1 rounded-[4px] bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
              >
                Fully Funded
              </Link>
              <Link
                href="/opportunities?plan_ahead=true"
                className="px-2.5 py-1 rounded-[4px] bg-[var(--surface)] border border-[var(--line)] text-[var(--teal)] hover:underline font-medium"
              >
                Plan Ahead (Masters/PhD)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Proof Metric Strip */}
      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
                62 Active
              </div>
              <div className="text-xs text-[var(--ink-2)] font-medium">
                Verified Rwandan & international calls
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--teal)] tabular-nums">
                55 Sources
              </div>
              <div className="text-xs text-[var(--ink-2)] font-medium">
                Monitored government & embassy channels
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
                100%
              </div>
              <div className="text-xs text-[var(--ink-2)] font-medium">
                Deterministic requirement matching
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
                Kigali (UTC+2)
              </div>
              <div className="text-xs text-[var(--ink-2)] font-medium">
                Realtime verified deadline tracking
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-16 sm:py-20 space-y-24">
        {/* Section: Live Opportunities Feed */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[var(--line)]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--teal)] block">
                Official Directory
              </span>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)] mt-0.5">
                Recently verified opportunities
              </h2>
            </div>
            <Link
              href="/opportunities"
              className="text-xs font-medium text-[var(--teal)] hover:underline inline-flex items-center gap-1 group"
            >
              <span>View all {SEED_OPPORTUNITIES.length} opportunities</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="divide-y divide-[var(--line)] rounded-[8px] border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-xs">
            {liveOpportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="group block p-4 sm:p-5 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-[var(--ink)] group-hover:text-[var(--teal)] transition-colors line-clamp-1">
                      {opp.title}
                    </h3>
                    <p className="text-xs text-[var(--ink-2)] font-medium">
                      {opp.organisation}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs capitalize px-2 py-0.5 rounded-[4px] bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]/50">
                        {opp.type}
                      </span>
                      {opp.funding && opp.funding !== "unknown" && (
                        <span className="text-xs capitalize px-2 py-0.5 rounded-[4px] bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]/50">
                          {opp.funding} funding
                        </span>
                      )}
                      <span className="text-xs capitalize px-2 py-0.5 rounded-[4px] bg-[var(--surface-2)] text-[var(--ink-2)] border border-[var(--line)]/50">
                        {opp.location_scope}
                      </span>
                      {opp.plan_ahead && (
                        <span className="text-xs px-2 py-0.5 rounded-[4px] bg-[var(--teal-subtle)] text-[var(--teal)] border border-[var(--teal)]/20 font-medium">
                          Plan ahead
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 text-xs">
                    <span className="text-[var(--muted)] block">Closes</span>
                    <span className="text-sm text-[var(--ink)] font-medium tabular-nums block">
                      {opp.deadline ? new Date(`${opp.deadline}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Rolling"}
                    </span>
                    <span className="text-xs text-[var(--teal)] font-medium inline-flex items-center gap-1 mt-0.5">
                      <Check size={12} strokeWidth={2.5} />
                      <span>Verified call</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link href="/opportunities">
              <Button variant="secondary" className="px-6 text-xs h-9 font-medium">
                Explore all {SEED_OPPORTUNITIES.length} opportunities
              </Button>
            </Link>
          </div>
        </section>

        {/* Section: The Signature Requirement Check */}
        <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Explanation */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal)] px-2.5 py-1 rounded-[4px] bg-[var(--teal-subtle)] border border-[var(--teal)]/15">
                <ShieldCheck size={14} strokeWidth={2} />
                <span>The Requirement Check Engine</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)] leading-snug">
                Know where you stand before spending weeks applying.
              </h2>

              <p className="text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
                Most scholarship portals display generic lists without evaluating whether your degree level, GPA, or citizenship actually qualify.
              </p>

              <p className="text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
                Student 360 runs official eligibility criteria against your recorded profile:
                degree level, GPA conversions, field, study year, and test requirements.
                Clear, transparent, and completely deterministic.
              </p>

              <div className="pt-2">
                <Link href="/sign-in">
                  <Button variant="primary" size="sm" className="h-9 px-4 text-xs font-medium">
                    Test your profile match
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Signature Requirement Panel Showcase */}
            <div className="lg:col-span-6">
              <div className="rounded-[8px] border border-[var(--line)] bg-[var(--bg)] p-5 sm:p-6 border-l-4 border-l-[var(--teal)] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--teal)] uppercase tracking-wider">
                      Live Requirement Audit
                    </span>
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--ink)] mt-0.5">
                      Mastercard Foundation Scholars Program
                    </h3>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[var(--teal-subtle)] text-[var(--teal)]">
                    3 of 5 Met
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-start gap-3 text-[var(--ink)]">
                    <Check size={17} strokeWidth={2.5} className="text-[var(--teal)] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Open to Rwandan nationals</span>
                      <div className="text-[11px] text-[var(--ink-2)]">Matches your citizenship recorded in profile</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-[var(--ink)]">
                    <Check size={17} strokeWidth={2.5} className="text-[var(--teal)] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Bachelor&apos;s degree candidate in Year 2+</span>
                      <div className="text-[11px] text-[var(--ink-2)]">Matches Year 3 academic standing</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-[var(--ink)]">
                    <Check size={17} strokeWidth={2.5} className="text-[var(--teal)] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Programme: STEM, Health, or Computer Science</span>
                      <div className="text-[11px] text-[var(--ink-2)]">Matches your enrolled field of study</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-[var(--ink)]">
                    <X size={17} strokeWidth={2.5} className="text-[var(--red)] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Minimum GPA 3.5 / 4.0</span>
                      <div className="text-[11px] text-[var(--red)]">Your current recorded GPA is 3.2 / 4.0</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-[var(--ink)]">
                    <HelpCircle size={17} strokeWidth={2} className="text-[var(--muted)] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">IELTS 6.5 or equivalent English certification</span>
                      <div className="text-[11px] text-[var(--muted)]">Add your English score to complete verification</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Peer Cohorts */}
        <section className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--teal)]">
              <Users size={15} strokeWidth={2} />
              <span>Peer Cohorts</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--ink)]">
              Apply alongside students from your campus.
            </h2>
            <p className="text-sm sm:text-base text-[var(--ink-2)] leading-relaxed">
              When you mark an opportunity as Applying or Submitted, you automatically join an anonymous peer group of fellow Rwandan applicants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] space-y-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[var(--surface-2)] flex items-center justify-center text-[var(--teal)] font-semibold text-xs border border-[var(--line)]">
                01
              </div>
              <h3 className="text-base font-semibold text-[var(--ink)]">
                Document Checklist Sharing
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
                Compare notes on required transcripts, recommendation letters, and official notarization at Irembo before submission.
              </p>
            </div>

            <div className="p-5 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] space-y-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[var(--surface-2)] flex items-center justify-center text-[var(--teal)] font-semibold text-xs border border-[var(--line)]">
                02
              </div>
              <h3 className="text-base font-semibold text-[var(--ink)]">
                Privacy-First Protection
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
                Only your first name and university are shown. Your email, phone number, and GPA are never visible to other students.
              </p>
            </div>

            <div className="p-5 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] space-y-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[var(--surface-2)] flex items-center justify-center text-[var(--teal)] font-semibold text-xs border border-[var(--line)]">
                03
              </div>
              <h3 className="text-base font-semibold text-[var(--ink)]">
                Interview Stage Coordination
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
                Hear when shortlisted notices arrive, share interview formats, and clarify technical assessments in real time.
              </p>
            </div>
          </div>
        </section>

        {/* Section: University Coverage */}
        <section className="space-y-6 pt-8 border-t border-[var(--line)]">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--teal)]">
              Institutional Scope
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)]">
              Tailored for students across Rwanda
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-2)]">
              Whether you are an undergraduate at Huye campus or studying health equity in Butaro, opportunities are tagged for your specific context.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {VERIFIED_INSTITUTIONS.map((uni, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] text-center space-y-1.5 flex flex-col justify-center min-h-[90px]"
              >
                <GraduationCap size={16} className="mx-auto text-[var(--teal)] shrink-0" />
                <span className="text-xs font-medium text-[var(--ink)] line-clamp-2 leading-tight">
                  {uni}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Monitored Sources */}
        <section className="rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-[var(--ink)]">
                55 Monitored Official Sources
              </h3>
              <p className="text-xs text-[var(--ink-2)]">
                We ingest opportunities directly from official gazettes, scholarship boards, and accredited foundations.
              </p>
            </div>
            <Link
              href="/opportunities"
              className="text-xs font-medium text-[var(--teal)] hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>See all monitored feeds</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {MONITORED_SOURCES.map((source, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[6px] bg-[var(--surface)] border border-[var(--line)] text-left space-y-0.5"
              >
                <div className="text-xs font-semibold text-[var(--ink)] truncate">
                  {source.name}
                </div>
                <div className="text-[11px] text-[var(--ink-2)] truncate">
                  {source.role}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--line)] bg-[var(--surface)] mt-20 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[var(--line)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[var(--ink)]">
                  Student 360
                </span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-[4px] bg-[var(--teal-subtle)] text-[var(--teal)] border border-[var(--teal)]/15">
                  Rwanda
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)] max-w-md">
                Verified scholarships, fellowships, and academic progress tracking for university students across Rwanda.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-5 text-xs font-medium text-[var(--ink-2)]">
              <Link href="/about" className="hover:text-[var(--ink)] transition-colors">
                About
              </Link>
              <Link href="/opportunities" className="hover:text-[var(--ink)] transition-colors">
                Opportunities
              </Link>
              <Link href="/cohorts" className="hover:text-[var(--ink)] transition-colors">
                Cohorts
              </Link>
              <Link href="/news" className="hover:text-[var(--ink)] transition-colors">
                News
              </Link>
              <Link href="/privacy" className="hover:text-[var(--ink)] transition-colors">
                Privacy policy
              </Link>
              <Link href="/terms" className="hover:text-[var(--ink)] transition-colors">
                Terms of service
              </Link>
              <Link href="/community-rules" className="hover:text-[var(--ink)] transition-colors">
                Community rules
              </Link>
              <Link href="/contact" className="hover:text-[var(--ink)] transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[var(--muted)]">
            <div>
              Registered under Rwanda Law N° 058/2021 relating to the protection of personal data and privacy.
            </div>
            <div>
              Student Emergency Crisis Support: Rwanda 112
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
