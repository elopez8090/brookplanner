import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { AdminMonthlyRevenueRow } from "@/lib/admin/types";
import { formatCredits, formatInt, formatUsdCents, monthLabelUtc } from "@/lib/admin/revenue/format";

type MonthlyRevenueTableProps = {
  rows: AdminMonthlyRevenueRow[];
};

export function MonthlyRevenueTable({ rows }: MonthlyRevenueTableProps) {
  const maxMonthlyRevenue = rows.reduce((m, row) => Math.max(m, row.revenueCents), 0);

  return (
    <DashboardCard
      title="Monthly revenue collected"
      description="Completed Stripe checkouts by completion month (UTC). Amounts in USD (stored as cents)."
    >
      {rows.length === 0 ? (
        <p className="text-sm text-brand-navy-muted">
          No completed credit purchases in the reporting window yet. When vendors finish checkout, rows appear here.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs font-semibold uppercase tracking-wider text-brand-navy-muted">
                  <th className="pb-3 pr-4">Month</th>
                  <th className="pb-3 pr-4">Revenue Collected</th>
                  <th className="pb-3 pr-4">Paid Credit Purchases</th>
                  <th className="pb-3">Credits Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((row) => (
                  <tr key={row.month} className="tabular-nums">
                    <td className="py-3 pr-4 font-medium text-brand-navy">{monthLabelUtc(row.month)}</td>
                    <td className="py-3 pr-4 text-brand-navy">{formatUsdCents(row.revenueCents)}</td>
                    <td className="py-3 pr-4 text-brand-navy-muted">{formatInt(row.purchasesCount)}</td>
                    <td className="py-3 text-brand-navy-muted">{formatCredits(row.creditsSold)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-border-subtle md:hidden">
            {rows.map((row) => (
              <li key={row.month} className="flex flex-col gap-1 py-4 first:pt-0">
                <p className="font-semibold text-brand-navy">{monthLabelUtc(row.month)}</p>
                <p className="text-sm text-brand-navy-muted">
                  {formatUsdCents(row.revenueCents)} · {formatInt(row.purchasesCount)} paid credit purchases ·{" "}
                  {formatCredits(row.creditsSold)} credits sold
                </p>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy-muted">Relative revenue</p>
            {rows.slice(0, 12).map((row) => {
              const widthPct = maxMonthlyRevenue > 0 ? Math.round((row.revenueCents / maxMonthlyRevenue) * 100) : 0;
              const barWidth = row.revenueCents <= 0 ? "0%" : `${Math.min(100, Math.max(widthPct, 6))}%`;
              return (
                <div key={`bar-${row.month}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-brand-navy-muted">
                    <span>{monthLabelUtc(row.month)}</span>
                    <span className="tabular-nums text-brand-navy">{formatUsdCents(row.revenueCents)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-navy/[0.06] ring-1 ring-border-subtle">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-blue/70 transition-[width]"
                      style={{ width: barWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
