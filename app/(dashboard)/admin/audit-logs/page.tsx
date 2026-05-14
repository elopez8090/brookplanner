import type { Metadata } from "next";
import { AdminAuditActivityTimeline } from "@/components/admin/AdminAuditActivityTimeline";
import { AdminAuditSummaryCards } from "@/components/admin/AdminAuditSummaryCards";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { AUDIT_ACTION_FILTER_OPTIONS, AUDIT_ENTITY_FILTER_OPTIONS } from "@/lib/admin/auditFilters";
import { AUDIT_DATE_RANGE_OPTIONS, parseAuditDateRangeParam } from "@/lib/admin/auditLogDateRange";
import { fetchAdminAuditLogSummary, fetchAdminAuditLogs } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin · Audit logs",
};

type PageProps = {
  searchParams?: Promise<{ action?: string; entity?: string; range?: string }>;
};

export default async function AdminAuditLogsPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const action = typeof sp.action === "string" ? sp.action : "";
  const entity = typeof sp.entity === "string" ? sp.entity : "";
  const rangeParam = typeof sp.range === "string" ? sp.range : "";
  const dateRange = parseAuditDateRangeParam(rangeParam);

  const [rows, summary] = await Promise.all([
    fetchAdminAuditLogs({
      action: action || null,
      entityType: entity || null,
      dateRange,
      limit: 100,
    }),
    fetchAdminAuditLogSummary({
      action: action || null,
      entityType: entity || null,
      dateRange,
    }),
  ]);

  const hasFilters = Boolean(action || entity || rangeParam);
  const emptyMode =
    rows.length === 0 && hasFilters ? ("filtered" as const) : ("none" as const);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Audit logs</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
              Latest platform actions for diagnostics and accountability. Data is read with admin access; writes are
              database-enforced (no direct client inserts).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/platform-health" variant="secondary" className="shrink-0">
              Platform health
            </ButtonLink>
          </div>
        </div>
      </header>

      <section aria-labelledby="audit-summary-heading" className="space-y-3">
        <h3 id="audit-summary-heading" className="text-sm font-semibold text-brand-navy">
          Summary
        </h3>
        <AdminAuditSummaryCards summary={summary} dateRange={dateRange} />
      </section>

      <section aria-labelledby="audit-filters-heading" className="rounded-xl border border-brand-navy/10 bg-white p-4 shadow-sm">
        <h3 id="audit-filters-heading" className="sr-only">
          Filters
        </h3>
        <form action="/admin/audit-logs" method="get" className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-brand-navy">
            Action
            <select
              name="action"
              defaultValue={action}
              className="rounded-lg border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy shadow-sm"
            >
              {AUDIT_ACTION_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || "all-action"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-brand-navy">
            Entity type
            <select
              name="entity"
              defaultValue={entity}
              className="rounded-lg border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy shadow-sm"
            >
              {AUDIT_ENTITY_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || "all-entity"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-brand-navy">
            Date range
            <select
              name="range"
              defaultValue={rangeParam}
              className="rounded-lg border border-brand-navy/15 bg-white px-3 py-2 text-sm text-brand-navy shadow-sm"
            >
              {AUDIT_DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value || "all-range"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy/90"
            >
              Apply filters
            </button>
            {hasFilters ? (
              <ButtonLink href="/admin/audit-logs" variant="secondary">
                Clear
              </ButtonLink>
            ) : null}
          </div>
        </form>
      </section>

      <section aria-labelledby="audit-timeline-heading" className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 id="audit-timeline-heading" className="text-sm font-semibold text-brand-navy">
            Activity timeline
          </h3>
          <p className="text-xs text-brand-navy-muted">Up to 100 entries per page, newest first.</p>
        </div>
        <AdminAuditActivityTimeline rows={rows} emptyMode={emptyMode} totalMatching={summary.totalMatching} />
      </section>
    </div>
  );
}
