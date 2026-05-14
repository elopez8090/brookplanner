import type { AdminAuditLogDateRange } from "@/lib/admin/types";

export const AUDIT_DATE_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any time" },
  { value: "today", label: "Today (UTC)" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export function parseAuditDateRangeParam(value: string | undefined): AdminAuditLogDateRange | null {
  if (value === "today" || value === "7d" || value === "30d") {
    return value;
  }
  return null;
}

/** Lower bound (inclusive) for list + summary "in range" stats, or null for all time. */
export function auditSinceIso(range: AdminAuditLogDateRange | null): string | null {
  if (!range) {
    return null;
  }
  const now = new Date();
  if (range === "today") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  }
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 86400000).toISOString();
}

export function startOfTodayUtcIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}
