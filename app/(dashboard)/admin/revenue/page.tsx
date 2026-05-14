import type { Metadata } from "next";
import { AdminRevenueQuickLinks } from "@/components/admin/admin-revenue-quick-links";
import { CreditActivityBreakdown } from "@/components/admin/credit-activity-breakdown";
import { CreditLiabilityCard } from "@/components/admin/credit-liability-card";
import { MonthlyRevenueTable } from "@/components/admin/monthly-revenue-table";
import { RevenueOverviewCards } from "@/components/admin/revenue-overview-cards";
import { TopSpendingVendorsTable } from "@/components/admin/top-spending-vendors-table";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CREDIT_FACE_CENTS, CREDIT_FACE_USD } from "@/lib/admin/revenue/format";
import {
  fetchAdminCreditActivityBreakdown,
  fetchAdminMonthlyRevenue,
  fetchAdminRevenueOverview,
  fetchAdminTopSpendingVendors,
} from "@/lib/admin/revenue/queries";
import type { AdminRevenueOverview } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Admin · Revenue",
};

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

export default async function AdminRevenuePage() {
  const [overview, monthly, topVendors, breakdown] = await Promise.all([
    fetchAdminRevenueOverview(),
    fetchAdminMonthlyRevenue(),
    fetchAdminTopSpendingVendors(25),
    fetchAdminCreditActivityBreakdown(),
  ]);

  const o = overview ?? ZERO_OVERVIEW;

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Revenue & financials</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
              Figures below come from security-definer RPCs on your signed-in admin session (no service role on the
              client). Quote spend and unused-credit liability use {CREDIT_FACE_USD.toFixed(0)} dollars of face value per
              credit ({CREDIT_FACE_CENTS}¢), not necessarily Stripe cash paid, unless RPC definitions change.
            </p>
          </div>
          <ButtonLink href="/admin/dashboard" variant="secondary" className="shrink-0 self-start lg:self-auto">
            Back to overview
          </ButtonLink>
        </div>
      </header>

      <AdminRevenueQuickLinks />

      <section
        aria-labelledby="revenue-model-heading"
        className="rounded-xl border border-border-subtle bg-brand-navy/[0.02] p-5 text-sm leading-relaxed text-brand-navy-muted"
      >
        <h3 id="revenue-model-heading" className="text-xs font-semibold uppercase tracking-wider text-brand-navy">
          How revenue is counted
        </h3>
        <p className="mt-2 text-brand-navy">
          Brook Planner revenue comes from vendor credit purchases. Promotional and bonus credits are tracked separately
          from paid credits so financial reports stay accurate.
        </p>
      </section>

      <RevenueOverviewCards overview={overview} />

      <MonthlyRevenueTable rows={monthly} />

      <TopSpendingVendorsTable vendors={topVendors} />

      <CreditActivityBreakdown breakdown={breakdown} />

      <CreditLiabilityCard
        estimatedLiabilityCents={o.estimatedCreditLiabilityCents}
        creditsRemaining={o.totalCreditsRemaining}
        overviewLoaded={Boolean(overview)}
      />
    </div>
  );
}
