import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { MarketplaceReadinessResult } from "@/lib/vendor-onboarding/marketplaceReadiness";

type VendorOnboardingExperienceProps = {
  businessName: string | null | undefined;
  readiness: MarketplaceReadinessResult;
  /** Marketplace profile checklist percent (logo, bio, optional socials, etc.). */
  profileCompletionPercent: number;
  isStrictFirstTime: boolean;
};

function tierBadgeClass(tier: MarketplaceReadinessResult["tier"]): string {
  if (tier === "beginner") {
    return "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
  }
  return "bg-accent-blue/15 text-accent-blue ring-1 ring-accent-blue/25";
}

export function VendorOnboardingExperience({
  businessName,
  readiness,
  profileCompletionPercent,
  isStrictFirstTime,
}: VendorOnboardingExperienceProps) {
  if (readiness.tier === "marketplace_ready") {
    return null;
  }

  const greet = businessName?.trim() ? businessName.trim() : "there";

  return (
    <section
      className="overflow-hidden rounded-2xl border border-accent-blue/20 bg-gradient-to-br from-accent-blue/[0.08] via-white to-white shadow-sm"
      aria-labelledby="vendor-onboarding-heading"
    >
      <div className="border-b border-accent-blue/15 bg-white/60 px-4 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-blue">
          {isStrictFirstTime ? "Welcome" : "Marketplace setup"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 id="vendor-onboarding-heading" className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">
            {isStrictFirstTime ? `Hi ${greet} — let’s launch your vendor presence` : `Hi ${greet} — you are almost marketplace-ready`}
          </h2>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${tierBadgeClass(readiness.tier)}`}>
            {readiness.tierLabel}
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-navy-muted">
          Complete the short checklist so hosts see a trustworthy business, you can unlock quotes with credits, and you can respond while
          opportunities are fresh.
        </p>
      </div>

      <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-brand-navy">Marketplace readiness</p>
              <p className="text-sm font-bold tabular-nums text-brand-navy">
                {readiness.metCount}/{readiness.totalSignals}
              </p>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-accent-blue transition-[width]"
                style={{ width: `${readiness.percentRounded}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-brand-navy-muted">
              Profile page checklist:{" "}
              <span className="font-semibold text-brand-navy tabular-nums">{profileCompletionPercent}%</span>
              <Link href="/vendor/profile" className="ml-2 font-semibold text-accent-blue underline-offset-2 hover:underline">
                Edit profile
              </Link>
            </p>
          </div>

          {readiness.nextStep ? (
            <div className="rounded-xl border border-border-subtle bg-white/90 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Suggested next step</p>
              <p className="mt-1 text-sm font-semibold text-brand-navy">{readiness.nextStep.label}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink href={readiness.nextStep.href}>Go to step</ButtonLink>
                <ButtonLink href="/vendor/leads" variant="secondary">
                  Browse leads
                </ButtonLink>
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-semibold text-brand-navy">Onboarding checklist</p>
          <ul className="mt-3 space-y-2">
            {readiness.checklist.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors hover:bg-slate-50 ${
                    item.done ? "border-emerald-200/80 bg-emerald-50/40" : "border-border-subtle bg-white/80"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.done ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white text-slate-500"
                    }`}
                    aria-hidden
                  >
                    {item.done ? "✓" : ""}
                  </span>
                  <span className={item.done ? "text-brand-navy-muted line-through" : "font-medium text-brand-navy"}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
