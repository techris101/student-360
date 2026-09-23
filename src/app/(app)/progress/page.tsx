import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { ProgressStats } from "@/components/progress/progress-stats";
import { ProgressBoard } from "@/components/progress/progress-board";
import { UpcomingDeadlines } from "@/components/progress/upcoming-deadlines";
import { AdvisorReviewPanel } from "@/components/progress/advisor-review-panel";
import { getProgressData } from "@/app/actions/progress";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Progress — Student 360",
  description: "Track your opportunities, deadlines, and AI advisor progress reviews.",
};

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await getProgressData();

  const shellUser = user
    ? {
        name: user.user_metadata?.full_name || "Student",
        email: user.email || "student@university.ac.rw",
        initials: (user.user_metadata?.full_name || "ST")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        role: (user.user_metadata?.role as "user" | "admin") || "user",
      }
    : null;

  return (
    <AppShell pageTitle="Progress" user={shellUser}>
      <div className="space-y-8 max-w-[900px]">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Progress
          </h1>
          <p className="text-sm text-[var(--ink-2)]">
            Overview of your applications, impending deadlines, and weekly advisor feedback.
          </p>
        </div>

        {/* Top: 5 numbers in a single row without boxes */}
        <ProgressStats counts={data.counts} />

        {/* Applications Board (Desktop: columns, Mobile: grouped list) */}
        <ProgressBoard initialApplications={data.applications} />

        {/* Upcoming Deadlines */}
        <UpcomingDeadlines deadlines={data.upcomingDeadlines} />

        {/* Advisor Review (Prompt 5, once per 7 days) */}
        <AdvisorReviewPanel
          initialReview={data.latestReview}
          reviewStatus={data.reviewStatus}
        />
      </div>
    </AppShell>
  );
}
