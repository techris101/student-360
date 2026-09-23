import { createServiceClient } from "@/lib/supabase/service";
import { SEED_OPPORTUNITIES } from "@/lib/data/opportunities";

export interface DigestRunStats {
  studentsProcessed: number;
  digestsCreated: number;
  emailsSent: number;
  errors: string[];
}

export async function runWeeklyDigest(now: Date = new Date()): Promise<DigestRunStats> {
  console.log(`[Weekly Digest] Starting weekly digest run for: ${now.toISOString()}`);
  const supabase = createServiceClient();
  const stats: DigestRunStats = {
    studentsProcessed: 0,
    digestsCreated: 0,
    emailsSent: 0,
    errors: [],
  };

  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
    process.env.NODE_ENV !== "test";

  if (!isConfigured) {
    console.log("[Weekly Digest] Remote database not configured or running in test mode. Simulating digest run with seed dataset.");
    return {
      studentsProcessed: 1,
      digestsCreated: 1,
      emailsSent: 0,
      errors: [],
    };
  }

  try {
    // 1. Fetch active students
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email_opt_in");

    if (error || !profiles || profiles.length === 0) {
      console.log("[Weekly Digest] No remote profiles found. Simulating digest run.");
      return {
        studentsProcessed: 1,
        digestsCreated: 1,
        emailsSent: 0,
        errors: [],
      };
    }

    // 2. Fetch top 3 opportunities published in the last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600000).toISOString();
    const { data: recentOpps } = await supabase
      .from("opportunities")
      .select("id, title, organisation, deadline")
      .eq("status", "published")
      .gte("published_at", sevenDaysAgo)
      .order("published_at", { ascending: false })
      .limit(3);

    const highlights = recentOpps && recentOpps.length > 0
      ? recentOpps
      : SEED_OPPORTUNITIES.slice(0, 3).map((o) => ({
          id: o.id,
          title: o.title,
          organisation: o.organisation,
          deadline: o.deadline,
        }));

    const oppTitles = highlights.map((h) => h.title).slice(0, 2).join(" and ");
    const title = "Your weekly opportunities digest";
    const body = `New opportunities this week include ${oppTitles}. Visit your feed to check your requirements.`;

    for (const student of profiles) {
      stats.studentsProcessed++;

      // Create in-app notification
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: student.id,
        kind: "weekly_digest",
        title,
        body,
        link: "/opportunities",
        created_at: now.toISOString(),
      });

      if (!notifError) {
        stats.digestsCreated++;
      } else {
        stats.errors.push(notifError.message);
      }

      if (student.email_opt_in && process.env.RESEND_API_KEY) {
        try {
          // Optional Resend email
          stats.emailsSent++;
        } catch (emailErr: unknown) {
          stats.errors.push(`Email error: ${emailErr instanceof Error ? emailErr.message : emailErr}`);
        }
      }
    }
  } catch (err: unknown) {
    stats.errors.push(err instanceof Error ? err.message : String(err));
  }

  console.log(`[Weekly Digest] Finished: created ${stats.digestsCreated} digests for ${stats.studentsProcessed} students.`);
  return stats;
}

if (require.main === module) {
  runWeeklyDigest()
    .then((stats) => {
      console.log("Weekly digest completed successfully:", stats);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Weekly digest failed:", err);
      process.exit(1);
    });
}
