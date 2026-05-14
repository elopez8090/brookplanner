import type { AdminAuditLogDateRange, AdminAuditLogSummary } from "@/lib/admin/types";

type Props = {
  summary: AdminAuditLogSummary;
  dateRange: AdminAuditLogDateRange | null;
};

function formatCount(n: number): string {
  return n.toLocaleString();
}

export function AdminAuditSummaryCards({ summary, dateRange }: Props) {
  const rangeHint = dateRange
    ? "Admin and credit totals use the date range above (UTC)."
    : "Admin and credit totals are all-time (UTC).";

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Total logs</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{formatCount(summary.totalMatching)}</p>
          <p className="mt-1 text-xs leading-relaxed text-brand-navy-muted">
            Count for the action, entity, and date filters applied to the list below.
          </p>
        </article>
        <article className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Logs today (UTC)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{formatCount(summary.logsTodayUtc)}</p>
          <p className="mt-1 text-xs leading-relaxed text-brand-navy-muted">
            All entries since midnight UTC today, ignoring action and entity filters.
          </p>
        </article>
        <article className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Admin actions</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{formatCount(summary.adminActionsInRange)}</p>
          <p className="mt-1 text-xs leading-relaxed text-brand-navy-muted">Events where the actor role is admin.</p>
        </article>
        <article className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Credit-related</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">{formatCount(summary.creditActionsInRange)}</p>
          <p className="mt-1 text-xs leading-relaxed text-brand-navy-muted">Credit grants and non-promo adjustments.</p>
        </article>
      </div>
      <p className="text-xs text-brand-navy-muted">{rangeHint}</p>
    </div>
  );
}
