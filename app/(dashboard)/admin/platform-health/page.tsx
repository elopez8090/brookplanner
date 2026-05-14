import type { Metadata } from "next";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  fetchAdminHealthLowCreditVendors,
  fetchAdminPlatformHealth,
  fetchAdminPlatformHealthAlerts,
} from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin · Platform health",
};

function formatInt(value: number): string {
  return value.toLocaleString();
}

function vendorLabel(businessName: string | null | undefined, fullName: string): string {
  const b = businessName?.trim();
  return b ? b : fullName;
}

function formatUsdWholeDollars(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "—";
  }
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function creditPurchaseTone(status: string): "warning" | "coral" | "neutral" {
  if (status === "failed") {
    return "coral";
  }
  if (status === "pending") {
    return "warning";
  }
  return "neutral";
}

function alertShellClass(hasIssues: boolean): string {
  return hasIssues ? "border-l-4 border-l-amber-500" : "";
}

export default async function AdminPlatformHealthPage() {
  const [h, alerts, lowCredits] = await Promise.all([
    fetchAdminPlatformHealth(),
    fetchAdminPlatformHealthAlerts(25),
    fetchAdminHealthLowCreditVendors(15, 10),
  ]);

  const lowCreditCount = lowCredits.length;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Platform health</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
              Snapshot counts for capacity planning, plus operational alerts for approvals, demand gaps, profiles,
              wallets, and checkout issues. Figures are read through admin-only database functions.
            </p>
          </div>
        </div>
      </header>

      <DashboardCard
        id="platform-health-quick-links"
        title="Quick links"
        description="Jump to common admin destinations."
      >
        <ul className="flex flex-wrap gap-3">
          <li>
            <ButtonLink href="/admin/vendors" variant="secondary" className="justify-center">
              Manage vendors
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/events" variant="secondary" className="justify-center">
              View events
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/revenue" variant="secondary" className="justify-center">
              View revenue
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/audit-logs" variant="secondary" className="justify-center">
              View audit logs
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/dashboard" variant="secondary" className="justify-center">
              Analytics overview
            </ButtonLink>
          </li>
        </ul>
      </DashboardCard>

      <section aria-labelledby="platform-health-metrics" className="space-y-4">
        <h3 id="platform-health-metrics" className="text-sm font-semibold text-brand-navy">
          Snapshot
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard
            label="Customers"
            value={h ? formatInt(h.customerTotal) : "—"}
            hint="Profiles with the customer role"
          />
          <StatCard label="Vendors" value={h ? formatInt(h.vendorTotal) : "—"} hint="All vendor accounts" />
          <StatCard
            label="Pending vendors"
            value={h ? formatInt(h.pendingVendors) : "—"}
            hint="Vendor checklist not complete yet"
          />
          <StatCard
            label="Completed vendor profiles"
            value={h ? formatInt(h.completedVendorProfiles) : "—"}
            hint="Checklist satisfied; may still await listing approval"
          />
          <StatCard label="Open events" value={h ? formatInt(h.openEvents) : "—"} hint="Events in active status" />
          <StatCard label="Quotes" value={h ? formatInt(h.quoteVolume) : "—"} hint="All submitted quote rows" />
          <StatCard label="Messages" value={h ? formatInt(h.messageVolume) : "—"} hint="Chat messages across threads" />
          <StatCard label="Reviews" value={h ? formatInt(h.reviewVolume) : "—"} hint="All customer reviews recorded" />
        </div>
        {h && h.attentionItemsCount > 0 ? (
          <p className="text-xs leading-relaxed text-brand-navy-muted">
            Moderation-style backlog estimate: {formatInt(h.attentionItemsCount)} (complete vendors hidden from the
            public directory plus reviews not marked public). Use vendor and review admin tools to clear.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="platform-health-alerts" className="space-y-4">
        <h3 id="platform-health-alerts" className="text-sm font-semibold text-brand-navy">
          Operational alerts
        </h3>
        <p className="text-sm text-brand-navy-muted">
          Lists are capped for quick scanning; use the linked admin areas for full tables and actions.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard
            id="alert-pending-vendor-approvals"
            className={alertShellClass(Boolean(alerts && alerts.pendingApprovalCount > 0))}
            title="Pending vendor approvals"
            description={
              alerts
                ? `Complete profiles not yet listed (${formatInt(alerts.pendingApprovalCount)}).`
                : "Complete profiles not yet listed."
            }
          >
            {!alerts ? (
              <p className="text-sm text-brand-navy-muted">Could not load this section.</p>
            ) : alerts.pendingApprovals.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No vendors waiting on marketplace visibility.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {alerts.pendingApprovals.map((v) => (
                  <li
                    key={v.vendor_id}
                    className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-brand-navy">{vendorLabel(v.business_name, v.full_name)}</p>
                      <p className="text-sm text-brand-navy-muted">
                        {v.slug ? `Slug ${v.slug} · ` : null}
                        Joined {new Date(v.created_at).toLocaleString()}
                      </p>
                    </div>
                    {v.status !== "active" ? <StatusBadge tone="warning">{v.status}</StatusBadge> : null}
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
            id="alert-events-no-quotes"
            className={alertShellClass(Boolean(alerts && alerts.activeEventsNoQuotesCount > 0))}
            title="Events with 0 quotes"
            description={
              alerts
                ? `Active events with no vendor quotes yet (${formatInt(alerts.activeEventsNoQuotesCount)}).`
                : "Active events with no vendor quotes yet."
            }
          >
            {!alerts ? (
              <p className="text-sm text-brand-navy-muted">Could not load this section.</p>
            ) : alerts.activeEventsNoQuotes.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">Every active event has at least one quote.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {alerts.activeEventsNoQuotes.map((ev) => (
                  <li key={ev.event_id} className="flex flex-col gap-1 py-4 first:pt-0">
                    <p className="font-medium text-brand-navy">{ev.title}</p>
                    <p className="text-sm text-brand-navy-muted">
                      {ev.neighborhood} · {ev.customer_name}
                    </p>
                    <p className="text-xs text-brand-navy-muted">{new Date(ev.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <ButtonLink href="/admin/events" variant="secondary" className="w-full justify-center sm:w-auto">
                View events
              </ButtonLink>
            </div>
          </DashboardCard>

          <DashboardCard
            id="alert-incomplete-vendors"
            className={alertShellClass(Boolean(alerts && alerts.incompleteVendorCount > 0))}
            title="Vendors with incomplete profiles"
            description={
              alerts
                ? `Checklist still in progress (${formatInt(alerts.incompleteVendorCount)}).`
                : "Checklist still in progress."
            }
          >
            {!alerts ? (
              <p className="text-sm text-brand-navy-muted">Could not load this section.</p>
            ) : alerts.incompleteVendors.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">All vendor profiles are marked complete.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {alerts.incompleteVendors.map((v) => (
                  <li
                    key={v.vendor_id}
                    className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-brand-navy">{vendorLabel(v.business_name, v.full_name)}</p>
                      <p className="text-sm text-brand-navy-muted">Joined {new Date(v.created_at).toLocaleString()}</p>
                    </div>
                    {v.status !== "active" ? <StatusBadge tone="warning">{v.status}</StatusBadge> : null}
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
            id="alert-low-credit-vendors"
            className={alertShellClass(lowCreditCount > 0)}
            title="Low credit vendors"
            description="Vendor wallets at or below 10 credits (lowest balances first)."
          >
            {lowCredits.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No vendors at or below the threshold.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {lowCredits.map((v) => (
                  <li
                    key={v.vendor_id}
                    className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-brand-navy">{vendorLabel(v.business_name, v.full_name)}</p>
                      <p className="text-sm text-brand-navy-muted">{formatInt(v.credits_balance)} credits</p>
                    </div>
                    {v.status !== "active" ? <StatusBadge tone="warning">{v.status}</StatusBadge> : null}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <ButtonLink href="/admin/credits" variant="secondary" className="w-full justify-center sm:w-auto">
                Credits admin
              </ButtonLink>
            </div>
          </DashboardCard>

          <DashboardCard
            id="alert-credit-purchases"
            className={alertShellClass(Boolean(alerts && alerts.creditIssueCount > 0))}
            title="Credit purchase issues"
            description={
              alerts
                ? `Failed payments and long-running pending checkouts (${formatInt(alerts.creditIssueCount)}).`
                : "Failed payments and long-running pending checkouts."
            }
          >
            {!alerts ? (
              <p className="text-sm text-brand-navy-muted">Could not load this section.</p>
            ) : alerts.creditPurchaseIssues.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No failed or stuck pending purchases in range.</p>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {alerts.creditPurchaseIssues.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-brand-navy">
                        {vendorLabel(row.vendor_business_name, row.vendor_full_name)} ·{" "}
                        {formatUsdWholeDollars(row.amount_paid)} for {formatInt(row.credits_added)} credits
                      </p>
                      <p className="text-sm text-brand-navy-muted">
                        Session {row.stripe_session_id} · {new Date(row.created_at).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge tone={creditPurchaseTone(row.status)}>{row.status}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <ButtonLink href="/admin/revenue" variant="secondary" className="w-full justify-center sm:w-auto">
                View revenue
              </ButtonLink>
            </div>
          </DashboardCard>
        </div>
      </section>
    </div>
  );
}
