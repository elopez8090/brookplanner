import type { HomeCategoryCardWithCount, MarketplaceStats as MarketplaceStatsModel } from "@/lib/home/queries";
import type { PublicVendorDirectoryRow } from "@/lib/vendor-profile/types";
import { Hero } from "@/components/home/Hero";
import { TrustBullets } from "@/components/home/TrustBullets";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { FeaturedVendors } from "@/components/home/FeaturedVendors";
import { NewVendors } from "@/components/home/NewVendors";
import { HowItWorksHome } from "@/components/home/HowItWorksHome";
import { MarketplaceStats } from "@/components/home/MarketplaceStats";
import { VendorPitch } from "@/components/home/VendorPitch";
import { FinalCta } from "@/components/home/FinalCta";
import { HostActivityRibbon } from "@/components/home/HostActivityRibbon";

export type HomePageProps = {
  featuredVendors: PublicVendorDirectoryRow[];
  newVendors: PublicVendorDirectoryRow[];
  categoryCards: HomeCategoryCardWithCount[];
  marketplaceStats: MarketplaceStatsModel | null;
};

export function HomePage({ featuredVendors, newVendors, categoryCards, marketplaceStats }: HomePageProps) {
  return (
    <>
      <Hero />
      <HostActivityRibbon stats={marketplaceStats} />
      <TrustBullets />
      <FeaturedCategories cards={categoryCards} />
      <FeaturedVendors vendors={featuredVendors} />
      <NewVendors vendors={newVendors} recentJoinCount={marketplaceStats?.vendorsJoinedLast30Days} />
      <HowItWorksHome />
      <MarketplaceStats stats={marketplaceStats} />
      <VendorPitch />
      <FinalCta />
    </>
  );
}
