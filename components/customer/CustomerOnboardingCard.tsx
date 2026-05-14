import type {
  CustomerAccountJourneyPhase,
  CustomerOnboardingAccountStep,
} from "@/lib/events/presentation";
import { ButtonLink } from "@/components/ui/ButtonLink";

type CustomerOnboardingCardProps = {
  phase: CustomerAccountJourneyPhase;
  steps: CustomerOnboardingAccountStep[];
  journeyTitle: string;
  journeyDescription: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

function stepRing(state: CustomerOnboardingAccountStep["state"]) {
  if (state === "done") {
    return "border-emerald-500 bg-emerald-50 text-emerald-800";
  }
  if (state === "current") {
    return "border-accent-coral bg-accent-coral/10 text-brand-navy ring-2 ring-accent-coral/35";
  }
  return "border-border-subtle bg-brand-navy/[0.04] text-brand-navy-muted";
}

export function CustomerOnboardingCard({
  phase,
  steps,
  journeyTitle,
  journeyDescription,
  primaryCta,
  secondaryCta,
}: CustomerOnboardingCardProps) {
  return (
    <section
      className="rounded-2xl border border-accent-coral/25 bg-gradient-to-br from-accent-coral/[0.07] via-white to-accent-blue/[0.06] p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:p-8"
      aria-labelledby="customer-onboarding-heading"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Your next steps</p>
          <h2 id="customer-onboarding-heading" className="text-xl font-bold tracking-tight text-brand-navy sm:text-2xl">
            {journeyTitle}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">{journeyDescription}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <ButtonLink href={primaryCta.href} className="w-full justify-center px-6 sm:w-auto lg:min-w-[12rem]">
            {primaryCta.label}
          </ButtonLink>
          {secondaryCta ? (
            <ButtonLink href={secondaryCta.href} variant="secondary" className="w-full justify-center sm:w-auto lg:min-w-[12rem]">
              {secondaryCta.label}
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border-subtle bg-white/90 px-4 py-5 ring-1 ring-black/[0.02] sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Progress</p>
        <ol className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.id} className="flex min-w-0 flex-col items-center text-center">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${stepRing(step.state)}`}
              >
                {index + 1}
              </span>
              <span className="mt-2 text-[11px] font-semibold uppercase leading-tight tracking-wide text-brand-navy sm:text-xs">
                {step.label}
              </span>
              <span className="mt-1 hidden text-[11px] leading-snug text-brand-navy-muted sm:line-clamp-3 sm:min-h-[2.5rem] sm:px-0.5 lg:block">
                {step.hint}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {phase === "vendor_selected" ? (
        <p className="mt-4 text-xs leading-relaxed text-brand-navy-muted">
          Nothing is final until you and your vendor confirm details — use messages to align on timing, scope, and day-of logistics.
        </p>
      ) : null}
    </section>
  );
}
