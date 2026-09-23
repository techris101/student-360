import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { getNotificationsAction } from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Notifications — Student 360",
  description: "Stay updated on upcoming deadlines, new matching opportunities, and cohorts.",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { notifications, unreadCount } = await getNotificationsAction();

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
    <AppShell pageTitle="Notifications" user={shellUser}>
      <div className="space-y-6 max-w-[700px]">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
            Notifications
          </h1>
          <p className="text-sm text-[var(--ink-2)]">
            Deadline reminders, new eligible programmes, and cohort updates.
          </p>
        </div>

        {/* Notifications List */}
        <NotificationsList
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
        />
      </div>
    </AppShell>
  );
}
