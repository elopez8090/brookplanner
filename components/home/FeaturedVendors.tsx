import Link from "next/link";
import type { PublicVendorDirectoryRow } from "@/lib/vendor-profile/types";
import {
  computeVendorProfileCompletionPercent,
  publicVendorDirectoryRowToCompletionInput,
} from "@/lib/vendor-profile/profileCompletion";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { VendorDirectoryTrustSignals } from "@/components/marketplace/VendorDirectoryTrustSignals";
import { VendorLogoMark } from "@/components/home/VendorLogoMark";

function bioExcerpt(value: string | null): string {
  const input = (value || "").trim();
  if (!input) {
    return "Open their profile to read the full story and see how they work across NYC events.";
  }
  if (input.length <= 130) {
    return input;
  }
  return `${input.slice(0, 127).trimEnd()}…`;
}

function serviceAreaLabel(serviceAreas: string | null): string {
  const raw = (serviceAreas || "").trim();
  return raw || "New York City area";
}

function completionBadge(percent: number): { label: string; className: string } | null {
  if (percent >= 100) {
    return {
      label: "Profile complete",
      className: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
    };
  }
  if (percent >= 90) {
    return {
      label: "Standout profile",
      className: "bg-accent-blue/12 text-brand-navy ring-accent-blue/30",
    };
  }
  if (percent >= 80) {
    return {
      label: "Marketplace ready",
      className: "bg-stone-100 text-stone-800 ring-stone-300/80",
    };
  }
  return null;
}

type FeaturedVendorsProps = {
  vendors: PublicVendorDirectoryRow[];
};

export function FeaturedVendors({ vendors }: FeaturedVendorsProps) {
  if (!vendors.length) {
    return null;
  }

  return (
    <Section className="border-t border-border-subtle bg-[#eef1ec]">
      <Container>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <Badge variant="navy" className="mb-3">
              Marketplace picks
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Featured NYC Vendors</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-navy-muted sm:text-base">
              Strong, marketplace-ready profiles — logos, service areas, and categories hosts actually compare before
              requesting quotes.
            </p>
          </div>
          <Link
            href="/vendors"
            className="shrink-0 text-sm font-semibold text-accent-blue transition-colors duration-200 ease-out hover:text-brand-navy hover:underline"
          >
            Browse all vendors →
          </Link>
        </div>

        <ul className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => {
            const initials = vendor.business_name.trim().charAt(0).toUpperCase() || "V";
            const completion = computeVendorProfileCompletionPercent(publicVendorDirectoryRowToCompletionInput(vendor));
            const badge = completionBadge(completion);
            const cats = (vendor.categories ?? []).map((c) => c.trim()).filter(Boolean).slice(0, 4);

            return (
              <li key={vendor.id}>
                <article className="flex h-full flex-col rounded-[1.35rem] border border-border-subtle bg-white p-7 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]">
                  <div className="flex items-start gap-4">
                    <VendorLogoMark
                      src={vendor.logo_url}
                      alt={`${vendor.business_name} logo`}
                      initials={initials}
                      className="h-[3.75rem] w-[3.75rem]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold tracking-tight text-brand-navy">{vendor.business_name}</h3>
                        {badge ? (
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-brand-navy-muted">
                        {serviceAreaLabel(vendor.service_areas)}
                      </p>
                      <div className="mt-3">
                        <VendorDirectoryTrustSignals
                          reviewCount={vendor.review_count ?? 0}
                          avgRating={vendor.avg_rating ?? null}
                          quotesSubmittedCount={vendor.quotes_submitted_count ?? 0}
                          isFeatured={vendor.is_featured}
                          showCompleteProfileBadge={false}
                        />
                      </div>
                    </div>
                  </div>

                  {cats.length ? (
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Categories">
                      {cats.map((c) => (
                        <li key={c}>
                          <span className="inline-flex rounded-lg bg-brand-navy/[0.06] px-2.5 py-1 text-xs font-semibold text-brand-navy ring-1 ring-brand-navy/10">
                            {c}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <p className="mt-5 flex-1 text-sm leading-relaxed text-brand-navy/90">{bioExcerpt(vendor.bio)}</p>

                  <div className="mt-7">
                    <Link
                      href={`/vendors/${vendor.slug}`}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f] sm:w-auto"
                    >
                      View Profile
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
