import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilterChips } from "@/components/filters/ActiveFilterChips";
import { CopyFilteredViewLink } from "@/components/filters/CopyFilteredViewLink";
import { DebouncedUrlKeywordInput } from "@/components/filters/DebouncedUrlKeywordInput";
import { FilterListEmptyState } from "@/components/filters/FilterListEmptyState";
import { Container } from "@/components/ui/Container";
import { labelVendorDirectorySort } from "@/lib/filters/filterChipLabels";
import { vendorsDirectoryResultLabel } from "@/lib/filters/filterResultLabels";
import { firstSearchParam, parseVendorDirectorySort, rpcOptionalText } from "@/lib/filters/phase30Search";
import { VENDOR_CATEGORY_PAGES, vendorCategoryHubPath } from "@/lib/marketplace/vendorCategoryPages";
import { absoluteUrl } from "@/lib/site";
import { bioExcerpt, parseServiceAreas, toTitleCase } from "@/lib/vendor-profile/directoryPresentation";
import { fetchPublicVendorDirectory } from "@/lib/vendor-profile/queries";
import { VendorDirectoryTrustSignals } from "@/components/marketplace/VendorDirectoryTrustSignals";
import { VendorDirectoryLogoImage } from "@/components/ui/VendorDirectoryLogoImage";

type VendorsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    area?: string | string[];
    sort?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Brooklyn Vendors | Brook Planner",
  description:
    "Browse trusted Brooklyn event vendors on Brook Planner. Discover DJs, photographers, caterers, and more by service area and category.",
  alternates: { canonical: absoluteUrl("/vendors") },
  openGraph: {
    title: "Brooklyn Vendors | Brook Planner",
    description:
      "Browse trusted Brooklyn event vendors on Brook Planner. Discover DJs, photographers, caterers, and more by service area and category.",
    url: absoluteUrl("/vendors"),
    type: "website",
  },
};

function buildSearchHref(params: { q?: string; category?: string; area?: string; sort?: string }): string {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.category) {
    query.set("category", params.category);
  }
  if (params.area) {
    query.set("area", params.area);
  }
  if (params.sort && params.sort !== "name") {
    query.set("sort", params.sort);
  }
  const output = query.toString();
  return output ? `/vendors?${output}` : "/vendors";
}

function directoryFilterChips(input: {
  query: string;
  category: string;
  area: string;
  sort: ReturnType<typeof parseVendorDirectorySort>;
}): { key: string; text: string }[] {
  const chips: { key: string; text: string }[] = [];
  const q = input.query.trim();
  if (q) {
    chips.push({ key: "q", text: `Keyword: ${q}` });
  }
  const cat = input.category.trim();
  if (cat) {
    chips.push({ key: "category", text: `Category: ${cat}` });
  }
  const ar = input.area.trim();
  if (ar) {
    chips.push({ key: "area", text: `Service area: ${toTitleCase(ar)}` });
  }
  if (input.sort !== "name") {
    chips.push({ key: "sort", text: `Sort: ${labelVendorDirectorySort(input.sort)}` });
  }
  return chips;
}

function directoryHasActiveFilters(input: {
  query: string;
  category: string;
  area: string;
  sort: ReturnType<typeof parseVendorDirectorySort>;
}): boolean {
  return (
    Boolean(input.query.trim()) ||
    Boolean(input.category.trim()) ||
    Boolean(input.area.trim()) ||
    input.sort !== "name"
  );
}

