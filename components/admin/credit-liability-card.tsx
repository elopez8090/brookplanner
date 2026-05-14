import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { CREDIT_FACE_CENTS, formatCredits, formatUsdCents } from "@/lib/admin/revenue/format";

type CreditLiabilityCardProps = {
  estimatedLiabilityCents: number;
  creditsRemaining: number;
  overviewLoaded: boolean;
};

export function CreditLiabilityCard({
  estimatedLiabilityCents,
  creditsRemaining,
  overviewLoaded,
}: CreditLiabilityCardProps) {
  return (
    <DashboardCard
      title="Unused credit liability"
      description="Balance-sheet style estimate for vendor credits still on wallet, using $5 face value per unused credit."
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-brand-navy-muted">
          Remaining vendor credits represent future platform obligations. Estimated liability uses the same list economics
          as the financial overview.
        </p>
        <div className="rounded-xl bg-gradient-to-br from-brand-navy/[0.04] to-accent-blue/[0.06] p-5 ring-1 ring-border-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy-muted">Unused Credit Liability</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-brand-navy">
            {overviewLoaded ? formatUsdCents(estimatedLiabilityCents) : "—"}
          </p>
          <p className="mt-2 text-sm text-brand-navy-muted">
            {overviewLoaded ? (
              <>
                {formatCredits(creditsRemaining)} unused credits × {formatUsdCents(CREDIT_FACE_CENTS)} per credit.
              </>
            ) : (
              "Overview not loaded."
            )}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
