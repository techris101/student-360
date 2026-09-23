import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, LifeBuoy } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — Student 360",
  description: "Get in touch with the Student 360 team in Kigali, Rwanda.",
};

export default function ContactPage() {
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
            Contact Us
          </h1>
          <p className="text-sm text-[var(--ink-2)]">
            Questions, corrections, or source suggestions for Student 360.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-2">
            <div className="flex items-center gap-2 text-[var(--teal)]">
              <Mail size={18} strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-[var(--ink)]">General inquiries</h2>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              For general questions, institutional partnerships, or university
              career centre inquiries:
            </p>
            <p className="text-xs font-mono text-[var(--ink)]">team@student360.rw</p>
          </div>

          <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface)] p-5 space-y-2">
            <div className="flex items-center gap-2 text-[var(--teal)]">
              <AlertCircle size={18} strokeWidth={1.5} />
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                Opportunity corrections
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-2)] leading-relaxed">
              Spotted a changed deadline, closed call, or have a verified source to add?
            </p>
            <p className="text-xs font-mono text-[var(--ink)]">sources@student360.rw</p>
          </div>
        </div>

        {/* Safety & Emergency Notice per AI_ADVISOR.md */}
        <div className="rounded-[6px] border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
            <LifeBuoy size={16} className="text-[var(--teal)]" />
            <span>Student Wellbeing &amp; Urgent Support</span>
          </div>
          <p className="text-[var(--ink-2)]">
            If you or someone you know is in acute distress or needs urgent help,
            please reach out immediately to your university&apos;s student counselling
            centre or dial Rwanda&apos;s toll-free emergency helpline at{" "}
            <strong className="text-[var(--ink)]">112</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}
