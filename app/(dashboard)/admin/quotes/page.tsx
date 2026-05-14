import type { Metadata } from "next";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { fetchAdminRecentQuotes } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin · Quotes",
};

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

function formatAmount(raw: number | string): string {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return String(raw);
  }
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default async function AdminQuotesPage() {
  const quotes = await fetchAdminRecentQuotes(100);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Quotes</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Recent quote submissions across events (newest first).
        </p>
        <ButtonLink href="/admin/dashboard" variant="secondary" className="mt-2 inline-flex">
          Back to dashboard
        </ButtonLink>
      </header>

      <DashboardCard id="admin-quotes" title="Quote activity" description="Latest rows from the quotes table.">
        {quotes.length === 0 ? (
          <p className="text-sm text-brand-navy-muted">No quotes yet.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {quotes.map((q) => (
              <li key={q.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-brand-navy">
                    {formatAmount(q.quote_amount)} · {q.vendor_business_name ?? q.vendor_full_name}
                  </p>
                  <p className="text-sm text-brand-navy-muted">
                    Event: {q.event_title} ({q.event_neighborhood}) · Event status: {q.event_status}
                  </p>
                  <p className="mt-1 text-xs text-brand-navy-muted">{new Date(q.created_at).toLocaleString()}</p>
                </div>
                <StatusBadge tone={quoteStatusTone(q.quote_status)}>{q.quote_status}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