export default async function VendorsDirectoryPage({ searchParams }: VendorsPageProps) {
  const params = await searchParams;
  const query = rpcOptionalText(firstSearchParam(params.q)) ?? "";
  const category = rpcOptionalText(firstSearchParam(params.category)) ?? "";
  const area = rpcOptionalText(firstSearchParam(params.area)) ?? "";
  const sort = parseVendorDirectorySort(firstSearchParam(params.sort));

  const [vendors, allVendors] = await Promise.all([
    fetchPublicVendorDirectory({ query, category, area, sort }),
    fetchPublicVendorDirectory(),
  ]);

  const categoryOptions = Array.from(new Set(allVendors.flatMap((vendor) => vendor.categories))).sort((a, b) =>
    a.localeCompare(b),
  );
  const areaOptions = Array.from(new Set(allVendors.flatMap((vendor) => parseServiceAreas(vendor.service_areas)))).sort(
    (a, b) => a.localeCompare(b),
  );

  const filterChips = directoryFilterChips({ query, category, area, sort });
  const hasActiveFilters = directoryHasActiveFilters({ query, category, area, sort });
  const catalogEmpty = allVendors.length === 0;

  return (
    <Container className="space-y-8 py-10 sm:space-y-10 sm:py-12">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Vendor marketplace</p>
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">Browse Brooklyn vendors</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Discover trusted local vendors with complete business profiles. Filter by keyword, category, or service area,
          then sort by name, recency, quote activity, or ratings.
        </p>
      </header>

      <nav aria-label="Browse by category" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Browse by category</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {VENDOR_CATEGORY_PAGES.map((c) => (
            <li key={c.slug}>
              <Link
                href={vendorCategoryHubPath(c.slug)}
                className="inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-accent-blue/40 hover:bg-white"
              >
                {c.directoryCategoryName}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="Vendor filters" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <form action="/vendors" method="get" className="grid grid-cols-1 gap-3 md:grid-cols-5 md:items-end">
          <div className="min-w-0 md:col-span-2">
            <label htmlFor="q" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Keyword search
            </label>
            <DebouncedUrlKeywordInput
              key={query}
              id="q"
              name="q"
              initialValue={query}
              placeholder="Business name or bio"
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={category}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="area" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Service area
            </label>
            <select
              id="area"
              name="area"
              defaultValue={area}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="">All areas</option>
              {areaOptions.map((option) => (
                <option key={option} value={option}>
                  {toTitleCase(option)}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="sort" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Sort
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sort}
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            >
              <option value="name">Alphabetical (A–Z)</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="active">Most active</option>
              <option value="rated">Highest rated</option>
            </select>
          </div>
          <div className="flex min-w-0 w-full flex-col gap-2 md:col-span-5 sm:flex-row sm:flex-wrap sm:items-stretch">
            <button
              type="submit"
              className="inline-flex w-full min-w-0 items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f] sm:w-auto"
            >
              Apply filters
            </button>
            <Link
              href="/vendors"
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
      </section>

      <section aria-label="Vendor directory results" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <h2 className="text-lg font-semibold text-brand-navy">Directory</h2>
          <p className="text-sm text-brand-navy-muted">
            {vendorsDirectoryResultLabel(vendors.length, {
              hasActiveFilters,
              catalogEmpty,
            })}
          </p>
        </div>

        {vendors.length === 0 ? (
          <div className="space-y-4">
            <FilterListEmptyState
              variant={catalogEmpty ? "no-records" : "no-results"}
              resourceNoun="directory vendors"
              resetHref="/vendors"
              filterHint={
                catalogEmpty
                  ? undefined
                  : "Try a different keyword, pick another category or service area, or reset filters to see everyone in the directory."
              }
            />
            {!catalogEmpty && hasActiveFilters ? (
              <div className="flex justify-center">
                <Link
                  href={buildSearchHref({ q: query, sort })}
                  className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50"
                >
                  Clear category and area only
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vendors.map((vendor) => {
              const areas = parseServiceAreas(vendor.service_areas);
              return (
                <article
                  key={vendor.id}
                  className="flex h-full flex-col rounded-2xl border border-border-subtle bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03]"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border-subtle bg-slate-100">
                      <VendorDirectoryLogoImage
                        logoUrl={vendor.logo_url}
                        businessName={vendor.business_name}
                        alt={`${vendor.business_name} logo`}
                        fallbackClassName="text-lg font-bold text-brand-navy"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-brand-navy">{vendor.business_name}</h3>
                      <p className="truncate text-xs text-brand-navy-muted">{vendor.service_areas || "Brooklyn and surrounding areas"}</p>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-brand-navy">{bioExcerpt(vendor.bio)}</p>

                  <VendorDirectoryTrustSignals
                    className="mt-3"
                    reviewCount={vendor.review_count ?? 0}
                    avgRating={vendor.avg_rating ?? null}
                    quotesSubmittedCount={vendor.quotes_submitted_count ?? 0}
                    isFeatured={vendor.is_featured}
                  />

                  {vendor.categories.length ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {vendor.categories.slice(0, 4).map((item) => (
                        <li key={item} className="rounded-full border border-border-subtle bg-slate-50 px-2.5 py-1 text-xs font-medium text-brand-navy">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {areas.length ? (
                    <p className="mt-3 text-xs text-brand-navy-muted">
                      <span className="font-semibold text-brand-navy">Service areas:</span> {areas.slice(0, 3).join(", ")}
                    </p>
                  ) : null}

                  <div className="mt-5">
                    <Link
                      href={`/vendors/${vendor.slug}`}
                      className="inline-flex items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f]"
                    >
                      View Profile
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </Container>
  );
}
