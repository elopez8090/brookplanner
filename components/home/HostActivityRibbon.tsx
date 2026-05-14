import type { MarketplaceStats as MarketplaceStatsModel } from "@/lib/home/queries";

type HostActivityRibbonProps = {
  stats: MarketplaceStatsModel | null;
};

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.floor(n)));
}

export function HostActivityRibbon({ stats }: HostActivityRibbonProps) {
  if (!stats) {
    return null;
  }

  return (
    <div className="border-b border-border-subtle bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 text-center text-sm leading-relaxed text-brand-navy-muted sm:px-6 lg:px-8">
        <span className="font-medium text-brand-navy">Brooklyn & NYC hosts are posting here.</span>{" "}
        <span className="hidden sm:inline">
          {fmt(stats.eventsPosted)} events on the platform, {fmt(stats.quotesSubmitted)} vendor quotes submitted,{" "}
          {fmt(stats.publicReviewsCount)} public reviews from customers.
        </span>
        <span className="sm:hidden">
          {fmt(stats.eventsPosted)} events · {fmt(stats.quotesSubmitted)} quotes · {fmt(stats.publicReviewsCount)}{" "}
          reviews
        </span>
      </div>
    </div>
  );
}
