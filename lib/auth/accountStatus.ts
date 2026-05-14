import type { ProfileStatus } from "@/lib/auth/types";

export function normalizeProfileStatus(raw: string | null | undefined): ProfileStatus {
  if (raw === "suspended" || raw === "deactivated") {
    return raw;
  }
  return "active";
}

export function isAccountRestrictedStatus(status: ProfileStatus): boolean {
  return status !== "active";
}
