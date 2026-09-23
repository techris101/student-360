"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ApplicationStatus, Database } from "@/lib/supabase/types";

export async function updateApplicationStatus(
  opportunityId: string,
  toStatus: ApplicationStatus,
  notes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Return simulated success for test sessions / unauthenticated previews
    return { success: true, simulated: true, status: toStatus };
  }

  const serviceClient = createServiceClient();
  const now = new Date().toISOString();

  // 1. Get existing application to know from_status
  const { data: existingApp } = await serviceClient
    .from("applications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  const fromStatus = existingApp?.status || null;

  // 2. Upsert application
  const appInsert: Database["public"]["Tables"]["applications"]["Insert"] = {
    user_id: user.id,
    opportunity_id: opportunityId,
    status: toStatus,
    notes: notes ?? (existingApp ? undefined : null),
    updated_at: now,
  };

  const { data: appData, error: appError } = await serviceClient
    .from("applications")
    .upsert(appInsert, { onConflict: "user_id,opportunity_id" })
    .select("id")
    .single();

  if (appError) {
    throw new Error(`Failed to update application: ${appError.message}`);
  }

  const applicationId = appData.id;

  // 3. Write application event log
  await serviceClient.from("application_events").insert({
    application_id: applicationId,
    from_status: fromStatus,
    to_status: toStatus,
    created_at: now,
  });

  // 4. Auto-join cohort if applying or submitted (PRODUCT F3)
  if (toStatus === "applying" || toStatus === "submitted") {
    try {
      // Find or create cohort for this opportunity
      let { data: cohort } = await serviceClient
        .from("cohorts")
        .select("id")
        .eq("opportunity_id", opportunityId)
        .maybeSingle();

      if (!cohort) {
        const { data: newCohort } = await serviceClient
          .from("cohorts")
          .insert({
            opportunity_id: opportunityId,
            created_at: now,
          })
          .select("id")
          .single();
        cohort = newCohort;
      }

      if (cohort) {
        // Upsert cohort membership
        const memberInsert: Database["public"]["Tables"]["cohort_members"]["Insert"] = {
          cohort_id: cohort.id,
          user_id: user.id,
          joined_at: now,
          left_at: null,
        };
        await serviceClient
          .from("cohort_members")
          .upsert(memberInsert, { onConflict: "cohort_id,user_id" });
      }
    } catch (err: unknown) {
      console.warn("Cohort auto-join warning:", err instanceof Error ? err.message : err);
    }
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/progress");
  revalidatePath("/cohorts");

  return { success: true, status: toStatus };
}
