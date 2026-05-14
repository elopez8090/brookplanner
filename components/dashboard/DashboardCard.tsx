import type { ReactNode } from "react";

type DashboardCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function DashboardCard({
  title,
  description,
  action,
  children,
  className = "",
  id,
}: DashboardCardProps) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-border-subtle bg-card p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] ${className}`}
    >
      {(title || description || action) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-semibold text-brand-navy">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-brand-navy-muted">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={title || description || action ? "mt-5" : ""}>{children}</div>
    </section>
  );
}
