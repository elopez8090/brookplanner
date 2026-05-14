import type { UserRole } from "@/lib/auth/types";

export function parseRoleFromRow(raw: unknown): UserRole {
  const normalized =
    typeof raw === "string"
      ? raw.trim().toLowerCase()
      : raw != null && typeof raw !== "object"
        ? String(raw).trim().toLowerCase()
        : "";
  if (normalized === "vendor" || normalized === "admin" || normalized === "customer") {
    return normalized;
  }
  return "customer";
}
