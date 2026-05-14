import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  fetchAdminAnalyticsSnapshot,
  fetchAdminHealthLowCreditVendors,
  fetchAdminHealthMostActiveVendors,
  fetchAdminHealthTopEventCategories,
  fetchAdminRecentEvents,
  fetchAdminRecentQuotes,
} from "@/lib/admin/queries";
import { fetchRecentCreditTransactions } from "@/lib/events/queries";
import { vendorCategoryHubPath } from "@/lib/marketplace/vendorCategoryPages";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

function formatInt(value: number): string {
  return value.toLocaleString();
}

function creditTypeLabel(type: string): string {
  if (type === "quote_spend") {
    return "Quote spend";
  }
  if (type === "purchase") {
    return "Purchase";
  }
  if (type === "refund") {
    return "Refund";
  }
  if (type === "admin_adjustment") {
    return "Admin adjustment";
  }
  return "Credit activity";
}

function eventStatusTone(status: string): "info" | "warning" | "neutral" | "success" {
  if (status === "active") {
    return "success";
  }
  if (status === "draft") {
    return "warning";
  }
  if (status === "closed") {
    return "neutral";
  }
  return "info";
}

function quoteStatusTone(status: string): "info" | "warning" | "neutral" | "success" {
  if (status === "accepted") {
    return "success";
  }
  if (status === "declined") {
    return "neutral";
  }
  if (status === "pending") {
    return "warning";
  }
  return "info";
}

function formatQuoteAmount(raw: number | string): string {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return String(raw);
  }
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function vendorLabel(businessName: string | null, fullName: string): string {
  const b = businessName?.trim();
  return b ? b : fullName;
}

