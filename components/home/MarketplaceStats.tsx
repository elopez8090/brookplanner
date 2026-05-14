import type { MarketplaceStats as MarketplaceStatsModel } from "@/lib/home/queries";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

function formatStat(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.floor(n)));
}

type MarketplaceStatsProps = {
  stats: MarketplaceStatsModel | null;
};

export function MarketplaceStats({ stats }: MarketplaceStatsProps) {
  return (
    <Section className="relative border-t border-white/10 bg-gradient-to-b from-[#07121c] to-[#050d14] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent-coral/10 via-transparent to-transparent opacity-90" aria-hidden />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-3 inline-flex rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-inset ring-white/18">
            Marketplace activity
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">A live NYC vendor network</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
            Aggregates from Brook Planner today — vendor listings, posted events, submitted quotes, and borough coverage
            across public profiles.
          </p>
        </div>

        {stats ? (
          <div className="mt-12 space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-8 text-center shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)] ring-1 ring-white/10 backdrop-blur-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">Total vendors</dt>
                <dd className="mt-3 text-4xl font-bold tabular-nums text-white">{formatStat(stats.vendorCount)}</dd>
                <p className="mt-2 text-xs leading-relaxed text-white/55">Public marketplace profiles ready to quote</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-8 text-center shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)] ring-1 ring-white/10 backdrop-blur-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">Total events</dt>
                <dd className="mt-3 text-4xl font-bold tabular-nums text-white">{formatStat(stats.eventsPosted)}</dd>
                <p className="mt-2 text-xs leading-relaxed text-white/55">Active and completed host listings on the platform</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-8 text-center shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)] ring-1 ring-white/10 backdrop-blur-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">Total quotes</dt>
                <dd className="mt-3 text-4xl font-bold tabular-nums text-white">{formatStat(stats.quotesSubmitted)}</dd>
                <p className="mt-2 text-xs leading-relaxed text-white/55">Vendor proposals submitted through Brook Planner</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-8 text-center shadow-[0_20px_50px_-24px_rgba(0,0,0,0.65)] ring-1 ring-white/10 backdrop-blur-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/60">Boroughs served</dt>
                <dd className="mt-3 text-4xl font-bold tabular-nums text-white">{formatStat(stats.boroughsWithVendorCoverage)}</dd>
                <p className="mt-2 text-xs leading-relaxed text-white/55">NYC boroughs represented in vendor service areas</p>
              </div>
            </dl>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center ring-1 ring-white/8 backdrop-blur-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/55">Public reviews</dt>
                <dd className="mt-2 text-2xl font-bold tabular-nums text-white">{formatStat(stats.publicReviewsCount)}</dd>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Published feedback from customers</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center ring-1 ring-white/8 backdrop-blur-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/55">Complete vendor profiles</dt>
                <dd className="mt-2 text-2xl font-bold tabular-nums text-white">{formatStat(stats.vendorProfilesComplete)}</dd>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Vendors who finished their business profile</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center ring-1 ring-white/8 backdrop-blur-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/55">New marketplace vendors</dt>
                <dd className="mt-2 text-2xl font-bold tabular-nums text-white">{formatStat(stats.vendorsJoinedLast30Days)}</dd>
                <p className="mt-1 text-xs leading-relaxed text-white/50">Joined the public directory in the last 30 days</p>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mx-auto mt-10 max-w-lg text-center text-sm text-white/60">
            Marketplace statistics are temporarily unavailable. Vendor listings and category hubs still reflect live
            directory data.
          </p>
        )}
      </Container>
    </Section>
  );
}
