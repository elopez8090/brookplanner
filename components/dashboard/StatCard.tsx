import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "accent" | "warning";
};

export function StatCard({ label, value, hint, icon, tone = "default" }: StatCardProps) {
  const toneClass =
    tone === "accent"
      ? "border-accent-blue/25 bg-gradient-to-br from-white to-accent-blue/[0.06] ring-accent-blue/10"
      : tone === "warning"
        ? "border-amber-200/90 bg-gradient-to-br from-amber-50/50 to-card ring-amber-300/25"
        : "border-border-subtle bg-card ring-black/[0.03]";

  return (
    <div className={`rounded-2xl border p-6 shadow-[var(--shadow-card)] ring-1 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy-muted">{label}</p>
        {icon ? <span className="text-accent-blue/90">{icon}</span> : null}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-brand-navy sm:text-3xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-brand-navy-muted">{hint}</p> : null}
    </div>
  );
}
