import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { AdminCreditActivityBreakdown } from "@/lib/admin/types";
import { formatCredits, formatUsdCents } from "@/lib/admin/revenue/format";

const ZERO: AdminCreditActivityBreakdown = {
  purchasedCredits: 0,
  promotionalCredits: 0,
  spentCredits: 0,
  remainingCredits: 0,
  liabilityCents: 0,
};

type CreditActivityBreakdownProps = {
  breakdown: AdminCreditActivityBreakdown | null;
};

export function CreditActivityBreakdown({ breakdown }: CreditActivityBreakdownProps) {
  const b = breakdown ?? ZERO;
  const loadFailed = !breakdown;
  const isEmpty =
    b.purchasedCredits === 0 &&
    b.promotionalCredits === 0 &&
    b.spentCredits === 0 &&
    b.remainingCredits === 0 &&
    b.liabilityCents === 0;

  return (
    <DashboardCard
      title="Credit activity breakdown"
      description="Paid credits sold, promo and bonus grants, credits spent on quotes, outstanding vendor credits, and unused credit liability at $5 per credit."
    >
      {loadFailed ? (
        <p className="text-sm text-amber-800">
          Breakdown could not be loaded. Check that migrations are applied and you are signed in as admin.
        </p>
      ) : null}
      {!loadFailed && isEmpty ? (
        <p className="text-sm text-brand-navy-muted">
          No credit movement yet: no completed purchases, quote spend, or vendor balances in aggregate.
        </p>
      ) : null}
      {!loadFailed && !isEmpty ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Credits Sold", value: formatCredits(b.purchasedCredits) },
            { label: "Promo / Bonus Credits", value: formatCredits(b.promotionalCredits) },
            { label: "Credits Spent", value: formatCredits(b.spentCredits) },
            { label: "Outstanding vendor credits", value: formatCredits(b.remainingCredits) },
            { label: "Unused Credit Liability", value: formatUsdCents(b.liabilityCents) },
          ].map((cell) => (
            <div key={cell.label} className="rounded-xl border border-border-subtle bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy-muted">{cell.label}</p>
              <p className="mt-2 text-lg font-bold tabular-nums text-brand-navy">{cell.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </DashboardCard>
  );
}
