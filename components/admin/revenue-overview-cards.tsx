import { StatCard } from "@/components/dashboard/StatCard";
import type { AdminRevenueOverview } from "@/lib/admin/types";
import { CREDIT_FACE_CENTS, formatCredits, formatInt, formatUsdCents } from "@/lib/admin/revenue/format";

const ZERO_OVERVIEW: AdminRevenueOverview = {
  totalRevenueCents: 0,
  totalCreditPurchases: 0,
  totalCreditsSold: 0,
  totalPromotionalCredits: 0,
  totalCreditsSpent: 0,
  totalCreditsRemaining: 0,
  estimatedCreditLiabilityCents: 0,
  activePayingVendors: 0,
  averagePurchaseValueCents: 0,
};

type RevenueOverviewCardsProps = {
  overview: AdminRevenueOverview | null;
};

export function RevenueOverviewCards({ overview }: RevenueOverviewCardsProps) {
  const o = overview ?? ZERO_OVERVIEW;
  const loadFailed = !overview;

  return (
    <section aria-labelledby="revenue-overview-heading" className="space-y-4">
      <h3 id="revenue-overview-heading" className="text-sm font-semibold text-brand-navy">
        Financial overview
      </h3>
      {loadFailed ? (
        <p className="text-sm text-amber-800">
          Overview metrics could not be loaded. Check that migrations are applied and you are signed in as admin.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue Collected"
          value={formatUsdCents(o.totalRevenueCents)}
          hint="Completed credit pack checkouts (Stripe), in USD"
        />
        <StatCard
          label="Paid Credit Purchases"
          value={formatInt(o.totalCreditPurchases)}
          hint="Count of completed checkouts"
        />
        <StatCard
          label="Credits Sold"
          value={formatCredits(o.totalCreditsSold)}
          hint="Credits granted from paid purchases"
        />
        <StatCard
          label="Promo / Bonus Credits"
          value={formatCredits(o.totalPromotionalCredits)}
          hint="Admin grants and bonuses (excluded from paid-credit revenue)"
        />
        <StatCard
          label="Credits Spent"
          value={formatCredits(o.totalCreditsSpent)}
          hint="Credits consumed on submitted quotes (category requirements)"
        />
        <StatCard
          label="Unused Credit Liability"
          value={!loadFailed ? formatUsdCents(o.estimatedCreditLiabilityCents) : "—"}
          hint={
            !loadFailed
              ? `${formatCredits(o.totalCreditsRemaining)} unused credits × ${formatUsdCents(CREDIT_FACE_CENTS)} face value`
              : "Could not load liability estimate"
          }
        />
        <StatCard
          label="Active Paying Vendors"
          value={formatInt(o.activePayingVendors)}
          hint="Vendors with at least one completed purchase"
        />
        <StatCard
          label="Average Purchase Value"
          value={o.totalCreditPurchases > 0 ? formatUsdCents(o.averagePurchaseValueCents) : "—"}
          hint={o.totalCreditPurchases > 0 ? "Mean revenue per completed checkout" : "No completed purchases yet"}
        />
      </div>
    </section>
  );
}
