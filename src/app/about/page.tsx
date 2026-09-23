import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Student 360",
  description: "About Student 360: built for university students in Rwanda.",
};

export default function AboutPage() {
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
            About Student 360
          </h1>
          <p className="text-sm text-[var(--ink-2)]">
            A dedicated platform for higher-education students across Rwanda.
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert text-sm leading-relaxed space-y-6 text-[var(--ink)]">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Our mission</h2>
            <p className="text-[var(--ink-2)]">
              University students in Rwanda often struggle to discover legitimate
              scholarships, fellowships, and academic opportunities before deadlines
              pass. Student 360 solves this by monitoring official university,
              government, and bilateral sources, extracting clear requirements, and
              evaluating them deterministically against each student&apos;s academic
              profile.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--ink)]">What we believe</h2>
            <ul className="list-disc pl-5 space-y-2 text-[var(--ink-2)]">
              <li>
                <strong className="text-[var(--ink)]">No invented data:</strong> We
                never guess deadlines, requirements, or application fees. Every
                opportunity links directly to the official source.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Deterministic eligibility:</strong>{" "}
                We reject speculative &quot;chance of acceptance&quot; algorithms. Instead,
                we show a clear checklist of stated requirements you meet, do not
                meet, or need to verify.
              </li>
              <li>
                <strong className="text-[var(--ink)]">Student privacy first:</strong>{" "}
                Your academic data belongs to you. In cohort chats, only your first
                name and university are visible. You can export or delete your account
                and all data at any time.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Governance</h2>
            <p className="text-[var(--ink-2)]">
              Student 360 is built and operated in Rwanda. We operate in full
              compliance with Law N° 058/2021 relating to the protection of personal
              data and privacy.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
