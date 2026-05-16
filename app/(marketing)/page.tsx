import { HomePage } from "@/components/home/HomePage";
import { fetchHomepageMarketplaceDirectory, fetchMarketplaceStats } from "@/lib/home/queries";
import { isPublicVendorDiscoveryEnabled } from "@/lib/marketplace/publicVendorDiscovery";

export default async function Page() {
  const discoveryEnabled = isPublicVendorDiscoveryEnabled();
  const marketplaceStats = await fetchMarketplaceStats();
  const homeMarketplace = discoveryEnabled
    ? await fetchHomepageMarketplaceDirectory()
    : { featuredVendors: [], newVendors: [], categoryCards: [] };

  return (
    <HomePage
      featuredVendors={homeMarketplace.featuredVendors}
      newVendors={homeMarketplace.newVendors}
      categoryCards={homeMarketplace.categoryCards}
      marketplaceStats={marketplaceStats}
    />
  );
}
