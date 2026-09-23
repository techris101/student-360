"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function exportUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User is not authenticated." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id);

  const { data: reviews } = await supabase
    .from("progress_reviews")
    .select("*")
    .eq("user_id", user.id);

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile || null,
    applications: applications || [],
    reviews: reviews || [],
  };

  return { data: exportPayload };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User is not authenticated." };
  }

  try {
    // If Supabase service client is configured, remove storage files and user
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const service = createServiceClient();
      // Remove CV from private bucket
      await service.storage.from("cvs").remove([`${user.id}/cv.pdf`]);
      // Remove user record
      await service.auth.admin.deleteUser(user.id);
    } else {
      // Local fallback: remove profile row
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    console.error("Delete account error:", err);
    return { error: "Failed to delete account. Please try again." };
  }
}
