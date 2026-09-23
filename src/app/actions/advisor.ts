"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkDailyUsage, DailyUsageStatus } from "@/lib/ai/rate-limit";

export interface AdvisorThreadSummary {
  id: string;
  title: string;
  created_at: string;
}

export interface AdvisorMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function getAdvisorUsage(): Promise<DailyUsageStatus> {
  let userId = "demo-user";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Demo fallback
  }

  return checkDailyUsage(userId);
}

export async function listAdvisorThreads(): Promise<AdvisorThreadSummary[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: threads } = await supabase
      .from("ai_threads")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return (threads as AdvisorThreadSummary[]) || [];
  } catch {
    return [];
  }
}

export async function getThreadMessages(
  threadId: string
): Promise<AdvisorMessageItem[]> {
  if (threadId.startsWith("local-")) return [];

  try {
    const supabase = await createClient();
    const { data: messages } = await supabase
      .from("ai_messages")
      .select("id, role, content, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    return (
      (messages as Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
        created_at: string;
      }>) || []
    );
  } catch {
    return [];
  }
}

export async function deleteAdvisorThread(threadId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return true;

    const service = createServiceClient();
    await service
      .from("ai_threads")
      .delete()
      .eq("id", threadId)
      .eq("user_id", user.id);

    return true;
  } catch {
    return false;
  }
}
