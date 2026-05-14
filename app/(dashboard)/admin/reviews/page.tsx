import type { Metadata } from "next";
import { AdminReviewVisibilityForm } from "@/components/admin/AdminReviewVisibilityForm";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { fetchAdminReviews } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin · Reviews",
};

function clampRating(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 5) {
    return 5;
  }
  return Math.round(value);
}

function StarRating({ rating }: { rating: number }) {
  const filled = clampRating(rating);
  const empty = 5 - filled;
  return (
    <span aria-label={`${filled} out of 5 stars`} className="text-base leading-none tracking-tight text-amber-500">
      <span aria-hidden>{"★".repeat(filled)}</span>
      <span aria-hidden className="text-brand-navy/20">
        {"★".repeat(empty)}
      </span>
    </span>
  );
}

export default async function AdminReviewsPage() {
  const rows = await fetchAdminReviews(150);

  const total = rows.length;
  const publicCount = rows.filter((r) => r.is_public).length;
  const hiddenCount = total - publicCount;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Reviews</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Hide reviews from public vendor profiles without deleting them. Hidden reviews stay in the database and remain
          visible to admins, the vendor, and the customer who wrote them.
        </p>
        <ButtonLink href="/admin/dashboard" variant="secondary" className="mt-2 inline-flex">
          Back to dashboard
        </ButtonLink>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total reviews" value={String(total)} hint="All ratings on file" />
        <StatCard label="Public" value={String(publicCount)} hint="Showing on vendor profiles" />
        <StatCard label="Hidden" value={String(hiddenCount)} hint="Visible to admin only" />
      </div>

      <DashboardCard
        id="admin-reviews"
        title="All reviews"
        description="Newest first. Use Hide / Show to toggle public visibility — reviews are never deleted."
      >
        {total === 0 ? (
          <p className="text-sm text-brand-navy-muted">No reviews yet.</p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <StarRating rating={r.rating} />
                    <span className="text-sm font-semibold text-brand-navy tabular-nums">{r.rating} / 5</span>
                    <StatusBadge tone={r.is_public ? "success" : "neutral"}>
                      {r.is_public ? "Public" : "Hidden"}
                    </StatusBadge>
                  </div>

                  <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-brand-navy-muted">Vendor</dt>
                      <dd className="text-brand-navy">
                        {r.vendor_label}
                        {r.vendor_slug?.trim() ? (
                          <span className="ml-1 font-mono text-xs text-brand-navy-muted">/{r.vendor_slug.trim()}</span>
                        ) : null}
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-brand-navy-muted">Customer</dt>
                      <dd className="text-brand-navy">{r.customer_label}</dd>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-2 sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-brand-navy-muted">Event</dt>
                      <dd className="text-brand-navy">{r.event_title}</dd>
                    </div>
                  </dl>

                  {r.review_text?.trim() ? (
                    <blockquote className="whitespace-pre-wrap rounded-lg border border-border-subtle bg-slate-50 p-3 text-sm leading-relaxed text-brand-navy">
                      {r.review_text.trim()}
                    </blockquote>
                  ) : (
                    <p className="text-sm italic text-brand-navy-muted">No written feedback.</p>
                  )}

                  <p className="text-xs text-brand-navy-muted">Submitted {new Date(r.created_at).toLocaleString()}</p>
                </div>

                <div className="shrink-0 lg:pt-1">
                  <AdminReviewVisibilityForm review={r} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
