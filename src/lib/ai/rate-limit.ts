import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

// In-memory fallback map for offline sessions or simulated tests
const fallbackUsageMap = new Map<string, number>();

export interface DailyUsageStatus {
  count: number;
  cap: number;
  remaining: number;
  allowed: boolean;
  resetTime: string;
}

/**
 * Calculates current date in Kigali time (CAT, UTC+2)
 */
export function getKigaliDateString(d: Date = new Date()): string {
  // Offset by +2 hours for Central Africa Time
  const kigaliMs = d.getTime() + 2 * 60 * 60 * 1000;
  return new Date(kigaliMs).toISOString().slice(0, 10);
}

/**
 * Checks current daily message usage for a user
 */
export async function checkDailyUsage(
  userId: string,
  dateStr?: string
): Promise<DailyUsageStatus> {
  const date = dateStr || getKigaliDateString();
  const cap = env.server.AI_DAILY_MESSAGE_CAP;
  let count = 0;

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") &&
    process.env.NODE_ENV !== "test";

  if (isConfigured) {
    try {
      const service = createServiceClient();
      const { data } = await service
        .from("ai_usage")
        .select("messages")
        .eq("user_id", userId)
        .eq("day", date)
        .maybeSingle();

      if (data && typeof data.messages === "number") {
        count = data.messages;
      } else {
        const fallbackKey = `${userId}:${date}`;
        count = fallbackUsageMap.get(fallbackKey) || 0;
      }
    } catch {
      const fallbackKey = `${userId}:${date}`;
      count = fallbackUsageMap.get(fallbackKey) || 0;
    }
  } else {
    const fallbackKey = `${userId}:${date}`;
    count = fallbackUsageMap.get(fallbackKey) || 0;
  }

  const remaining = Math.max(0, cap - count);
  const allowed = count < cap;

  return {
    count,
    cap,
    remaining,
    allowed,
    resetTime: "midnight Kigali time",
  };
}

/**
 * Increments daily message usage for a user after successful inference
 */
export async function incrementDailyUsage(
  userId: string,
  dateStr?: string,
  tokensUsed: number = 0
): Promise<number> {
  const date = dateStr || getKigaliDateString();
  let newCount = 1;

  const isConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") &&
    process.env.NODE_ENV !== "test";

  if (isConfigured) {
    try {
      const service = createServiceClient();

      const { data: existing } = await service
        .from("ai_usage")
        .select("messages, tokens")
        .eq("user_id", userId)
        .eq("day", date)
        .maybeSingle();

      if (existing) {
        newCount = (existing.messages || 0) + 1;
        const totalTokens = (existing.tokens || 0) + tokensUsed;
        await service
          .from("ai_usage")
          .update({
            messages: newCount,
            tokens: totalTokens,
          })
          .eq("user_id", userId)
          .eq("day", date);
      } else {
        newCount = 1;
        await service.from("ai_usage").insert({
          user_id: userId,
          day: date,
          messages: 1,
          tokens: tokensUsed,
        });
      }
    } catch {
      const fallbackKey = `${userId}:${date}`;
      const curr = fallbackUsageMap.get(fallbackKey) || 0;
      newCount = curr + 1;
      fallbackUsageMap.set(fallbackKey, newCount);
    }
  } else {
    const fallbackKey = `${userId}:${date}`;
    const curr = fallbackUsageMap.get(fallbackKey) || 0;
    newCount = curr + 1;
    fallbackUsageMap.set(fallbackKey, newCount);
  }

  return newCount;
}

/**
 * Helper to reset usage for testing
 */
export function _resetFallbackUsageForTesting() {
  fallbackUsageMap.clear();
}
