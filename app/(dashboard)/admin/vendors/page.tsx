import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilterChips } from "@/components/filters/ActiveFilterChips";
import { CopyFilteredViewLink } from "@/components/filters/CopyFilteredViewLink";
import { DebouncedUrlKeywordInput } from "@/components/filters/DebouncedUrlKeywordInput";
import { FilterListEmptyState } from "@/components/filters/FilterListEmptyState";
import { AdminAccountStatusForms } from "@/components/admin/AdminAccountStatusForms";
import { AdminVendorCreditGrantForm } from "@/components/admin/AdminVendorCreditGrantForm";
import { AdminVendorSaveForm } from "@/components/admin/AdminVendorSaveForm";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { fetchCategoryNamesOrdered } from "@/lib/categories/queries";
import { fetchAdminMarketplaceVendors } from "@/lib/admin/queries";
import { labelAdminVendorSort } from "@/lib/filters/filterChipLabels";
import { adminVendorsResultLabel } from "@/lib/filters/filterResultLabels";
import {
  firstSearchParam,
  parseAdminAccountStatusFilter,
  parseAdminVendorProfileFilter,
  parseAdminVendorSort,
  parseAdminVendorVisibilityFilter,
  rpcOptionalText,
} from "@/lib/filters/phase30Search";
import {
  computeVendorProfileCompletionPercent,
  isVendorProfileCompletionRequiredComplete,
} from "@/lib/vendor-profile/profileCompletion";

export const metadata: Metadata = {
  title: "Admin · Vendors",
};

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    visibility?: string | string[];
    profile?: string | string[];
    category?: string | string[];
    area?: string | string[];
    sort?: string | string[];
  }>;
};

function adminVendorFilterChips(input: {
  q: string;
  status: ReturnType<typeof parseAdminAccountStatusFilter>;
  visibility: ReturnType<typeof parseAdminVendorVisibilityFilter>;
  profile: ReturnType<typeof parseAdminVendorProfileFilter>;
  category: string;
  area: string;
  sort: ReturnType<typeof parseAdminVendorSort>;
}): { key: string; text: string }[] {
  const chips: { key: string; text: string }[] = [];
  const q = input.q.trim();
  if (q) {
    chips.push({ key: "q", text: `Keyword: ${q}` });
  }
  if (input.status !== "all") {
    chips.push({ key: "status", text: `Account status: ${input.status}` });
  }
  if (input.visibility !== "all") {
    chips.push({
      key: "visibility",
      text: `Directory visibility: ${input.visibility === "public" ? "Public only" : "Hidden only"}`,
    });
  }
  if (input.profile !== "all") {
    chips.push({
      key: "profile",
      text: `Profile completion: ${input.profile === "complete" ? "Complete" : "Incomplete"}`,
    });
  }
  const cat = input.category.trim();
  if (cat) {
    chips.push({ key: "category", text: `Quote category: ${cat}` });
  }
  const ar = input.area.trim();
  if (ar) {
    chips.push({ key: "area", text: `Service area contains: ${ar}` });
  }
  if (input.sort !== "newest") {
    chips.push({ key: "sort", text: `Sort: ${labelAdminVendorSort(input.sort)}` });
  }
  return chips;
}

function adminVendorHasActiveFilters(input: {
  q: string;
  status: ReturnType<typeof parseAdminAccountStatusFilter>;
  visibility: ReturnType<typeof parseAdminVendorVisibilityFilter>;
  profile: ReturnType<typeof parseAdminVendorProfileFilter>;
  category: string;
  area: string;
  sort: ReturnType<typeof parseAdminVendorSort>;
}): boolean {
  return (
    Boolean(input.q.trim()) ||
    input.status !== "all" ||
    input.visibility !== "all" ||
    input.profile !== "all" ||
    Boolean(input.category.trim()) ||
    Boolean(input.area.trim()) ||
    input.sort !== "newest"
  );
}

