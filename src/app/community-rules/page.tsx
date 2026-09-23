import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Users, AlertTriangle, EyeOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Community Rules — Student 360",
  description: "Cohort and discussion rules for Student 360 students.",
};

export default function CommunityRulesPage() {
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
            Community Rules
          </h1>
          <p className="text-sm text-[var(--ink-2)]">
            Our expectations for peer cohorts, collaborative chats, and discussions.
          </p>
        </div>

        <div className="text-sm leading-relaxed space-y-6 text-[var(--ink)]">
          <div className="p-4 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] space-y-2">
            <h2 className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">
              <Users size={18} className="text-[var(--teal)]" />
              <span>1. Mutual respect and collaboration</span>
            </h2>
            <p className="text-[var(--ink-2)]">
              Cohorts exist to help Rwandan applicants support one another through
              challenging scholarship and fellowship applications. Treat every
              student with courtesy, regardless of university or background.
            </p>
          </div>

          <div className="p-4 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] space-y-2">
            <h2 className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">
              <EyeOff size={18} className="text-[var(--teal)]" />
              <span>2. Protect student privacy</span>
            </h2>
            <p className="text-[var(--ink-2)]">
              Do not ask for or share phone numbers, WhatsApp links, Mobile Money
              numbers, national IDs, or passwords. Cohorts display only your first name
              and university. Keep conversations focused on application advice.
            </p>
          </div>

          <div className="p-4 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] space-y-2">
            <h2 className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">
              <AlertTriangle size={18} className="text-[var(--amber)]" />
              <span>3. No commercial solicitations or scams</span>
            </h2>
            <p className="text-[var(--ink-2)]">
              Advertising paid application services, selling essay writing, or
              offering &quot;guaranteed admission&quot; schemes is strictly prohibited.
              All genuine university scholarships in Rwanda and abroad explicitly ban
              paid ghostwriting.
            </p>
          </div>

          <div className="p-4 rounded-[6px] border border-[var(--line)] bg-[var(--surface)] space-y-2">
            <h2 className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">
              <Shield size={18} className="text-[var(--red)]" />
              <span>4. Moderation, reporting and enforcement</span>
            </h2>
            <p className="text-[var(--ink-2)]">
              Every message can be reported directly by clicking the menu on a
              message. Any message receiving 3 reports is automatically hidden pending
              administrator review. You can also block any user to instantly hide all
              their messages from your view. Accounts violating community standards
              are suspended immediately.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
