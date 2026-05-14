import Link from "next/link";
import { DebouncedUrlKeywordInput } from "@/components/filters/DebouncedUrlKeywordInput";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import type { VendorDirectorySort } from "@/lib/filters/phase30Search";
import { marketplaceBoroughVendorsResultLabel } from "@/lib/filters/filterResultLabels";
import type { BoroughPageConfig } from "@/lib/marketplace/boroughPages";
import { BOROUGH_PAGES } from "@/lib/marketplace/boroughPages";
import type { NeighborhoodPageConfig } from "@/lib/marketplace/neighborhoodPages";
import { nearbyNeighborhoods } from "@/lib/marketplace/neighborhoodPages";
import type { VendorCategoryPageConfig } from "@/lib/marketplace/vendorCategoryPages";
import { VENDOR_CATEGORY_PAGES, vendorCategoryBoroughPath, vendorCategoryHubPath, vendorCategoryNeighborhoodPath } from "@/lib/marketplace/vendorCategoryPages";
import { breadcrumbListJsonLd, vendorDirectoryItemListJsonLd } from "@/lib/seo/vendorListingSchema";
import { bioExcerpt, parseServiceAreas } from "@/lib/vendor-profile/directoryPresentation";
import { selectSpotlightDirectoryVendors } from "@/lib/vendor-profile/profileCompletion";
import { fetchPublicVendorDirectory } from "@/lib/vendor-profile/queries";
import { VendorDirectoryTrustSignals } from "@/components/marketplace/VendorDirectoryTrustSignals";
import { VendorDirectoryLogoImage } from "@/components/ui/VendorDirectoryLogoImage";

function normalize(value: string | undefined): string {
  return (value || "").trim();
}

function buildNeighborhoodHref(
  categorySlug: string,
  boroughSlug: string,
  neighborhoodSlug: string,
  params: { q?: string; sort?: VendorDirectorySort },
): string {
  const query = new URLSearchParams();
  if (params.q) {
    query.set("q", params.q);
  }
  if (params.sort && params.sort !== "name") {
    query.set("sort", params.sort);
  }
  const qs = query.toString();
  const base = vendorCategoryNeighborhoodPath(categorySlug, boroughSlug, neighborhoodSlug);
  return qs ? `${base}?${qs}` : base;
}

export function buildNeighborhoodIntro(
  category: VendorCategoryPageConfig,
  borough: BoroughPageConfig,
  neighborhood: NeighborhoodPageConfig,
): string {
  return `Find ${category.directoryCategoryName} who list ${neighborhood.displayName} or ${borough.displayName} in their public service areas. Compare profiles on Brook Planner, then post your event to request quotes.`;
}

export function buildNeighborhoodMetaDescription(
  category: VendorCategoryPageConfig,
  borough: BoroughPageConfig,
  neighborhood: NeighborhoodPageConfig,
): string {
  return `${category.directoryCategoryName} in ${neighborhood.displayName}, ${borough.displayName}: browse public vendor profiles on Brook Planner and invite quotes when you are ready.`;
}

type VendorCategoryNeighborhoodHubProps = {
  category: VendorCategoryPageConfig;
  borough: BoroughPageConfig;
  neighborhood: NeighborhoodPageConfig;
  query: string;
  sort: VendorDirectorySort;
};