export default async function AdminDashboardPage() {
  const [
    analytics,
    creditTransactions,
    recentEvents,
    recentQuotes,
    lowCreditVendors,
    activeVendors,
    topCategories,
  ] = await Promise.all([
    fetchAdminAnalyticsSnapshot(),
    fetchRecentCreditTransactions(12),
    fetchAdminRecentEvents({ limit: 8 }),
    fetchAdminRecentQuotes(8),
    fetchAdminHealthLowCreditVendors(12, 10),
    fetchAdminHealthMostActiveVendors(8),
    fetchAdminHealthTopEventCategories(8),
  ]);

  const vendorIds = Array.from(new Set(creditTransactions.map((row) => row.vendor_id)));
  const supabase = await createClient();
  const { data: vendors } = vendorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", vendorIds)
    : { data: [] };
  const vendorNameById = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor.full_name]));

  const a = analytics;

  return (
    <div className="space-y-8">
      {!a ? (
        <p
          className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          Overview metrics could not be loaded (admin analytics RPC). Confirm production migrations are applied and
          environment variables are set; see{" "}
          <Link href="/admin/launch-checklist" className="font-semibold text-accent-blue underline">
            Launch checklist
          </Link>
          .
        </p>
      ) : null}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Analytics & marketplace health</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Snapshot metrics and recent activity. Counts are sourced from secure admin database functions; listings respect
          marketplace visibility rules where noted.
        </p>
      </header>

      <section aria-labelledby="admin-analytics-heading" className="space-y-4">
        <h3 id="admin-analytics-heading" className="text-sm font-semibold text-brand-navy">
          Overview
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

      <section aria-labelledby="admin-health-heading" className="space-y-4">
        <h3 id="admin-health-heading" className="text-sm font-semibold text-brand-navy">
          Marketplace health
        </h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            id="recent-customer-events"
            title="Recent customer events"
            description="Latest host submissions (newest first)."
          >
            {recentEvents.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No events yet.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {recentEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-brand-navy">{ev.title}</p>
                      <p className="text-sm text-brand-navy-muted">
                        {ev.neighborhood} · {ev.customer_name}
                      </p>
                      <p className="mt-1 text-xs text-brand-navy-muted">{new Date(ev.created_at).toLocaleString()}</p>
                    </div>
                    <StatusBadge tone={eventStatusTone(ev.status)}>{ev.status}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <ButtonLink href="/admin/events" variant="secondary" className="w-full justify-center sm:w-auto">
                View all events
              </ButtonLink>
            </div>
          </DashboardCard>

          <DashboardCard
            id="recent-vendor-quotes"
            title="Recent vendor quotes"
            description="Latest quote submissions across events."
          >
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No quotes yet.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {recentQuotes.map((q) => (
                  <li
                    key={q.id}
                    className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-brand-navy">
                        {formatQuoteAmount(q.quote_amount)} · {vendorLabel(q.vendor_business_name, q.vendor_full_name)}
                      </p>
                      <p className="text-sm text-brand-navy-muted">
                        {q.event_title} ({q.event_neighborhood})
                      </p>
                      <p className="mt-1 text-xs text-brand-navy-muted">{new Date(q.created_at).toLocaleString()}</p>
                    </div>
                    <StatusBadge tone={quoteStatusTone(q.quote_status)}>{q.quote_status}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <ButtonLink href="/admin/quotes" variant="secondary" className="w-full justify-center sm:w-auto">
                View all quotes
              </ButtonLink>
            </div>
          </DashboardCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <DashboardCard
            id="vendors-low-credits"
            title="Vendors with low credits"
            description="Vendor wallets at or below 10 credits (sorted lowest first)."
          >
            {lowCreditVendors.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No vendors at or below the threshold.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {lowCreditVendors.map((v) => (
                  <li key={v.vendor_id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-brand-navy">{vendorLabel(v.business_name, v.full_name)}</p>
                      <p className="text-sm text-brand-navy-muted">{v.credits_balance} credits</p>
                    </div>
                    {v.status !== "active" ? (
                      <StatusBadge tone="warning">{v.status}</StatusBadge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <ButtonLink href="/admin/vendors" variant="secondary" className="w-full justify-center sm:w-auto">
                Manage vendors
              </ButtonLink>
            </div>
          </DashboardCard>

          <DashboardCard
            id="most-active-vendors"
            title="Most active vendors"
            description="By total quotes submitted (all time)."
          >
            {activeVendors.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No quote activity yet.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {activeVendors.map((v) => (
                  <li key={v.vendor_id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-brand-navy">{vendorLabel(v.business_name, v.full_name)}</p>
                      <p className="text-sm text-brand-navy-muted">{v.credits_balance} credits on hand</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-brand-navy">{formatInt(v.quote_count)} quotes</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard
            id="top-event-categories"
            title="Categories with most event requests"
            description="By count of requested services on posted events."
          >
            {topCategories.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No category demand yet.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {topCategories.map((c) => (
                  <li key={c.category_id} className="flex items-center justify-between gap-3 py-4 first:pt-0">
                    <Link
                      href={vendorCategoryHubPath(c.category_slug)}
                      className="font-medium text-accent-blue hover:underline"
                    >
                      {c.category_name}
                    </Link>
                    <span className="text-sm font-semibold tabular-nums text-brand-navy">
                      {formatInt(c.event_request_count)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        </div>
      </section>

      <DashboardCard id="admin-shortcuts" title="Shortcuts" description="Primary admin tools.">
        <ul className="flex flex-wrap gap-3">
          <li>
            <ButtonLink href="/admin/vendors" variant="secondary" className="justify-center">
              Vendors
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/customers" variant="secondary" className="justify-center">
              Customers
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/quotes" variant="secondary" className="justify-center">
              Quotes
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/reviews" variant="secondary" className="justify-center">
              Reviews
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/launch-checklist" variant="secondary" className="justify-center">
              Launch checklist
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/categories" variant="secondary" className="justify-center">
              Public categories
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/credits" variant="secondary" className="justify-center">
              Credits
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/revenue" variant="secondary" className="justify-center">
              Revenue & financials
            </ButtonLink>
          </li>
        </ul>
      </DashboardCard>

      <DashboardCard
        id="credit-activity"
        title="Recent credit activity"
        description="Purchases, quote spends, refunds, and adjustments."
      >
        {creditTransactions.length === 0 ? (
          <p className="text-sm text-brand-navy-muted">No credit transactions yet.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {creditTransactions.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-brand-navy">
                    {creditTypeLabel(row.type)} · {row.amount > 0 ? `+${row.amount}` : row.amount} credits
                  </p>
                  <p className="text-sm text-brand-navy-muted">
                    {vendorNameById.get(row.vendor_id) ?? "Unknown vendor"} · {row.description}
                  </p>
                </div>
                <p className="text-sm font-medium text-brand-navy-muted">{new Date(row.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
