import type { AdminAuditLogRow } from "@/lib/admin/types";
import { Badge } from "@/components/ui/Badge";
import {
  getAuditActionBadge,
  humanizeAuditMetadata,
  prettyJsonForAudit,
  titleCaseAction,
} from "@/lib/admin/auditLogPresentation";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export type AdminAuditTimelineEmptyMode = "none" | "filtered";

type Props = {
  rows: AdminAuditLogRow[];
  emptyMode: AdminAuditTimelineEmptyMode;
  totalMatching?: number;
};

export function AdminAuditActivityTimeline({ rows, emptyMode, totalMatching }: Props) {
  if (rows.length === 0 && emptyMode === "filtered") {
    return (
      <div
        className="rounded-xl border border-dashed border-brand-navy/15 bg-white/60 px-6 py-14 text-center"
        role="status"
      >
        <p className="text-sm font-semibold text-brand-navy">No logs match these filters</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-navy-muted">
          Try clearing the action or entity filter, widening the date range, or choosing a different combination. Audit
          entries only go back as far as data exists in the log.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-brand-navy/15 bg-white/60 px-6 py-14 text-center"
        role="status"
      >
        <p className="text-sm font-semibold text-brand-navy">No audit activity yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-navy-muted">
          Actions such as quote decisions, credit grants, and vendor listing changes will appear here as they occur.
        </p>
      </div>
    );
  }

  const showTotalHint =
    typeof totalMatching === "number" && totalMatching > rows.length ? `Showing ${rows.length} of ${totalMatching}` : null;

  return (
    <div className="space-y-2">
      {showTotalHint ? (
        <p className="text-xs text-brand-navy-muted" role="status">
          {showTotalHint} matching entries (newest first).
        </p>
      ) : null}
      <ol className="relative space-y-0 border-l border-brand-navy/15 pl-6">
        {rows.map((row) => {
          const badge = getAuditActionBadge(row);
          const detailLines = humanizeAuditMetadata(row);
          const hasMeta = row.metadata && Object.keys(row.metadata).length > 0;
          const rawJson = hasMeta ? prettyJsonForAudit(row.metadata) : null;

          return (
            <li key={row.id} className="pb-8 last:pb-0">
              <span
                className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-accent-blue ring-4 ring-white"
                aria-hidden
              />
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-navy-muted">{formatWhen(row.created_at)}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
                  <p className={`text-sm font-semibold text-brand-navy ${badge ? "text-brand-navy/90" : ""}`}>
                    {badge ? <span className="font-mono text-xs font-normal text-brand-navy-muted">{row.action}</span> : titleCaseAction(row.action)}
                  </p>
                </div>
                <p className="text-xs text-brand-navy-muted">
                  {row.entity_type ? (
                    <>
                      Entity: <span className="font-medium text-brand-navy">{row.entity_type}</span>
                      {row.entity_id ? (
                        <>
                          {" "}
                          <span className="font-mono text-[11px] text-brand-navy/80">{row.entity_id}</span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    "No entity"
                  )}
                </p>
                <p className="text-xs text-brand-navy-muted">
                  Actor:{" "}
                  {row.actor_id ? (
                    <>
                      <span className="font-mono text-[11px] text-brand-navy/80">{row.actor_id}</span>
                      {row.actor_role ? (
                        <span className="text-brand-navy-muted">
                          {" "}
                          ({row.actor_role})
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
                {detailLines.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs leading-relaxed text-brand-navy">
                    {detailLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                {rawJson ? (
                  <details className="mt-1 rounded-lg border border-brand-navy/10 bg-slate-50/80 text-left">
                    <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-brand-navy hover:bg-slate-100/80">
                      Raw metadata (JSON)
                    </summary>
                    <pre className="max-h-48 overflow-auto border-t border-brand-navy/10 p-3 text-[11px] leading-snug text-brand-navy/90">
                      {rawJson}
                    </pre>
                  </details>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
