import React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { CohortsListView } from "@/components/cohorts/cohorts-list";
import { listCohorts } from "@/app/actions/cohorts";
import { createClient } from "@/lib/supabase/server";

export default async function CohortsPage() {
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

  const cohorts = await listCohorts();

  return (
    <AppShell pageTitle="Cohorts" user={userObj}>
      <CohortsListView cohorts={cohorts} />
    </AppShell>
  );
}
