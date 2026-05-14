import { isAccountRestrictedStatus, normalizeProfileStatus } from "@/lib/auth/accountStatus";
import { dashboardPathForRole } from "@/lib/auth/dashboardPaths";
import type { Profile } from "@/lib/auth/types";

export type NoProfileRedirectTarget = "register" | "login";

/**
 * Returns the path to send a user after authentication or when resolving "home" dashboard.
 * - Has profile → role dashboard (`/customer/dashboard`, `/vendor/dashboard`, `/admin/dashboard`)
 * - Restricted profile → `/account-suspended`
 * - No profile → `/register` or `/login` per options (default: register)
 */
export function postAuthRedirectPath(
  profile: (Pick<Profile, "role"> & Partial<Pick<Profile, "status">>) | null,
  options?: { noProfile?: NoProfileRedirectTarget }
): string {
  if (!profile) {
    return (options?.noProfile ?? "register") === "login" ? "/login" : "/register";
  }
  const status = normalizeProfileStatus(profile.status);
  if (isAccountRestrictedStatus(status)) {
    return "/account-suspended";
  }
  return dashboardPathForRole(profile.role);
}
