import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/auth/types";
import { isAccountRestrictedStatus } from "@/lib/auth/accountStatus";
import { fetchOrEnsureProfileWithMeta } from "@/lib/auth/ensureProfile";
import { notifyAdminNewVendorAfterClientSignup } from "@/lib/email/adminVendorSignupAction";
import { dashboardPathForRole } from "@/lib/auth/dashboardPaths";
import { postAuthRedirectPath } from "@/lib/auth/roleRedirect";
import { serverWarn } from "@/lib/logging/serverLog";

export type { Profile, UserRole } from "@/lib/auth/types";

/** Session user only (no profile query). */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

export async function getUserProfile(): Promise<{
  user: User | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { profile, profileCreated } = await fetchOrEnsureProfileWithMeta(supabase, user);

  if (profileCreated && profile?.role === "vendor") {
    void notifyAdminNewVendorAfterClientSignup();
  }

  if (process.env.NODE_ENV === "development" && !profile) {
    serverWarn("AUTH", "No profile after fetch + ensure (development)", {
      redirectWouldBe: "/register",
    });
  }

  return { user, profile };
}

/** Redirects to `/login` when there is no session; returns the authenticated user. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Ensures the visitor is signed in, has a profile, and matches `role`.
 * - Not logged in → `/login`
 * - No profile row (and could not create from metadata) → `/register`
 * - Wrong role → that role’s dashboard
 */
export async function requireRole(role: UserRole): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await getUserProfile();
  if (!user) {
    redirect("/login");
  }
  if (!profile) {
    redirect(postAuthRedirectPath(null, { noProfile: "register" }));
  }
  if (profile.role !== role) {
    redirect(dashboardPathForRole(profile.role));
  }
  if (isAccountRestrictedStatus(profile.status)) {
    redirect("/account-suspended");
  }
  return { user, profile };
}
