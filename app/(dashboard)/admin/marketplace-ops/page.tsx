import type { Metadata } from "next";
import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  fetchAdminMarketplaceOpsAlerts,
  fetchAdminMarketplaceOpsNeighborhoodDemand,
  fetchAdminMarketplaceOpsQuoteFunnel,
  fetchAdminMarketplaceOpsSupplyDemandByCategory,
} from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin · Marketplace ops",
};

function formatInt(value: number): string {
  return value.toLocaleString();
}

function formatPct(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

function liquidityLabel(activeEvents: number, vendorSupply: number): string {
  if (activeEvents <= 0) {
    return "No active demand";
  }
  if (vendorSupply <= 0) {
    return "No listed supply in category";
  }
  const ratio = activeEvents / vendorSupply;
  if (ratio >= 2.5) {
    return "Tight — demand outpaces supply";
  }
  if (ratio >= 1.2) {
    return "Warm — watch fill rates";
  }
  return "Balanced";
}

export default async function AdminMarketplaceOpsPage() {
  const [byCategory, funnel, neighborhoods, alerts] = await Promise.all([
    fetchAdminMarketplaceOpsSupplyDemandByCategory(),
    fetchAdminMarketplaceOpsQuoteFunnel(),
    fetchAdminMarketplaceOpsNeighborhoodDemand(40),
    fetchAdminMarketplaceOpsAlerts(28),
  ]);

  const hasCategoryRows = byCategory.some((r) => r.active_events > 0 || r.quote_volume > 0 || r.marketplace_vendor_supply > 0);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Marketplace operations</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
              Liquidity, conversion, and neighborhood demand from admin-only database functions. Counts and category
              labels only — no customer pricing or quote amounts on this screen.
            </p>
          </div>
        </div>
      </header>

      <DashboardCard
        id="marketplace-ops-quick-links"
        title="Quick links"
        description="Jump to operational consoles."
      >
        <ul className="flex flex-wrap gap-3">
          <li>
            <ButtonLink href="/admin/events" variant="secondary" className="justify-center">
              Events
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/vendors" variant="secondary" className="justify-center">
              Vendors
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/revenue" variant="secondary" className="justify-center">
              Revenue
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/platform-health" variant="secondary" className="justify-center">
              Platform health
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/quotes" variant="secondary" className="justify-center">
              Recent quotes
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/analytics" variant="secondary" className="justify-center">
              Analytics snapshot
            </ButtonLink>
          </li>
        </ul>
      </DashboardCard>

      <section aria-labelledby="marketplace-ops-funnel" className="space-y-4">
        <h3 id="marketplace-ops-funnel" className="text-sm font-semibold text-brand-navy">
          Quote funnel overview
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            label="Accepted quote rate"
            value={funnel ? formatPct(funnel.acceptedRatePct) : "—"}
            hint="Accepted ÷ all quotes (lifetime)"
            tone="accent"
          />
          <StatCard
            label="Quotes (lifetime)"
            value={funnel ? formatInt(funnel.quotesTotal) : "—"}
            hint={`${funnel ? formatInt(funnel.quotesPending) : "—"} pending · ${funnel ? formatInt(funnel.quotesAccepted) : "—"} accepted · ${funnel ? formatInt(funnel.quotesDeclined) : "—"} declined`}
          />
          <StatCard
            label="Avg quotes / active event"
            value={funnel ? funnel.avgQuotesPerActiveEvent.toFixed(2) : "—"}
            hint="Across every live host event"
          />
          <StatCard
            label="Active events with quotes"
            value={funnel ? `${formatInt(funnel.activeEventsWithQuotes)} / ${formatInt(funnel.activeEventsTotal)}` : "—"}
            hint="Share of live events that received at least one quote"
          />
          <StatCard
            label="Quotes (7 days)"
            value={funnel ? formatInt(funnel.quotesSubmittedLast7Days) : "—"}
            hint="Submission velocity"
          />
          <StatCard
            label="Distinct vendors quoting (7 days)"
            value={funnel ? formatInt(funnel.distinctVendorsQuotingLast7Days) : "—"}
            hint="Unique vendor participation"
          />
          <StatCard
            label="Quotes (30 days)"
            value={funnel ? formatInt(funnel.quotesSubmittedLast30Days) : "—"}
            hint="Rolling month activity"
          />
        </div>
      </section>

      <DashboardCard
        id="marketplace-ops-supply-demand"
        title="Supply vs demand by category"
        description="Active host events, quote volume, and marketplace-ready vendors who have quoted in each category (directory-aligned readiness)."
      >
        {!hasCategoryRows ? (
          <p className="text-sm text-brand-navy-muted">No marketplace activity by category yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border-subtle bg-brand-navy/[0.03] text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Active events</th>
                  <th className="px-4 py-3 text-right">Quote volume</th>
                  <th className="px-4 py-3 text-right">Supply vendors</th>
                  <th className="px-4 py-3">Liquidity read</th>
                  <th className="px-4 py-3 text-right">Drill down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-brand-navy">
                {byCategory.map((row) => (
                  <tr key={row.category_id} className="hover:bg-brand-navy/[0.02]">
                    <td className="px-4 py-3 font-medium">{row.category_name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatInt(row.active_events)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatInt(row.quote_volume)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatInt(row.marketplace_vendor_supply)}</td>
                    <td className="px-4 py-3 text-sm text-brand-navy-muted">
                      {liquidityLabel(row.active_events, row.marketplace_vendor_supply)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/events?category=${encodeURIComponent(row.category_name)}&status=active`}
                        className="text-accent-blue hover:underline"
                      >
                        Events
                      </Link>
                      <span className="mx-2 text-brand-navy-muted">·</span>
                      <Link
                        href={`/admin/vendors?category=${encodeURIComponent(row.category_name)}`}
                        className="text-accent-blue hover:underline"
                      >
                        Vendors
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        id="marketplace-ops-neighborhoods"
        title="Neighborhood demand"
        description="Active events and quote volume by host neighborhood. Borough is inferred from neighborhood labels (Brooklyn-first marketplace)."
      >
        {neighborhoods.length === 0 ? (
          <p className="text-sm text-brand-navy-muted">No active events to rank by neighborhood.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border-subtle bg-brand-navy/[0.03] text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
                <tr>
                  <th className="px-4 py-3">Borough</th>
                  <th className="px-4 py-3">Neighborhood</th>
                  <th className="px-4 py-3 text-right">Active events</th>
                  <th className="px-4 py-3 text-right">Quotes</th>
                  <th className="px-4 py-3 text-right">Avg quotes / event</th>
                  <th className="px-4 py-3 text-right">Filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-brand-navy">
                {neighborhoods.map((row) => (
                  <tr key={`${row.borough}:${row.neighborhood}`} className="hover:bg-brand-navy/[0.02]">
                    <td className="px-4 py-3 text-brand-navy-muted">{row.borough}</td>
                    <td className="px-4 py-3 font-medium">{row.neighborhood}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatInt(row.active_events)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatInt(row.quote_volume)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.avg_quotes_per_active_event.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/events?neighborhood=${encodeURIComponent(row.neighborhood)}&status=active`}
                        className="text-accent-blue hover:underline"
                      >
                        Events
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        id="marketplace-ops-alerts"
        title="Operational alerts"
        description="Automated highlights for thin liquidity, stalled demand, and slots nearing the per-service quote cap (4)."
      >
        {!alerts ? (
          <p className="text-sm text-brand-navy-muted">Unable to load alert bundle.</p>
        ) : (
          <div className="space-y-10">
            <section aria-labelledby="alert-zero-quotes" className="space-y-3">
              <h4 id="alert-zero-quotes" className="text-sm font-semibold text-brand-navy">
                Active events with zero quotes
              </h4>
              {alerts.zeroQuoteActiveEvents.length === 0 ? (
                <p className="text-sm text-brand-navy-muted">No active events are completely without quotes.</p>
              ) : (
                <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
                  {alerts.zeroQuoteActiveEvents.map((ev) => (
                    <li key={ev.event_id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-brand-navy">{ev.title}</p>
                        <p className="text-sm text-brand-navy-muted">
                          {ev.neighborhood} · {ev.customer_name}
                        </p>
                      </div>
                      <Link
                        href={`/admin/events?q=${encodeURIComponent(ev.title)}`}
                        className="shrink-0 text-sm font-semibold text-accent-blue hover:underline"
                      >
                        Find in events
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="alert-category-gaps" className="space-y-3">
              <h4 id="alert-category-gaps" className="text-sm font-semibold text-brand-navy">
                Categories with events but few vendors
              </h4>
              {alerts.categorySupplyGaps.length === 0 ? (
                <p className="text-sm text-brand-navy-muted">No categories crossed the imbalance threshold.</p>
              ) : (
                <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
                  {alerts.categorySupplyGaps.map((c) => (
                    <li key={c.category_id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-brand-navy">{c.category_name}</p>
                        <p className="text-sm text-brand-navy-muted">
                          {formatInt(c.active_events)} active events · {formatInt(c.marketplace_vendor_supply)} supply
                          vendors
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm font-semibold">
                        <Link
                          href={`/admin/events?category=${encodeURIComponent(c.category_name)}&status=active`}
                          className="text-accent-blue hover:underline"
                        >
                          Events
                        </Link>
                        <Link
                          href={`/admin/vendors?category=${encodeURIComponent(c.category_name)}`}
                          className="text-accent-blue hover:underline"
                        >
                          Vendors
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="alert-vendors-no-quotes" className="space-y-3">
              <h4 id="alert-vendors-no-quotes" className="text-sm font-semibold text-brand-navy">
                Marketplace-ready vendors with no quotes yet
              </h4>
              {alerts.marketplaceReadyVendorsNoQuotes.length === 0 ? (
                <p className="text-sm text-brand-navy-muted">Every marketplace-ready vendor has submitted at least one quote.</p>
              ) : (
                <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
                  {alerts.marketplaceReadyVendorsNoQuotes.map((v) => (
                    <li key={v.vendor_id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-brand-navy">{v.business_name ?? v.full_name}</p>
                        <p className="text-sm text-brand-navy-muted">Joined {new Date(v.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm font-semibold">
                        {v.slug ? (
                          <Link href={`/vendors/${v.slug}`} className="text-accent-blue hover:underline">
                            Public profile
                          </Link>
                        ) : null}
                        <Link href="/admin/vendors" className="text-accent-blue hover:underline">
                          Vendor console
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="alert-hot-neighborhoods" className="space-y-3">
              <h4 id="alert-hot-neighborhoods" className="text-sm font-semibold text-brand-navy">
                High-demand neighborhoods
              </h4>
              {alerts.hotNeighborhoods.length === 0 ? (
                <p className="text-sm text-brand-navy-muted">No neighborhood has multiple concurrent live events yet.</p>
              ) : (
                <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
                  {alerts.hotNeighborhoods.map((n) => (
                    <li
                      key={`${n.borough}-${n.neighborhood}`}
                      className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-brand-navy">
                          {n.neighborhood}{" "}
                          <span className="font-normal text-brand-navy-muted">({n.borough})</span>
                        </p>
                        <p className="text-sm text-brand-navy-muted">
                          {formatInt(n.active_events)} active events · {formatInt(n.quote_volume)} quotes
                        </p>
                      </div>
                      <Link
                        href={`/admin/events?neighborhood=${encodeURIComponent(n.neighborhood)}&status=active`}
                        className="shrink-0 text-sm font-semibold text-accent-blue hover:underline"
                      >
                        View events
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="alert-near-cap" className="space-y-3">
              <h4 id="alert-near-cap" className="text-sm font-semibold text-brand-navy">
                Live services near the quote cap (3 of 4 slots)
              </h4>
              {alerts.eventServicesNearQuoteCap.length === 0 ? (
                <p className="text-sm text-brand-navy-muted">No active services are within one slot of the cap.</p>
              ) : (
                <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
                  {alerts.eventServicesNearQuoteCap.map((row) => (
                    <li key={`${row.event_id}-${row.category_name}`} className="px-4 py-3">
                      <p className="font-medium text-brand-navy">{row.event_title}</p>
                      <p className="text-sm text-brand-navy-muted">
                        {row.category_name} · {row.neighborhood} · {row.slots_filled} / 4 vendor slots filled
                      </p>
                      <Link
                        href={`/admin/events?q=${encodeURIComponent(row.event_title)}`}
                        className="mt-2 inline-block text-sm font-semibold text-accent-blue hover:underline"
                      >
                        Open in events list
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
