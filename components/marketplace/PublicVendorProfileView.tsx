import Link from "next/link";
import { VendorDirectoryTrustSignals } from "@/components/marketplace/VendorDirectoryTrustSignals";
import { Container } from "@/components/ui/Container";
import { VendorCoverImage } from "@/components/ui/VendorCoverImage";
import { VendorDirectoryLogoImage } from "@/components/ui/VendorDirectoryLogoImage";
import { getCategorySlugForDirectoryName, vendorCategoryHubPath } from "@/lib/marketplace/vendorCategoryPages";
import type { PublicVendorReviewsSummary } from "@/lib/reviews/types";
import type { PublicVendorProfile } from "@/lib/vendor-profile/types";
import { parseServiceAreas, toTitleCase } from "@/lib/vendor-profile/directoryPresentation";

function socialHref(kind: "instagram" | "facebook" | "tiktok", value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (kind === "instagram") {
    return `https://instagram.com/${value}`;
  }
  if (kind === "facebook") {
    return `https://facebook.com/${value}`;
  }
  return `https://tiktok.com/@${value.replace(/^@+/, "")}`;
}

type PublicVendorProfileViewProps = {
  vendor: PublicVendorProfile;
  reviews: PublicVendorReviewsSummary;
};

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function PublicVendorProfileView({ vendor, reviews }: PublicVendorProfileViewProps) {
  const businessName = vendor.business_name || vendor.full_name || "Vendor";
  const hasHeroImage = Boolean(vendor.cover_image_url);
  const serviceAreas = vendor.service_areas || "Brooklyn and surrounding areas";
  const areaList = parseServiceAreas(vendor.service_areas);
  const aboutText = vendor.bio?.trim() || "This vendor is still adding their story. Request a quote to learn how they can help with your event.";
  const reviewCountHeadline = reviews.total > 0 ? reviews.total : Number(vendor.public_review_count ?? 0);
  const avgHeadline = reviews.total > 0 ? reviews.average : vendor.public_avg_rating ?? null;
  const quoteActivity = Number(vendor.quote_activity_count ?? 0);
  const firstReviewSnippet = reviews.items.find((r) => r.review_text?.trim())?.review_text?.trim() ?? null;

  const heroPlaceholder = (
    <div className="flex h-full w-full items-end p-6">
      <p className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-navy">Brook Planner vendor</p>
    </div>
  );

  return (
    <Container className="py-8 sm:py-10">
      <article className="overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.03]">
        <div className="relative h-48 bg-gradient-to-r from-brand-navy to-[#12553f] sm:h-60">
          {hasHeroImage ? (
            <VendorCoverImage
              src={vendor.cover_image_url || ""}
              alt={`${businessName} cover`}
              fallback={heroPlaceholder}
            />
          ) : (
            heroPlaceholder
          )}
        </div>

        <div className="px-5 pb-8 pt-0 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 sm:h-24 sm:w-24">
                <VendorDirectoryLogoImage
                  logoUrl={vendor.logo_url}
                  businessName={businessName}
                  alt={`${businessName} logo`}
                  fallbackClassName="text-xl font-bold text-brand-navy"
                  sizes="(max-width: 640px) 80px, 96px"
                />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">{businessName}</h1>
                <p className="mt-1 text-sm text-brand-navy-muted">{serviceAreas}</p>
                <VendorDirectoryTrustSignals
                  className="mt-3"
                  reviewCount={reviewCountHeadline}
                  avgRating={avgHeadline}
                  quotesSubmittedCount={quoteActivity}
                  isFeatured={vendor.is_featured}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/post-event"
                className="inline-flex items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f]"
              >
                Request Quote
              </Link>
              <Link
                href="/post-event"
                className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50"
              >
                Post Your Event
              </Link>
            </div>
          </div>

          <section className="mt-7 space-y-7">
            <p className="text-sm leading-relaxed text-brand-navy-muted">
              Public marketplace profile — no pricing shown here. Post your event on Brook Planner to invite quotes when you are ready.
            </p>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy-muted">About</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy sm:text-base">{aboutText}</p>
            </div>

            {areaList.length ? (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy-muted">Service areas</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {areaList.map((area) => (
                    <li
                      key={area}
                      className="rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy"
                    >
                      {toTitleCase(area)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy-muted">Categories served</h2>
                {vendor.categories.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {vendor.categories.map((category) => {
                      const hubSlug = getCategorySlugForDirectoryName(category);
                      return (
                        <li key={category}>
                          {hubSlug ? (
                            <Link
                              href={vendorCategoryHubPath(hubSlug)}
                              className="inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy transition-colors hover:border-accent-blue/50 hover:bg-white hover:text-accent-blue"
                            >
                              {category}
                            </Link>
                          ) : (
                            <span className="inline-flex rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy">
                              {category}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-brand-navy-muted">
                    Service categories appear here as this vendor participates in marketplace events — it helps to see
                    their specialties at a glance.
                  </p>
                )}
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy-muted">Contact and links</h2>
                <ul className="mt-2 space-y-2 text-sm text-brand-navy">
                  {vendor.business_phone ? <li>Phone: {vendor.business_phone}</li> : null}
                  {vendor.website ? (
                    <li>
                      Website:{" "}
                      <a href={vendor.website} target="_blank" rel="noreferrer" className="font-semibold text-accent-blue hover:underline">
                        {vendor.website}
                      </a>
                    </li>
                  ) : null}
                  {vendor.instagram ? (
                    <li>
                      Instagram:{" "}
                      <a
                        href={socialHref("instagram", vendor.instagram)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-accent-blue hover:underline"
                      >
                        @{vendor.instagram.replace(/^@+/, "")}
                      </a>
                    </li>
                  ) : null}
                  {vendor.facebook ? (
                    <li>
                      Facebook:{" "}
                      <a
                        href={socialHref("facebook", vendor.facebook)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-accent-blue hover:underline"
                      >
                        {vendor.facebook}
                      </a>
                    </li>
                  ) : null}
                  {vendor.tiktok ? (
                    <li>
                      TikTok:{" "}
                      <a
                        href={socialHref("tiktok", vendor.tiktok)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-accent-blue hover:underline"
                      >
                        @{vendor.tiktok.replace(/^@+/, "")}
                      </a>
                    </li>
                  ) : null}
                  {!vendor.business_phone && !vendor.website && !vendor.instagram && !vendor.facebook && !vendor.tiktok ? (
                    <li className="text-brand-navy-muted">
                      Phone, website, and social links will show here when this vendor adds them.
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-7">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy-muted">Reviews</h2>
              {reviews.total === 0 ? (
                <p className="mt-2 text-sm leading-relaxed text-brand-navy-muted">No reviews yet.</p>
              ) : (
                <div className="mt-3 space-y-4">
                  <p className="text-sm font-medium text-brand-navy">
                    <span className="tabular-nums">{reviews.average !== null ? reviews.average.toFixed(1) : "—"}</span>{" "}
                    average · <span className="tabular-nums">{reviews.total}</span>{" "}
                    {reviews.total === 1 ? "review" : "reviews"}
                  </p>
                  {firstReviewSnippet ? (
                    <figure className="rounded-2xl border border-border-subtle bg-white px-4 py-3 text-sm text-brand-navy shadow-[var(--shadow-card)]">
                      <figcaption className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
                        Recent feedback
                      </figcaption>
                      <blockquote className="mt-2 text-brand-navy-muted">
                        <p className="line-clamp-4 whitespace-pre-wrap leading-relaxed">
                          “{firstReviewSnippet.length > 220 ? `${firstReviewSnippet.slice(0, 217).trimEnd()}…` : firstReviewSnippet}”
                        </p>
                      </blockquote>
                    </figure>
                  ) : null}
                  <ul className="space-y-4">
                    {reviews.items.map((rev) => (
                      <li key={rev.id} className="rounded-2xl border border-border-subtle bg-slate-50/80 px-4 py-3 text-sm text-brand-navy">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold tabular-nums">{rev.rating} / 5</p>
                          <p className="text-xs text-brand-navy-muted">{formatReviewDate(rev.created_at)}</p>
                        </div>
                        {rev.review_text?.trim() ? (
                          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-brand-navy-muted">{rev.review_text.trim()}</p>
                        ) : (
                          <p className="mt-2 text-brand-navy-muted italic">No written feedback.</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </article>
    </Container>
  );
}
