import Link from "next/link";
import { DebouncedUrlKeywordInput } from "@/components/filters/DebouncedUrlKeywordInput";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import type { VendorDirectorySort } from "@/lib/filters/phase30Search";
import { marketplaceVendorsResultLabel } from "@/lib/filters/filterResultLabels";
import { BOROUGH_PAGES } from "@/lib/marketplace/boroughPages";
import { neighborhoodsForBorough } from "@/lib/marketplace/neighborhoodPages";
import { POPULAR_VENDOR_SEARCH_LINKS } from "@/lib/marketplace/popularVendorSearches";
import type { VendorCategoryPageConfig } from "@/lib/marketplace/vendorCategoryPages";
import {
  VENDOR_CATEGORY_PAGES,
  vendorCategoryBoroughPath,
  vendorCategoryHubPath,
  vendorCategoryNeighborhoodPath,
} from "@/lib/marketplace/vendorCategoryPages";
import { breadcrumbListJsonLd, vendorDirectoryItemListJsonLd } from "@/lib/seo/vendorListingSchema";
import { bioExcerpt, parseServiceAreas, toTitleCase } from "@/lib/vendor-profile/directoryPresentation";
import { selectSpotlightDirectoryVendors } from "@/lib/vendor-profile/profileCompletion";
import { fetchPublicVendorDirectory } from "@/lib/vendor-profile/queries";
import { VendorDirectoryTrustSignals } from "@/components/marketplace/VendorDirectoryTrustSignals";
import { VendorDirectoryLogoImage } from "@/components/ui/VendorDirectoryLogoImage";

function normalize(value: string | undefined): string {
  return (value || "").trim();
}

function buildCategoryHref(slug: string, params: { q?: string; area?: string; sort?: VendorDirectorySort }): string {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.area) {
    query.set("area", params.area);
  }
  if (params.sort && params.sort !== "name") {
    query.set("sort", params.sort);
  }
  const qs = query.toString();
  const base = vendorCategoryHubPath(slug);
  return qs ? `${base}?${qs}` : base;
}

function buildMainDirectoryHref(
  config: VendorCategoryPageConfig,
  qNorm: string,
  areaNorm: string,
  sort: VendorDirectorySort,
): string {
  const u = new URLSearchParams();
  u.set("category", config.directoryCategoryName);
  if (qNorm) {
    u.set("q", qNorm);
  }
  if (areaNorm) {
    u.set("area", areaNorm);
  }
  if (sort !== "name") {
    u.set("sort", sort);
  }
  return `/vendors?${u.toString()}`;
}

function boroughHubHref(categorySlug: string, boroughSlug: string, params: { q?: string; sort?: VendorDirectorySort }): string {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.sort && params.sort !== "name") {
    query.set("sort", params.sort);
  }
  const qs = query.toString();
  const base = vendorCategoryBoroughPath(categorySlug, boroughSlug);
  return qs ? `${base}?${qs}` : base;
}

type VendorCategoryHubProps = {
  config: VendorCategoryPageConfig;
  query: string;
  area: string;
  sort: VendorDirectorySort;
};

