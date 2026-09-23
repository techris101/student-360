import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Student 360",
  description: "Privacy policy, personal data processing, and compliance with Rwanda NCSA.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Student <span className="text-[var(--teal)]">360</span>
          </Link>
          <Link
            href="/"
            className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] inline-flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-[var(--ink-2)]">
            Effective date: 23 September 2026 · Last updated: 23 September 2026
          </p>
        </div>

        <div className="text-sm leading-relaxed space-y-8 text-[var(--ink)]">
          {/* Regulatory Statement per BUILD_PLAN P8.1 */}
          <div className="rounded-[6px] border border-[var(--teal)] bg-[var(--teal-light)]/20 p-4 text-xs leading-relaxed text-[var(--ink)]">
            <strong className="font-semibold block mb-1">
              Data Protection Authority Registration (Rwanda)
            </strong>
            Student 360 is currently registering as a data controller and processor
            with the National Cyber Security Authority (NCSA) in the Republic of
            Rwanda, in strict compliance with Law N° 058/2021 relating to the
            Protection of Personal Data and Privacy.
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--ink)]">
              1. What data we collect and hold
            </h2>
            <p className="text-[var(--ink-2)]">
              We only collect data necessary to provide eligibility matching,
              progress tracking, and study advisory services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[var(--ink-2)]">
              <li>
                <strong>Identity and contact:</strong> Your full name, email address,
                and authenticated session credentials.
              </li>
              <li>
                <strong>Academic profile:</strong> University in Rwanda, degree level,
                programme, year of study, expected graduation date, GPA and grading scale.
              </li>
              <li>
                <strong>Skills, tests and experience:</strong> Language test scores
                (IELTS, TOEFL, Duolingo), fields of interest, career goals, and CV
                content when optionally uploaded for parsing.
              </li>
              <li>
                <strong>Platform activity:</strong> Saved opportunities, application
                statuses, progress board transitions, and chat messages in peer
                cohorts.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--ink)]">
              2. Why we process your data
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-[var(--ink-2)]">
              <li>
                <strong>Deterministic eligibility matching:</strong> Comparing your
                academic profile against published criteria so you see exactly which
                requirements you meet.
              </li>
              <li>
                <strong>Personalised AI advisory:</strong> Feeding your profile and
                active applications into the Advisor to provide actionable, honest
                feedback.
              </li>
              <li>
                <strong>Deadlines and notifications:</strong> Notifying you of
                impending deadlines and newly published matching opportunities.
              </li>
              <li>
                <strong>Peer collaboration:</strong> Enabling applicant cohort chats
                under strict privacy rules (only first name and university are shown).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--ink)]">
              3. Data storage and retention
            </h2>
            <p className="text-[var(--ink-2)]">
              Your data is stored in isolated relational databases with Row Level
              Security (RLS) enabled on every table. CV files are stored in private
              encrypted object storage and accessed only through short-lived signed
              URLs. We retain your account data only as long as you maintain an active
              account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--ink)]">
              4. Data export and account deletion
            </h2>
            <p className="text-[var(--ink-2)]">
              You maintain total ownership of your data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[var(--ink-2)]">
              <li>
                <strong>Export:</strong> You can download a complete JSON export of
                your profile, applications, and logs directly from your Settings page
                at any time.
              </li>
              <li>
                <strong>Permanent Deletion:</strong> Clicking &quot;Delete account&quot; in
                Settings permanently purges all profile records, application events,
                cohort messages, and uploaded CV files. No lingering copies are
                retained.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--ink)]">
              5. Contact our Data Protection Officer
            </h2>
            <p className="text-[var(--ink-2)]">
              If you have any questions or data rights requests, contact our team at:
              <br />
              <span className="font-mono text-xs">privacy@student360.rw</span>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
