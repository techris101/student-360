"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface NotificationItem {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

// In-memory fallback for offline dev/test
const memoryNotifications: Map<string, NotificationItem[]> = new Map();

function getInitialMockNotifications(userId: string): NotificationItem[] {
  return [
    {
      id: "notif-1",
      user_id: userId,
      kind: "deadline_reminder",
      title: "Deadline reminder: 7 days remaining",
      body: "Government of Rwanda Bilateral Higher Education Scholarships closes on 31 Oct 2026. Complete your submission.",
      link: "/opportunities/opp-001",
      read_at: null,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: "notif-2",
      user_id: userId,
      kind: "eligible_opportunity",
      title: "New matching scholarship published",
      body: "DAAD In-Country/In-Region Scholarship matches your profile requirements (Health sciences & STEM).",
      link: "/opportunities/opp-003",
      read_at: null,
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
      id: "notif-3",
      user_id: userId,
      kind: "cohort_activity",
      title: "New messages in your cohort",
      body: "3 new messages posted in the Mastercard Foundation Scholars cohort.",
      link: "/cohorts/opp-002",
      read_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    },
  ];
}

export async function getNotificationsAction(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "student-guest-001";
  const serviceClient = createServiceClient();

  try {
    const { data, error } = await serviceClient
      .from("notifications")
      .select("id, user_id, kind, title, body, link, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      if (!memoryNotifications.has(userId)) {
        memoryNotifications.set(userId, getInitialMockNotifications(userId));
      }
      const notifs = memoryNotifications.get(userId)!;
      const unreadCount = notifs.filter((n) => !n.read_at).length;
      return { notifications: notifs, unreadCount };
    }

    const notifications: NotificationItem[] = data.map((d) => ({
      id: d.id,
      user_id: d.user_id,
      kind: d.kind,
      title: d.title,
      body: d.body,
      link: d.link,
      read_at: d.read_at,
      created_at: d.created_at,
    }));

    const unreadCount = notifications.filter((n) => !n.read_at).length;
    return { notifications, unreadCount };
  } catch {
    if (!memoryNotifications.has(userId)) {
      memoryNotifications.set(userId, getInitialMockNotifications(userId));
    }
    const notifs = memoryNotifications.get(userId)!;
    const unreadCount = notifs.filter((n) => !n.read_at).length;
    return { notifications: notifs, unreadCount };
  }
}

export async function markNotificationReadAction(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "student-guest-001";
  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  try {
    await serviceClient
      .from("notifications")
      .update({ read_at: now })
      .eq("id", notificationId);
  } catch {
    // Memory fallback
    const list = memoryNotifications.get(userId) || [];
    const item = list.find((n) => n.id === notificationId);
    if (item) item.read_at = now;
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "student-guest-001";
  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  try {
    await serviceClient
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .is("read_at", null);
  } catch {
    // Memory fallback
    const list = memoryNotifications.get(userId) || [];
    for (const item of list) {
      if (!item.read_at) item.read_at = now;
    }
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function createNotification(
  userId: string,
  kind: string,
  title: string,
  body: string,
  link?: string
) {
  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  try {
    await serviceClient.from("notifications").insert({
      user_id: userId,
      kind,
      title,
      body,
      link: link || null,
      created_at: now,
    });
  } catch {
    const list = memoryNotifications.get(userId) || [];
    list.unshift({
      id: `notif-${Date.now()}`,
      user_id: userId,
      kind,
      title,
      body,
      link: link || null,
      read_at: null,
      created_at: now,
    });
    memoryNotifications.set(userId, list);
  }
}
