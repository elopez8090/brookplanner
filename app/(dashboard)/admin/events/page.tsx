import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilterChips } from "@/components/filters/ActiveFilterChips";
import { CopyFilteredViewLink } from "@/components/filters/CopyFilteredViewLink";
import { DebouncedUrlKeywordInput } from "@/components/filters/DebouncedUrlKeywordInput";
import { FilterListEmptyState } from "@/components/filters/FilterListEmptyState";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { fetchAdminRecentEvents } from "@/lib/admin/queries";
import { fetchCategoryNamesOrdered } from "@/lib/categories/queries";
import { labelAdminEventSort } from "@/lib/filters/filterChipLabels";
import { adminEventsResultLabel } from "@/lib/filters/filterResultLabels";
import {
  firstSearchParam,
  parseAdminEventSort,
  parseAdminEventStatusFilter,
  rpcOptionalText,
} from "@/lib/filters/phase30Search";

export const metadata: Metadata = {
  title: "Admin · Events",
};

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    neighborhood?: string | string[];
    category?: string | string[];
    sort?: string | string[];
  }>;
};

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

function adminEventFilterChips(input: {
  q: string;
  status: ReturnType<typeof parseAdminEventStatusFilter>;
  neighborhood: string;
  category: string;
  sort: ReturnType<typeof parseAdminEventSort>;
}): { key: string; text: string }[] {
  const chips: { key: string; text: string }[] = [];
  const q = input.q.trim();
  if (q) {
    chips.push({ key: "q", text: `Keyword: ${q}` });
  }
  if (input.status !== "all") {
    chips.push({ key: "status", text: `Event status: ${input.status}` });
  }
  const nb = input.neighborhood.trim();
  if (nb) {
    chips.push({ key: "neighborhood", text: `Neighborhood contains: ${nb}` });
  }
  const cat = input.category.trim();
  if (cat) {
    chips.push({ key: "category", text: `Requested category: ${cat}` });
  }
  if (input.sort !== "newest") {
    chips.push({ key: "sort", text: `Sort: ${labelAdminEventSort(input.sort)}` });
  }
  return chips;
}

function adminEventHasActiveFilters(input: {
  q: string;
  status: ReturnType<typeof parseAdminEventStatusFilter>;
  neighborhood: string;
  category: string;
  sort: ReturnType<typeof parseAdminEventSort>;
}): boolean {
  return (
    Boolean(input.q.trim()) ||
    input.status !== "all" ||
    Boolean(input.neighborhood.trim()) ||
    Boolean(input.category.trim()) ||
    input.sort !== "newest"
  );
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = rpcOptionalText(firstSearchParam(sp.q)) ?? "";
  const neighborhood = rpcOptionalText(firstSearchParam(sp.neighborhood)) ?? "";
  const category = rpcOptionalText(firstSearchParam(sp.category)) ?? "";
  const status = parseAdminEventStatusFilter(firstSearchParam(sp.status));
  const sort = parseAdminEventSort(firstSearchParam(sp.sort));

  const [events, categoryNames] = await Promise.all([
    fetchAdminRecentEvents({
      limit: 100,
      query: q || undefined,
      status: status === "all" ? undefined : status,
      neighborhood: neighborhood || undefined,
      category: category || undefined,
      sort,
    }),
    fetchCategoryNamesOrdered(),
  ]);

  const filterChips = adminEventFilterChips({ q, status, neighborhood, category, sort });
  const hasActiveFilters = adminEventHasActiveFilters({ q, status, neighborhood, category, sort });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Events</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Host-submitted events with filters and sort in the URL for easy sharing.
        </p>
        <ButtonLink href="/admin/dashboard" variant="secondary" className="mt-2 inline-flex">
          Back to dashboard
        </ButtonLink>
      </header>

      <DashboardCard id="event-filters" title="Search and filter" description="Combine keyword, status, neighborhood, and category.">
        <form action="/admin/events" method="get" className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-end">
          <div className="min-w-0 lg:col-span-2">
            <label htmlFor="admin-e-q" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Keyword
            </label>
            <DebouncedUrlKeywordInput
              key={q}
              id="admin-e-q"
              name="q"
              initialValue={q}
              placeholder="Title, type, or host name"
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-e-status" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Status
            </label>
            <select
              id="admin-e-status"
              name="status"
              defaultValue={status}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-e-neighborhood" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Neighborhood contains
            </label>
            <input
              id="admin-e-neighborhood"
              name="neighborhood"
              defaultValue={neighborhood}
              placeholder="e.g. Park Slope"
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-e-category" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Requested category
            </label>
            <select
              id="admin-e-category"
              name="category"
              defaultValue={category}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="">Any category</option>
              {categoryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-e-sort" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Sort
            </label>
            <select
              id="admin-e-sort"
              name="sort"
              defaultValue={sort}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="quotes">Most quotes</option>
              <option value="event_date">Soonest event first</option>
            </select>
          </div>
          <div className="flex min-w-0 w-full flex-col gap-2 lg:col-span-3 sm:flex-row sm:flex-wrap sm:items-stretch">
            <button
              type="submit"
              className="inline-flex w-full min-w-0 items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f] sm:w-auto"
            >
              Apply
            </button>
            <Link
              href="/admin/events"
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
        id="admin-events"
        title="Submitted events"
        description={adminEventsResultLabel(events.length, hasActiveFilters)}
      >
        {events.length === 0 ? (
          <FilterListEmptyState
            variant={hasActiveFilters ? "no-results" : "no-records"}
            resourceNoun="submitted events"
            resetHref="/admin/events"
          />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {events.map((ev) => (
              <li key={ev.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-brand-navy">{ev.title}</p>
                  <p className="text-sm text-brand-navy-muted">
                    {ev.neighborhood} · Host: {ev.customer_name}
                  </p>
                  <p className="mt-1 text-xs text-brand-navy-muted">{new Date(ev.created_at).toLocaleString()}</p>
                </div>
                <StatusBadge tone={eventStatusTone(ev.status)}>{ev.status}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
