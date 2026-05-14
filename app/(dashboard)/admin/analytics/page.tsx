import type { Metadata } from "next";
import { StatCard } from "@/components/dashboard/StatCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { fetchAdminAnalyticsSnapshot } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin · Analytics",
};

function formatInt(value: number): string {
  return value.toLocaleString();
}

export default async function AdminAnalyticsPage() {
  const analytics = await fetchAdminAnalyticsSnapshot();
  const a = analytics;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Analytics</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
              Marketplace snapshot metrics from secure admin database functions. For credit sales, liability, and spend
              detail, use Revenue & financials.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/revenue" variant="secondary" className="shrink-0">
              Revenue & financials
            </ButtonLink>
            <ButtonLink href="/admin/dashboard" variant="secondary" className="shrink-0">
              Full overview
            </ButtonLink>
          </div>
        </div>
      </header>

      <section aria-labelledby="admin-analytics-metrics-heading" className="space-y-4">
        <h3 id="admin-analytics-metrics-heading" className="text-sm font-semibold text-brand-navy">
          Snapshot
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Total customers" value={a ? formatInt(a.customerTotal) : "—"} hint="Host accounts" />
          <StatCard label="Total vendors" value={a ? formatInt(a.vendorTotal) : "—"} hint="All vendor profiles" />
          <StatCard label="Active vendors" value={a ? formatInt(a.vendorActive) : "—"} hint="Status active" />
          <StatCard label="Suspended users" value={a ? formatInt(a.usersSuspended) : "—"} hint="Accounts suspended" />
          <StatCard label="Total events posted" value={a ? formatInt(a.eventsTotal) : "—"} hint="All statuses" />
          <StatCard label="Open events" value={a ? formatInt(a.eventsOpen) : "—"} hint="Status active" />
          <StatCard label="Completed events" value={a ? formatInt(a.eventsCompleted) : "—"} hint="Status closed" />
          <StatCard label="Total quotes submitted" value={a ? formatInt(a.quotesTotal) : "—"} hint="All time" />
          <StatCard label="Accepted quotes" value={a ? formatInt(a.quotesAccepted) : "—"} hint="Customer accepted" />
          <StatCard label="Declined quotes" value={a ? formatInt(a.quotesDeclined) : "—"} hint="Customer declined" />
          <StatCard
            label="Total credits purchased"
            value={a ? formatInt(a.creditsPurchasedTotal) : "—"}
            hint="Sum of purchase ledger credits"
          />
          <StatCard
            label="Promotional credits granted"
            value={a ? formatInt(a.creditsPromotionalGrantedTotal) : "—"}
            hint="Admin grant audit total"
          />
          <StatCard
            label="Vendor credits balance (total)"
            value={a ? formatInt(a.vendorCreditsBalanceTotal) : "—"}
            hint="Sum across vendor wallets"
          />
          <StatCard label="Featured vendors" value={a ? formatInt(a.vendorsFeaturedCount) : "—"} hint="Featured flag on" />
          <StatCard
            label="Public vendors"
            value={a ? formatInt(a.vendorsPublicListedCount) : "—"}
            hint="Listed (complete + visible)"
          />
          <StatCard
            label="Pending reviews"
            value={a ? formatInt(a.reviewsPendingCount) : "—"}
            hint="Hidden from public profiles"
          />
          <StatCard
            label="Approved reviews"
            value={a ? formatInt(a.reviewsApprovedCount) : "—"}
            hint="Public on vendor profiles"
          />
        </div>
      </section>
    </div>
  );
}
