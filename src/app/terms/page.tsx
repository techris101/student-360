import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Student 360",
  description: "Terms of service and acceptable use for Student 360.",
};

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-xs text-[var(--ink-2)]">
            Effective date: 23 September 2026
          </p>
        </div>

        <div className="text-sm leading-relaxed space-y-6 text-[var(--ink)]">
          <section className="space-y-2">
            <h2 className="text-base font-semibold">1. Acceptance of terms</h2>
            <p className="text-[var(--ink-2)]">
              By accessing or using Student 360, you agree to be bound by these Terms
              of Service and our Community Rules. If you do not agree, do not use the
              service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">2. Nature of the service</h2>
            <p className="text-[var(--ink-2)]">
              Student 360 is an informational and academic support directory for
              students in Rwanda. We index publicly available scholarships,
              fellowships, and academic opportunities. We are not an admission board,
              scholarship committee, or employer. All final applications are made
              directly on the official provider&apos;s site.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">3. Accuracy of information</h2>
            <p className="text-[var(--ink-2)]">
              While we verify sources against official websites and maintain a strict
              pipeline against hallucinated data, providers may alter terms,
              requirements, or deadlines without notice. You are responsible for
              verifying all deadlines and criteria on the provider&apos;s official
              page before submitting applications.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">4. User conduct</h2>
            <p className="text-[var(--ink-2)]">
              You agree to provide truthful academic information on your profile. You
              agree not to post spam, commercial promotions, or abusive messages in
              cohort chats. Violations may result in immediate suspension.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">5. AI advisor limitation</h2>
            <p className="text-[var(--ink-2)]">
              The AI Advisor provides guidance, structuring suggestions, and critique.
              It does not ghostwrite essays or guarantee admissions or outcomes. It
              does not provide legal, financial, or medical advice.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