export default async function AdminVendorsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = rpcOptionalText(firstSearchParam(sp.q)) ?? "";
  const status = parseAdminAccountStatusFilter(firstSearchParam(sp.status));
  const visibility = parseAdminVendorVisibilityFilter(firstSearchParam(sp.visibility));
  const profile = parseAdminVendorProfileFilter(firstSearchParam(sp.profile));
  const category = rpcOptionalText(firstSearchParam(sp.category)) ?? "";
  const area = rpcOptionalText(firstSearchParam(sp.area)) ?? "";
  const sort = parseAdminVendorSort(firstSearchParam(sp.sort));

  const [vendors, categoryNames] = await Promise.all([
    fetchAdminMarketplaceVendors({
      query: q || undefined,
      status: status === "all" ? undefined : status,
      visibility: visibility === "all" ? undefined : visibility,
      profile: profile === "all" ? undefined : profile,
      category: category || undefined,
      area: area || undefined,
      sort,
    }),
    fetchCategoryNamesOrdered(),
  ]);

  const vendorsWithCompletion = vendors.map((v) => {
    const completionInput = {
      business_name: v.business_name,
      bio: v.bio,
      service_areas: v.service_areas,
      logo_url: v.logo_url,
      cover_image_url: v.cover_image_url,
      slug: v.slug,
      website: v.website,
      instagram: v.instagram,
      facebook: v.facebook,
      tiktok: v.tiktok,
    };
    const completionPercent = computeVendorProfileCompletionPercent(completionInput);
    const completionReady = isVendorProfileCompletionRequiredComplete(completionInput);
    return { ...v, completionPercent, completionReady };
  });
  const incomplete = vendorsWithCompletion.filter((v) => !v.completionReady);

  const filterChips = adminVendorFilterChips({ q, status, visibility, profile, category, area, sort });
  const hasActiveFilters = adminVendorHasActiveFilters({ q, status, visibility, profile, category, area, sort });
  const noVendorsInView = vendorsWithCompletion.length === 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Vendors</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Control public visibility, featured placement, promotional credits, account status, and internal notes. Hiding a
          vendor removes them from the directory and public profile URL; suspending blocks dashboards and quotes without
          deleting data.
        </p>
        <ButtonLink href="/admin/dashboard" variant="secondary" className="mt-2 inline-flex">
          Back to dashboard
        </ButtonLink>
      </header>

      <DashboardCard
        id="vendor-filters"
        title="Search and filter"
        description="Filters use the URL so you can bookmark or share a view."
      >
        <form action="/admin/vendors" method="get" className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:items-end">
          <div className="min-w-0 lg:col-span-2">
            <label htmlFor="admin-v-q" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Keyword
            </label>
            <DebouncedUrlKeywordInput
              key={q}
              id="admin-v-q"
              name="q"
              initialValue={q}
              placeholder="Name, business, slug, service area"
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-v-status" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Account status
            </label>
            <select
              id="admin-v-status"
              name="status"
              defaultValue={status}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-v-visibility" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Directory visibility
            </label>
            <select
              id="admin-v-visibility"
              name="visibility"
              defaultValue={visibility}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="all">Public + hidden</option>
              <option value="public">Public only</option>
              <option value="hidden">Hidden only</option>
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-v-profile" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Profile completion
            </label>
            <select
              id="admin-v-profile"
              name="profile"
              defaultValue={profile}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="all">All</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-v-category" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Quote category
            </label>
            <select
              id="admin-v-category"
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
            <label htmlFor="admin-v-area" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Service area contains
            </label>
            <input
              id="admin-v-area"
              name="area"
              defaultValue={area}
              placeholder="e.g. Williamsburg"
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="admin-v-sort" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Sort
            </label>
            <select
              id="admin-v-sort"
              name="sort"
              defaultValue={sort}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="active">Most active</option>
              <option value="credits">Highest credits</option>
              <option value="rated">Highest rated</option>
              <option value="name">Alphabetical (A–Z)</option>
            </select>
          </div>
          <div className="flex min-w-0 w-full flex-col gap-2 lg:col-span-4 sm:flex-row sm:flex-wrap sm:items-stretch">
            <button
              type="submit"
              className="inline-flex w-full min-w-0 items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f] sm:w-auto"
            >
              Apply
            </button>
            <Link
              href="/admin/vendors"
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
        id="incomplete-vendors"
        title="Incomplete profiles"
        description="Vendors who have not finished required business fields yet (respects filters above)."
      >
        {incomplete.length === 0 ? (
          <div className="space-y-3 text-sm text-brand-navy-muted">
            {noVendorsInView ? (
              <p>No vendors in this filtered view.</p>
            ) : hasActiveFilters ? (
              <p>No incomplete vendor profiles match these filters.</p>
            ) : (
              <p>Every vendor in this view has completed the required profile fields.</p>
            )}
            {hasActiveFilters ? (
              <Link
                href="/admin/vendors"
                className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50"
              >
                Reset filters
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {incomplete.map((v) => (
              <li key={v.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-brand-navy">{v.business_name ?? v.full_name}</p>
                  <p className="text-sm text-brand-navy-muted">Slug: {v.slug ?? "—"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="warning">Incomplete</StatusBadge>
                  <StatusBadge tone="neutral">{v.completionPercent}% complete</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      <DashboardCard
        id="all-vendors"
        title="All vendors"
        description={`${adminVendorsResultLabel(vendorsWithCompletion.length, hasActiveFilters)} · save changes per row. Public directory only lists complete, visible vendors.`}
      >
        {noVendorsInView ? (
          <FilterListEmptyState
            variant={hasActiveFilters ? "no-results" : "no-records"}
            resourceNoun="vendor accounts"
            resetHref="/admin/vendors"
          />
        ) : (
          <ul className="space-y-6">
            {vendorsWithCompletion.map((v) => (
              <li key={v.id} className="rounded-xl border border-border-subtle bg-brand-navy/[0.02] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-brand-navy">{v.business_name ?? v.full_name}</p>
                    <p className="text-sm text-brand-navy-muted">
                      {v.slug ? (
                        <Link href={`/vendors/${v.slug}`} className="text-accent-blue hover:underline">
                          /vendors/{v.slug}
                        </Link>
                      ) : (
                        "No public slug"
                      )}
                    </p>
                    <p className="mt-1 text-xs text-brand-navy-muted">Joined {new Date(v.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {v.completionReady ? (
                      <StatusBadge tone="success">Complete</StatusBadge>
                    ) : (
                      <StatusBadge tone="warning">Incomplete</StatusBadge>
                    )}
                    <StatusBadge tone="neutral">{v.completionPercent}% complete</StatusBadge>
                    {v.status === "active" ? (
                      <StatusBadge tone="success">Active account</StatusBadge>
                    ) : v.status === "suspended" ? (
                      <StatusBadge tone="warning">Suspended</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Deactivated</StatusBadge>
                    )}
                    <StatusBadge tone="info">{v.credits_balance} credits</StatusBadge>
                    {v.is_public ? <StatusBadge tone="info">Public</StatusBadge> : <StatusBadge tone="neutral">Hidden</StatusBadge>}
                    {v.is_featured ? <StatusBadge tone="info">Featured</StatusBadge> : null}
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <AdminVendorCreditGrantForm vendorId={v.id} vendorSlug={v.slug} />
                  <AdminAccountStatusForms profileId={v.id} status={v.status} />
                  <AdminVendorSaveForm vendor={v} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
