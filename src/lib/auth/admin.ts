import { createClient } from "@/lib/supabase/server";

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminList = (process.env.ADMIN_EMAILS || "techris101@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  return adminList.includes(email.trim().toLowerCase());
}

export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  email?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      // In local dev without active remote session, allow localhost developer preview if explicitly allowed
      if (process.env.NODE_ENV === "development") {
        return { isAdmin: true, email: "dev-admin@student360.rw" };
      }
      return { isAdmin: false };
    }

    if (isAdminEmail(user.email)) {
      return { isAdmin: true, email: user.email };
    }

    // Also check role in public.profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile && profile.role === "admin") {
      return { isAdmin: true, email: user.email };
    }

    return { isAdmin: false, email: user.email };
  } catch {
    if (process.env.NODE_ENV === "development") {
      return { isAdmin: true, email: "dev-admin@student360.rw" };
    }
    return { isAdmin: false };
  }
}
