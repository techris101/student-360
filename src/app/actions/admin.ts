"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/supabase/types";

type OpportunityUpdate = Database["public"]["Tables"]["opportunities"]["Update"];
type SourceUpdate = Database["public"]["Tables"]["sources"]["Update"];

export async function approveOpportunity(id: string) {
  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) {
    throw new Error("Unauthorized. Admin access required.");
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const updatePayload: OpportunityUpdate = {
    status: "published",
    published_at: now,
    last_checked_at: now,
  };

  const { error } = await supabase
    .from("opportunities")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to approve: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/review");
  return { success: true };
}

export async function rejectOpportunity(id: string) {
  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) {
    throw new Error("Unauthorized. Admin access required.");
  }

  const supabase = createServiceClient();

  const updatePayload: OpportunityUpdate = {
    status: "rejected",
  };

  const { error } = await supabase
    .from("opportunities")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to reject: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/review");
  return { success: true };
}

export async function updateOpportunityAdmin(
  id: string,
  data: {
    title: string;
    organisation: string;
    official_url: string;
    deadline?: string | null;
    summary: string;
  }
) {
  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) {
    throw new Error("Unauthorized. Admin access required.");
  }

  const supabase = createServiceClient();

  const updatePayload: OpportunityUpdate = {
    title: data.title,
    organisation: data.organisation,
    official_url: data.official_url,
    deadline: data.deadline || null,
    summary: data.summary,
    last_checked_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("opportunities")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/review");
  return { success: true };
}

export async function toggleSourceActive(sourceId: string, active: boolean) {
  const { isAdmin } = await checkAdminAccess();
  if (!isAdmin) {
    throw new Error("Unauthorized. Admin access required.");
  }

  const supabase = createServiceClient();

  const updatePayload: SourceUpdate = { active };

  const { error } = await supabase
    .from("sources")
    .update(updatePayload)
    .eq("id", sourceId);

  if (error) {
    throw new Error(`Failed to toggle source: ${error.message}`);
  }

  revalidatePath("/admin/sources");
  return { success: true };
}
