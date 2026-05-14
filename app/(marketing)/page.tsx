import { HomePage } from "@/components/home/HomePage";
import { fetchHomepageMarketplaceDirectory, fetchMarketplaceStats } from "@/lib/home/queries";

export default async function Page() {
  const [marketplaceStats, homeMarketplace] = await Promise.all([
    fetchMarketplaceStats(),
    fetchHomepageMarketplaceDirectory(),
  ]);

  return (
    <HomePage
      featuredVendors={homeMarketplace.featuredVendors}
      newVendors={homeMarketplace.newVendors}
      categoryCards={homeMarketplace.categoryCards}
      marketplaceStats={marketplaceStats}
    />
  );
}