export async function VendorCategoryHub({ config, query, area, sort }: VendorCategoryHubProps) {
  const qNorm = normalize(query);
  const areaNorm = normalize(area);

  const [vendors, peersInCategory] = await Promise.all([
    fetchPublicVendorDirectory({
      category: config.directoryCategoryName,
      query: qNorm || undefined,
      area: areaNorm || undefined,
      sort,
    }),
    fetchPublicVendorDirectory({ category: config.directoryCategoryName }),
  ]);
  const spotlightVendors = selectSpotlightDirectoryVendors(peersInCategory, 3);

  const hasCategoryFilters = Boolean(qNorm) || Boolean(areaNorm) || sort !== "name";

  const areaOptions = Array.from(
    new Set(peersInCategory.flatMap((vendor) => parseServiceAreas(vendor.service_areas))),
  ).sort((a, b) => a.localeCompare(b));

  const categoryPath = vendorCategoryHubPath(config.slug);

  return (
    <>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Vendors", path: "/vendors" },
          { name: config.directoryCategoryName, path: categoryPath },
        ])}
      />
      {vendors.length ? <JsonLd data={vendorDirectoryItemListJsonLd(vendors)} /> : null}

      <Container className="space-y-8 py-10 sm:space-y-10 sm:py-12">
      <header className="space-y-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Vendor marketplace</p>
          <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">{config.heroTitle}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">{config.heroSubhead}</p>
        </div>
        <nav aria-label="Category actions" className="flex flex-wrap gap-2">
          <Link
            href="/post-event"
            className="inline-flex items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f]"
          >
            Post Your Event
          </Link>
          <Link
            href="/vendors"
            className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50"
          >
            Browse Vendors
          </Link>
        </nav>
      </header>

      <nav aria-label="Browse this category by borough" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Browse by borough</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {BOROUGH_PAGES.map((b) => (
            <li key={b.slug}>
              <Link
                href={boroughHubHref(config.slug, b.slug, { q: qNorm, sort })}
                className="inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-accent-blue/40 hover:bg-white"
              >
                {b.displayName}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {BOROUGH_PAGES.map((b) => {
        const hoods = neighborhoodsForBorough(b.slug);
        if (!hoods.length) {
          return null;
        }
        return (
          <nav
            key={b.slug}
            aria-label={`${config.directoryCategoryName} in ${b.displayName} neighborhoods`}
            className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              {b.displayName} neighborhoods · {config.directoryCategoryName}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {hoods.map((n) => (
                <li key={n.slug}>
                  <Link
                    href={vendorCategoryNeighborhoodPath(config.slug, b.slug, n.slug)}
                    className="inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-accent-blue/40 hover:bg-white"
                  >
                    {n.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        );
      })}

      <nav aria-label="Popular local searches" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Popular searches</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {POPULAR_VENDOR_SEARCH_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-accent-blue/40 hover:bg-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label="Browse other categories" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Related categories</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {VENDOR_CATEGORY_PAGES.filter((c) => c.slug !== config.slug).map((c) => (
            <li key={c.slug}>
              <Link
                href={buildCategoryHref(c.slug, { q: qNorm, area: areaNorm, sort })}
                className="inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-accent-blue/40 hover:bg-white"
              >
                {c.directoryCategoryName}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-label="Category filters" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
        <form action={vendorCategoryHubPath(config.slug)} method="get" className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
          <div className="min-w-0 md:col-span-2">
            <label htmlFor="category-q" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Keyword search
            </label>
            <DebouncedUrlKeywordInput
              key={qNorm}
              id="category-q"
              name="q"
              initialValue={qNorm}
              placeholder="Business name or bio"
              className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="category-area" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Service area
            </label>
            <select
              id="category-area"
              name="area"
              defaultValue={areaNorm}
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
            <label htmlFor="category-sort" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
              Sort
            </label>
            <select
              id="category-sort"
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
          <div className="flex min-w-0 w-full flex-col gap-2 md:col-span-4 sm:flex-row sm:flex-wrap sm:items-stretch">
            <button
              type="submit"
              className="inline-flex w-full min-w-0 items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f] sm:w-auto"
            >
              Apply filters
            </button>
            <Link
              href={vendorCategoryHubPath(config.slug)}
              className="inline-flex w-full min-w-0 items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50 sm:w-auto"
            >
              Clear
            </Link>
            <Link
              href={buildMainDirectoryHref(config, qNorm, areaNorm, sort)}
              className="inline-flex min-w-0 items-center justify-center text-center text-sm font-semibold leading-snug text-accent-blue hover:text-brand-navy hover:underline sm:px-1"
            >
              View in full directory →
            </Link>
          </div>
        </form>
      </section>

      {spotlightVendors.length ? (
        <section aria-labelledby={`${config.slug}-spotlight-heading`} className="space-y-4">
          <div>
            <h2 id={`${config.slug}-spotlight-heading`} className="text-lg font-semibold text-brand-navy">
              Spotlight
            </h2>
            <p className="mt-1 text-sm text-brand-navy-muted">
              Vendors with polished, complete marketplace profiles in this category.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spotlightVendors.map((vendor) => {
              const areasLine = vendor.service_areas?.trim() || "Brooklyn and surrounding areas";
              return (
                <li key={`spotlight-${vendor.id}`}>
                  <article className="flex h-full flex-col rounded-2xl border border-border-subtle bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-slate-100">
                        <VendorDirectoryLogoImage
                          logoUrl={vendor.logo_url}
                          businessName={vendor.business_name}
                          alt=""
                          fallbackClassName="text-base font-bold text-brand-navy"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-brand-navy">{vendor.business_name}</h3>
                        <p className="truncate text-xs text-brand-navy-muted">{areasLine}</p>
                      </div>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-navy">{bioExcerpt(vendor.bio)}</p>
                    <VendorDirectoryTrustSignals
                      className="mt-3"
                      reviewCount={vendor.review_count ?? 0}
                      avgRating={vendor.avg_rating ?? null}
                      quotesSubmittedCount={vendor.quotes_submitted_count ?? 0}
                      isFeatured={vendor.is_featured}
                    />
                    <div className="mt-4">
                      <Link
                        href={`/vendors/${vendor.slug}`}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f]"
                      >
                        View profile
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby={`${config.slug}-vendors-heading`} className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <h2 id={`${config.slug}-vendors-heading`} className="text-lg font-semibold text-brand-navy">
            {config.directoryCategoryName} vendors
          </h2>
          <p className="text-sm text-brand-navy-muted">{marketplaceVendorsResultLabel(vendors.length, hasCategoryFilters)}</p>
        </div>

        {vendors.length === 0 ? (
          <article className="rounded-2xl border border-border-subtle bg-white p-8 text-center shadow-[var(--shadow-card)]">
            <h3 className="text-lg font-semibold text-brand-navy">
              {hasCategoryFilters ? "No vendors match your filters" : "No vendors in this category yet"}
            </h3>
            <p className="mt-2 text-sm text-brand-navy-muted">Try broadening your search or clearing filters.</p>
            <Link
              href={buildCategoryHref(config.slug, { q: qNorm, sort })}
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50"
            >
              Reset area filter
            </Link>
          </article>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vendors.map((vendor) => {
              const areasLine = vendor.service_areas?.trim() || "Brooklyn and surrounding areas";

              return (
                <article
                  key={vendor.id}
                  className="flex h-full flex-col rounded-2xl border border-border-subtle bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03]"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-slate-100">
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
                      <p className="truncate text-xs text-brand-navy-muted">{areasLine}</p>
                    </div>
                  </div>

                  <p className="flex-1 text-sm leading-relaxed text-brand-navy">{bioExcerpt(vendor.bio)}</p>

                  <VendorDirectoryTrustSignals
                    className="mt-3"
                    reviewCount={vendor.review_count ?? 0}
                    avgRating={vendor.avg_rating ?? null}
                    quotesSubmittedCount={vendor.quotes_submitted_count ?? 0}
                    isFeatured={vendor.is_featured}
                  />

                  <div className="mt-5">
                    <Link
                      href={`/vendors/${vendor.slug}`}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f] sm:w-auto"
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
    </>
  );
}
