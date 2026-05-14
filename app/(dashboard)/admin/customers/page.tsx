import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilterChips } from "@/components/filters/ActiveFilterChips";
import { CopyFilteredViewLink } from "@/components/filters/CopyFilteredViewLink";
import { DebouncedUrlKeywordInput } from "@/components/filters/DebouncedUrlKeywordInput";
import { FilterListEmptyState } from "@/components/filters/FilterListEmptyState";
import { AdminAccountStatusForms } from "@/components/admin/AdminAccountStatusForms";
import { AdminCustomerNotesForm } from "@/components/admin/AdminCustomerNotesForm";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { fetchAdminCustomers } from "@/lib/admin/queries";
import { labelAdminCustomerSort } from "@/lib/filters/filterChipLabels";
import { adminCustomersResultLabel } from "@/lib/filters/filterResultLabels";
import {
  firstSearchParam,
  parseAdminAccountStatusFilter,
  parseAdminCustomerSort,
  rpcOptionalText,
} from "@/lib/filters/phase30Search";

export const metadata: Metadata = {
  title: "Admin · Customers",
};

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    sort?: string | string[];
  }>;
};

function adminCustomerFilterChips(input: {
  q: string;
  status: ReturnType<typeof parseAdminAccountStatusFilter>;
  sort: ReturnType<typeof parseAdminCustomerSort>;
}): { key: string; text: string }[] {
  const chips: { key: string; text: string }[] = [];
  const q = input.q.trim();
  if (q) {
    chips.push({ key: "q", text: `Keyword (name): ${q}` });
  }
  if (input.status !== "all") {
    chips.push({ key: "status", text: `Account status: ${input.status}` });
  }
  if (input.sort !== "newest") {
    chips.push({ key: "sort", text: `Sort: ${labelAdminCustomerSort(input.sort)}` });
  }
  return chips;
}

function adminCustomerHasActiveFilters(input: {
  q: string;
  status: ReturnType<typeof parseAdminAccountStatusFilter>;
  sort: ReturnType<typeof parseAdminCustomerSort>;
}): boolean {
  return Boolean(input.q.trim()) || input.status !== "all" || input.sort !== "newest";
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = rpcOptionalText(firstSearchParam(sp.q)) ?? "";
  const status = parseAdminAccountStatusFilter(firstSearchParam(sp.status));
  const sort = parseAdminCustomerSort(firstSearchParam(sp.sort));

  const customers = await fetchAdminCustomers({
    limit: 200,
    query: q || undefined,
    status: status === "all" ? undefined : status,
    sort,
  });

  const filterChips = adminCustomerFilterChips({ q, status, sort });
  const hasActiveFilters = adminCustomerHasActiveFilters({ q, status, sort });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Customers</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Host accounts: monitor posted events, suspend or restore access, and keep internal notes. Restricted customers cannot
          post or edit events while signed in.
        </p>
        <ButtonLink href="/admin/dashboard" variant="secondary" className="mt-2 inline-flex">
          Back to dashboard
        </ButtonLink>
      </header>

      <DashboardCard
        id="customer-filters"
        title="Search and filter"
        description="URL-based filters for sharing views with your team."
      >
        <form action="/admin/customers" method="get" className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
          <div className="min-w-0 md:col-span-2">
            <label htmlFor="admin-c-q" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Keyword (name)
            </label>
            <DebouncedUrlKeywordInput
              key={q}
              id="admin-c-q"
              name="q"
              initialValue={q}
              placeholder="Search customers"
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-c-status" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Status
            </label>
            <select
              id="admin-c-status"
              name="status"
              defaultValue={status}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-c-sort" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Sort
            </label>
            <select
              id="admin-c-sort"
              name="sort"
              defaultValue={sort}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="active">Most active</option>
              <option value="name">Alphabetical (A–Z)</option>
            </select>
          </div>
          <div className="flex min-w-0 w-full flex-col gap-2 md:col-span-4 sm:flex-row sm:flex-wrap sm:items-stretch">
            <button
              type="submit"
              className="inline-flex w-full min-w-0 items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f] sm:w-auto"
            >
              Apply
            </button>
            <Link
              href="/admin/customers"
              className="inline-flex w-full min-w-0 items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50 sm:w-auto"
            >
              Reset filters
            </Link>
            <CopyFilteredViewLink />
          </div>
        </form>
        <div className="mt-4">
          <ActiveFilterChips items={filterChips} />
        </div>
      </DashboardCard>

      <DashboardCard
        id="all-customers"
        title="All customers"
        description={adminCustomersResultLabel(customers.length, hasActiveFilters)}
      >
        {customers.length === 0 ? (
          <FilterListEmptyState
            variant={hasActiveFilters ? "no-results" : "no-records"}
            resourceNoun="customer accounts"
            resetHref="/admin/customers"
          />
        ) : (
          <ul className="space-y-6">
            {customers.map((c) => (
              <li key={c.id} className="rounded-xl border border-border-subtle bg-brand-navy/[0.02] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-brand-navy">{c.full_name}</p>
                    <p className="mt-1 text-xs text-brand-navy-muted">Joined {new Date(c.created_at).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm text-brand-navy-muted">
                      Events posted: <span className="font-medium text-brand-navy">{c.events_posted_count}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.status === "active" ? (
                      <StatusBadge tone="success">Active</StatusBadge>
                    ) : c.status === "suspended" ? (
                      <StatusBadge tone="warning">Suspended</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Deactivated</StatusBadge>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <AdminAccountStatusForms profileId={c.id} status={c.status} />
                  <AdminCustomerNotesForm customerId={c.id} adminNotes={c.admin_notes} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
