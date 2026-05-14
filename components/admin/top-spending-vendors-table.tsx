import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { AdminTopSpendingVendorRow } from "@/lib/admin/types";
import { formatCredits, formatInt, formatUsdCents } from "@/lib/admin/revenue/format";

type TopSpendingVendorsTableProps = {
  vendors: AdminTopSpendingVendorRow[];
};

export function TopSpendingVendorsTable({ vendors }: TopSpendingVendorsTableProps) {
  return (
    <DashboardCard
      title="Top spending vendors"
      description="Ranked by credits consumed on quotes. “Quote spend” uses $5 face value per credit (same basis as liability), not necessarily Stripe cash paid."
    >
      {vendors.length === 0 ? (
        <p className="text-sm text-brand-navy-muted">
          No vendors match the criteria yet (quote spend or completed purchases). Vendors appear after they submit quotes
          that consume credits or complete a credit purchase.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs font-semibold uppercase tracking-wider text-brand-navy-muted">
                <th className="pb-3 pr-3">Vendor</th>
                <th className="pb-3 pr-3">Email</th>
                <th className="pb-3 pr-3">Quote spend (face value)</th>
                <th className="pb-3 pr-3">Credits spent</th>
                <th className="pb-3 pr-3">Credits purchased</th>
                <th className="pb-3 pr-3">Promo / bonus granted</th>
                <th className="pb-3 pr-3">Balance</th>
                <th className="pb-3">Completed purchases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {vendors.map((v) => (
                <tr key={v.vendorId} className="tabular-nums">
                  <td className="py-3 pr-3">
                    <Link href="/admin/vendors" className="font-medium text-accent-blue hover:underline">
                      {v.vendorName}
                    </Link>
                  </td>
                  <td className="max-w-[14rem] truncate py-3 pr-3 text-brand-navy-muted" title={v.vendorEmail}>
                    {v.vendorEmail || "—"}
                  </td>
                  <td className="py-3 pr-3 font-medium text-brand-navy">{formatUsdCents(v.totalSpentCents)}</td>
                  <td className="py-3 pr-3 text-brand-navy-muted">{formatCredits(v.creditsSpent)}</td>
                  <td className="py-3 pr-3 text-brand-navy-muted">{formatCredits(v.creditsPurchased)}</td>
                  <td className="py-3 pr-3 text-brand-navy-muted">{formatCredits(v.promotionalCreditsGranted)}</td>
                  <td className="py-3 pr-3 text-brand-navy-muted">{formatCredits(v.creditsRemaining)}</td>
                  <td className="py-3 text-brand-navy-muted">{formatInt(v.purchaseCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
