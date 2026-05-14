import Link from "next/link";
import type { HomeCategoryCardWithCount } from "@/lib/home/queries";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

type CategoryIconProps = { className?: string };

function IconDisc({ className }: CategoryIconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" className="text-white/25" />
      <circle cx="20" cy="14" r="4" fill="currentColor" className="text-accent-coral/95" />
      <path d="M12 28c2.5-4 13.5-4 16 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/85" />
    </svg>
  );
}

function IconLens({ className }: CategoryIconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="18" cy="18" r="10" stroke="currentColor" strokeWidth="1.5" className="text-white/80" />
      <path d="M26 26l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/80" />
      <circle cx="18" cy="18" r="4" fill="currentColor" className="text-accent-blue/90" />
    </svg>
  );
}

function IconForkKnife({ className }: CategoryIconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path d="M14 8v24M14 8c2 0 3 1.5 3 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/80" />
      <path d="M26 8v6c0 2 1 3 3 3v15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/80" />
    </svg>
  );
}

function IconBuilding({ className }: CategoryIconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path d="M12 34V14l8-4 8 4v20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-white/80" />
      <path d="M16 34v-8h8v8" stroke="currentColor" strokeWidth="1.5" className="text-white/80" />
      <path d="M18 18h4M18 22h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-accent-coral/95" />
    </svg>
  );
}

function IconChair({ className }: CategoryIconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path d="M14 18h12v10H14V18z" stroke="currentColor" strokeWidth="1.5" className="text-white/80" />
      <path d="M12 28h16M18 18V14h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/80" />
      <path d="M10 32h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent-blue/90" />
    </svg>
  );
}

function IconClipboard({ className }: CategoryIconProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path d="M14 10h12l2 4v20H12V14l2-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-white/80" />
      <path d="M16 18h8M16 22h6M16 26h7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-accent-coral/90" />
    </svg>
  );
}

const ICONS = [IconDisc, IconLens, IconForkKnife, IconBuilding, IconChair, IconClipboard] as const;

function formatVendorCountLabel(n: number): string | null {
  if (n <= 0) {
    return null;
  }
  if (n === 1) {
    return "1 vendor";
  }
  return `${new Intl.NumberFormat("en-US").format(n)} vendors`;
}

type FeaturedCategoriesProps = {
  cards: HomeCategoryCardWithCount[];
};

export function FeaturedCategories({ cards }: FeaturedCategoriesProps) {
  return (
    <Section
      id="categories"
      className="relative border-y border-white/10 bg-gradient-to-b from-[#0c1a26] via-[#0e2233] to-[#0a1520] text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-blue/12 via-transparent to-transparent" aria-hidden />
      <Container className="relative">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <span className="mb-3 inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-inset ring-white/20">
              Popular categories
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Browse NYC vendor specialties</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/72 sm:text-base">
              Each card opens a curated category hub. Vendor totals appear on a card when at least one directory vendor has quote activity in that specialty.
            </p>
          </div>
          <Link
            href="/vendors"
            className="shrink-0 text-sm font-semibold text-accent-blue transition-colors duration-200 ease-out hover:text-white hover:underline"
          >
            View full directory →
          </Link>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((cat, index) => {
            const Icon = ICONS[index] ?? IconDisc;
            const vendorCountLabel = formatVendorCountLabel(cat.vendorCount);
            return (
              <li key={cat.name}>
                <Link
                  href={cat.vendorsHref}
                  className="group flex h-full flex-col rounded-2xl border border-white/12 bg-white/[0.07] p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-sm transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.11] hover:shadow-[0_28px_70px_-24px_rgba(0,0,0,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-white/14">
                      <Icon className="h-9 w-9" />
                    </div>
                    <span
                      className="mt-1 text-white/40 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-accent-coral"
                      aria-hidden
                    >
                      →
                    </span>
                  </div>
                  <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
                    <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-accent-blue">{cat.name}</h3>
                    {vendorCountLabel ? (
                      <span className="text-xs font-semibold tabular-nums text-white/55">{vendorCountLabel}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/68">{cat.blurb}</p>
                  <span className="mt-5 inline-flex text-xs font-semibold uppercase tracking-wide text-accent-blue opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Browse {cat.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
