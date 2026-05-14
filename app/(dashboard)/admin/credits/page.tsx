import type { Metadata } from "next";
import { AdminCreditAdjustmentConsole } from "@/components/admin/AdminCreditAdjustmentConsole";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { fetchAdminMarketplaceVendors, fetchAdminRecentCreditAdjustments } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin · Credits",
};

function adjustmentTone(type: string): "success" | "info" | "warning" | "neutral" {
  if (type === "promotional") {
    return "success";
  }
  if (type === "bonus") {
    return "info";
  }
  if (type === "correction") {
    return "warning";
  }
  return "neutral";
}

export default async function AdminCreditsPage() {
  const [vendors, recent] = await Promise.all([
    fetchAdminMarketplaceVendors(),
    fetchAdminRecentCreditAdjustments(50),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Credit adjustments</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Grant promotional or bonus credits (updates vendor balances and audit tables), or record correction and refund
          rows for reporting without changing balances yet. All writes use your signed-in admin session and database
          guards—no service role on the client.
        </p>
        <ButtonLink href="/admin/dashboard" variant="secondary" className="mt-2 inline-flex">
          Back to overview
        </ButtonLink>
      </header>

      <DashboardCard
        id="admin-credit-adjustment-form"
        title="New adjustment"
        description="Find the vendor, choose the adjustment type, and submit. Promotional and bonus credits call the same secure RPC pattern as the vendors console."
      >
        <AdminCreditAdjustmentConsole vendors={vendors} />
      </DashboardCard>

      <DashboardCard
        id="admin-credit-adjustment-history"
        title="Recent credit adjustments"
        description="Latest rows from admin_credit_adjustments (newest first)."
      >
        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle bg-brand-navy/[0.02] px-4 py-8 text-center">
            <p className="text-sm font-medium text-brand-navy">No recent adjustments</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-navy-muted">
              Promotional, bonus, correction, and refund rows will appear here after you submit them from the form above.
              Use a clear reason on each entry so audits stay easy to follow.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Vendor</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Δ credits</th>
                  <th className="py-2 pr-4">Admin</th>
                  <th className="py-2">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {recent.map((row) => (
                  <tr key={row.id}>
                    <td className="py-3 pr-4 whitespace-nowrap text-brand-navy-muted">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 font-medium text-brand-navy">{row.vendor_label}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge tone={adjustmentTone(row.adjustment_type)}>{row.adjustment_type}</StatusBadge>
                    </td>
                    <td className="py-3 pr-4 tabular-nums font-medium text-brand-navy">
                      {row.credits_added > 0 ? `+${row.credits_added}` : row.credits_added}
                    </td>
                    <td className="py-3 pr-4 text-brand-navy-muted">{row.admin_label}</td>
                    <td className="py-3 text-brand-navy-muted">{row.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </div>
  );
}
