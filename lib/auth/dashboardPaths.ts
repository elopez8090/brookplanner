import type { UserRole } from "@/lib/auth/types";

/** Canonical dashboard URL for each role (use `dashboardPathForRole` for lookups). */
export const ROLE_DASHBOARD_PATH: Record<UserRole, string> = {
  customer: "/customer/dashboard",
  vendor: "/vendor/dashboard",
  admin: "/admin/dashboard",
};

export function dashboardPathForRole(role: UserRole): string {
  return ROLE_DASHBOARD_PATH[role];
}
