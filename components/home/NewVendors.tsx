import Link from "next/link";
import type { PublicVendorDirectoryRow } from "@/lib/vendor-profile/types";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";

function serviceAreaLabel(serviceAreas: string | null): string {
  const raw = (serviceAreas || "").trim();
  return raw || "New York City area";
}

function categoryLine(categories: string[]): string {
  const list = (categories ?? []).map((c) => c.trim()).filter(Boolean);
  if (!list.length) {
    return "Marketplace vendor";
  }
  if (list.length <= 2) {
    return list.join(" · ");
  }
  return `${list.slice(0, 2).join(" · ")} +${list.length - 2}`;
}

type NewVendorsProps = {
  vendors: PublicVendorDirectoryRow[];
  /** From `public_marketplace_stats` when available (Phase 31). */
  recentJoinCount?: number;
};

export function NewVendors({ vendors, recentJoinCount }: NewVendorsProps) {
  if (!vendors.length) {
    return null;
  }

  return (
    <Section className="border-t border-border-subtle bg-white">
      <Container>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <Badge variant="blue" className="mb-3">
              Fresh on the marketplace
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">New Vendors On Brook Planner</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-navy-muted sm:text-base">
              Recently joined professionals with public profiles — explore the full directory for every specialty.
            </p>
            {recentJoinCount !== undefined && recentJoinCount > 0 ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-accent-blue">
                {recentJoinCount} vendor{recentJoinCount === 1 ? "" : "s"} joined the marketplace in the last 30 days
              </p>
            ) : null}
          </div>
          <Link
            href="/vendors"
            className="shrink-0 text-sm font-semibold text-accent-blue transition-colors duration-200 ease-out hover:text-brand-navy hover:underline"
          >
            Browse all vendors →
          </Link>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <article className="flex h-full flex-col rounded-2xl border border-border-subtle bg-[#fafbf9] p-5 ring-1 ring-black/[0.03]">
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-brand-navy">{vendor.business_name}</h3>
                <p className="mt-2 text-xs font-medium text-brand-navy-muted">{categoryLine(vendor.categories)}</p>
                <p className="mt-2 text-xs text-brand-navy-muted">{serviceAreaLabel(vendor.service_areas)}</p>
                <div className="mt-4 flex flex-1 items-end">
                  <Link
                    href={`/vendors/${vendor.slug}`}
                    className="text-sm font-semibold text-accent-blue transition-colors hover:text-brand-navy hover:underline"
                  >
                    View profile
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
