import type { CustomerEventJourneyStep } from "@/lib/events/presentation";

type CustomerEventJourneyProps = {
  steps: CustomerEventJourneyStep[];
  /** Visually compact row for cards */
  compact?: boolean;
};

function stepRing(state: CustomerEventJourneyStep["state"]) {
  if (state === "done") {
    return "border-emerald-500 bg-emerald-50 text-emerald-800";
  }
  if (state === "current") {
    return "border-accent-coral bg-accent-coral/10 text-brand-navy ring-2 ring-accent-coral/35";
  }
  return "border-border-subtle bg-brand-navy/[0.04] text-brand-navy-muted";
}

export function CustomerEventJourney({ steps, compact }: CustomerEventJourneyProps) {
  return (
    <div
      className={
        compact
          ? "rounded-xl border border-border-subtle bg-white/80 px-3 py-3 sm:px-4"
          : "rounded-2xl border border-border-subtle bg-card px-4 py-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] sm:px-6"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Your progress</p>
      <div className={compact ? "mt-3" : "mt-4"}>
        <ol className="grid grid-cols-4 gap-1 sm:gap-2">
          {steps.map((step, index) => (
            <li key={step.id} className="relative flex min-w-0 flex-col items-center text-center">
              <span
                className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold sm:h-9 sm:w-9 ${stepRing(step.state)}`}
              >
                {index + 1}
              </span>
              <span className="mt-1.5 w-full truncate px-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy sm:text-xs">
                {step.label}
              </span>
              {!compact ? (
                <span className="mt-1 hidden text-[11px] leading-snug text-brand-navy-muted sm:line-clamp-3 sm:min-h-[2.75rem] sm:px-0.5">
                  {step.hint}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
