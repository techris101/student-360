import React from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { CohortChatView } from "@/components/cohorts/cohort-chat-view";
import { getCohort, getCohortMessages } from "@/app/actions/cohorts";
import { createClient } from "@/lib/supabase/server";

interface CohortPageProps {
  params: Promise<{ id: string }>;
}

export default async function CohortDetailPage({ params }: CohortPageProps) {
  const { id } = await params;

  let userName = "Jean Mugisha";
  let userEmail = "student@university.ac.rw";
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
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (dbProfile) {
        userName = dbProfile.full_name || userName;
        userRole = dbProfile.role || "user";
      }
    }
  } catch {
    // Demo fallback
  }

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

  const [cohort, messages] = await Promise.all([
    getCohort(id),
    getCohortMessages(id),
  ]);

  if (!cohort) {
    notFound();
  }

  return (
    <AppShell pageTitle={`Cohort: ${cohort.opportunity_title}`} user={userObj}>
      <CohortChatView cohort={cohort} initialMessages={messages} />
    </AppShell>
  );
}