export async function VendorCategoryNeighborhoodHub({
  category,
  borough,
  neighborhood,
  query,
  sort,
}: VendorCategoryNeighborhoodHubProps) {
  const qNorm = normalize(query);
  const areaNorm = neighborhood.serviceAreaMatch;

  const [vendors, peers] = await Promise.all([
    fetchPublicVendorDirectory({
      category: category.directoryCategoryName,
      query: qNorm || undefined,
      area: areaNorm,
      sort,
    }),
    fetchPublicVendorDirectory({
      category: category.directoryCategoryName,
      area: areaNorm,
    }),
  ]);
  const spotlightVendors = selectSpotlightDirectoryVendors(peers, 3);

  const hasFilters = Boolean(qNorm) || sort !== "name";

  const areaOptions = Array.from(
    new Set(peers.flatMap((vendor) => parseServiceAreas(vendor.service_areas))),
  ).sort((a, b) => a.localeCompare(b));

  const h1 = `${category.directoryCategoryName} in ${neighborhood.displayName}`;
  const peersPath = vendorCategoryNeighborhoodPath(category.slug, borough.slug, neighborhood.slug);

  const peersNear = nearbyNeighborhoods(borough.slug, neighborhood.slug, 8);

  return (
    <>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Vendors", path: "/vendors" },
          { name: category.directoryCategoryName, path: vendorCategoryHubPath(category.slug) },
          { name: borough.displayName, path: vendorCategoryBoroughPath(category.slug, borough.slug) },
          { name: neighborhood.displayName, path: peersPath },
        ])}
      />
      {vendors.length ? <JsonLd data={vendorDirectoryItemListJsonLd(vendors)} /> : null}

      <Container className="space-y-8 py-10 sm:space-y-10 sm:py-12">
        <header className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Vendor marketplace</p>
            <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">{h1}</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
              {buildNeighborhoodIntro(category, borough, neighborhood)}
            </p>
          </div>
          <nav aria-label="Neighborhood page actions" className="flex flex-wrap gap-2">
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
              Browse All Vendors
            </Link>
            <Link
              href={vendorCategoryBoroughPath(category.slug, borough.slug)}
              className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50"
            >
              All {borough.displayName} {category.directoryCategoryName}
            </Link>
            <Link
              href={vendorCategoryHubPath(category.slug)}
              className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50"
            >
              NYC-wide hub
            </Link>
          </nav>
        </header>

        <nav aria-label="Nearby neighborhoods" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Nearby neighborhoods</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {peersNear.length ? (
              peersNear.map((n) => (
                <li key={n.slug}>
                  <Link
                    href={buildNeighborhoodHref(category.slug, borough.slug, n.slug, { q: qNorm, sort })}
                    className="inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-accent-blue/40 hover:bg-white"
                  >
                    {n.displayName}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-sm text-brand-navy-muted">Explore other borough hubs for more local guides.</li>
            )}
          </ul>
        </nav>

        <nav aria-label="Same neighborhood, other categories" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
            Popular services in {neighborhood.displayName}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {VENDOR_CATEGORY_PAGES.filter((c) => c.slug !== category.slug).map((c) => (
              <li key={c.slug}>
                <Link
                  href={buildNeighborhoodHref(c.slug, borough.slug, neighborhood.slug, { q: qNorm, sort })}
                  className="inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-accent-blue/40 hover:bg-white"
                >
                  {c.directoryCategoryName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Same category, other boroughs" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
            {category.directoryCategoryName} by borough
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {BOROUGH_PAGES.map((b) => (
              <li key={b.slug}>
                <Link
                  href={vendorCategoryBoroughPath(category.slug, b.slug)}
                  className={
                    b.slug === borough.slug
                      ? "inline-flex rounded-full border border-accent-blue/50 bg-accent-blue/10 px-3 py-1 text-xs font-semibold text-brand-navy"
                      : "inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-accent-blue/40 hover:bg-white"
                  }
                >
                  {b.displayName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label="Search vendors in this neighborhood" className="rounded-2xl border border-border-subtle bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
          <form
            action={vendorCategoryNeighborhoodPath(category.slug, borough.slug, neighborhood.slug)}
            method="get"
            className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end"
          >
            <div className="min-w-0 md:col-span-2">
              <label htmlFor="hood-q" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
                Keyword search
              </label>
              <DebouncedUrlKeywordInput
                key={qNorm}
                id="hood-q"
                name="q"
                initialValue={qNorm}
                placeholder={`Search ${neighborhood.displayName} vendors`}
                className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="hood-sort" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
                Sort
              </label>
              <select
                id="hood-sort"
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
            <div className="flex min-w-0 w-full flex-col gap-2 md:col-span-3 sm:flex-row sm:flex-wrap sm:items-stretch">
              <button
                type="submit"
                className="inline-flex w-full min-w-0 items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f] sm:w-auto"
              >
                Apply
              </button>
              <Link
                href={vendorCategoryNeighborhoodPath(category.slug, borough.slug, neighborhood.slug)}
                className="inline-flex w-full min-w-0 items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50 sm:w-auto"
              >
                Clear
              </Link>
            </div>
          </form>
          {areaOptions.length > 1 ? (
            <p className="mt-3 text-xs text-brand-navy-muted">
              Results match <span className="font-semibold text-brand-navy">{neighborhood.displayName}</span> inside each
              vendor&apos;s public service area text.
            </p>
          ) : null}
        </section>

        {spotlightVendors.length ? (
          <section aria-labelledby={`${category.slug}-${borough.slug}-${neighborhood.slug}-spotlight`} className="space-y-4">
            <div>
              <h2
                id={`${category.slug}-${borough.slug}-${neighborhood.slug}-spotlight`}
                className="text-lg font-semibold text-brand-navy"
              >
                Spotlight near {neighborhood.displayName}
              </h2>
              <p className="mt-1 text-sm text-brand-navy-muted">Featured and complete profiles in this slice of the directory.</p>
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

        <section aria-labelledby={`${category.slug}-${borough.slug}-${neighborhood.slug}-results`} className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
            <h2 id={`${category.slug}-${borough.slug}-${neighborhood.slug}-results`} className="text-lg font-semibold text-brand-navy">
              {category.directoryCategoryName} near {neighborhood.displayName}
            </h2>
            <p className="text-sm text-brand-navy-muted">{marketplaceBoroughVendorsResultLabel(vendors.length, hasFilters)}</p>
          </div>

          {vendors.length === 0 ? (
            <article className="rounded-2xl border border-border-subtle bg-white p-8 text-center shadow-[var(--shadow-card)]">
              <h3 className="text-lg font-semibold text-brand-navy">
                {hasFilters ? "No vendors match your filters" : "No vendors list this neighborhood yet"}
              </h3>
              <p className="mt-2 text-sm text-brand-navy-muted">
                Try the wider {borough.displayName} hub, browse all NYC {category.directoryCategoryName}, or explore a nearby
                neighborhood.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  href={buildNeighborhoodHref(category.slug, borough.slug, neighborhood.slug, {})}
                  className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50"
                >
                  Clear search
                </Link>
                <Link
                  href={vendorCategoryBoroughPath(category.slug, borough.slug)}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f]"
                >
                  View all {borough.displayName} {category.directoryCategoryName}
                </Link>
              </div>
            </article>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {vendors.map((vendor) => {
                const areasLine = vendor.service_areas?.trim() || "Brooklyn and surrounding areas";
                const areas = parseServiceAreas(vendor.service_areas);

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
                        <span className="font-semibold text-brand-navy">Service areas:</span> {areas.slice(0, 4).join(", ")}
                      </p>
                    ) : null}

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
