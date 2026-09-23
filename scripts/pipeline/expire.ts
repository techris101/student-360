import { createServiceClient } from "@/lib/supabase/service";
import { getTodayKigali } from "@/lib/pipeline/filter";

export interface ExpireResult {
  expiredCount: number;
  recheckedCount: number;
}

/**
 * Expire past-deadline opportunities and identify items needing re-check
 */
export async function runExpirationRoutine(): Promise<ExpireResult> {
  const today = getTodayKigali();
  const supabase = createServiceClient();

  let expiredCount = 0;
  let recheckedCount = 0;

  try {
    // 1. Mark past-deadline items as 'expired'
    const { data: expiredItems, error: expireError } = await supabase
      .from("opportunities")
      .update({ status: "expired" })
      .lt("deadline", today)
      .eq("deadline_rolling", false)
      .neq("status", "expired")
      .select("id");

    if (expireError) {
      console.warn(`[Expire] Notice on remote update:`, expireError.message);
    } else if (expiredItems) {
      expiredCount = expiredItems.length;
    }

    // 2. Identify items older than 7 days needing deadline re-check
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: itemsToRecheck, error: recheckError } = await supabase
      .from("opportunities")
      .select("id, official_url, last_checked_at")
      .eq("status", "published")
      .lt("last_checked_at", sevenDaysAgo)
      .limit(20);

    if (!recheckError && itemsToRecheck) {
      recheckedCount = itemsToRecheck.length;
    }

    console.log(`[Expire] Routine completed: ${expiredCount} opportunities expired, ${recheckedCount} items flagged for 7-day recheck.`);
  } catch (err: any) {
    console.error(`[Expire] Error running expiration routine:`, err?.message || err);
  }

  return { expiredCount, recheckedCount };
}
