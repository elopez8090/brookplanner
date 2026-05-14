/**
 * SEO category hubs live at `/vendors/[category]` with borough and neighborhood sub-routes.
 * `directoryCategoryName` must match `public.categories.name` for RPC filtering.
 * Public vendor profiles share `/vendors/[slug]` when `slug` is not a reserved category slug.
 */

/** Reserved first-segment slugs for marketplace SEO hubs (vendor slugs should avoid collisions). */
export const VENDOR_CATEGORY_HUBS_BASE = "/vendors";

export function vendorCategoryHubPath(categorySlug: string): string {
  return `${VENDOR_CATEGORY_HUBS_BASE}/${categorySlug}`;
}

export function vendorCategoryBoroughPath(categorySlug: string, boroughSlug: string): string {
  return `${VENDOR_CATEGORY_HUBS_BASE}/${categorySlug}/${boroughSlug}`;
}

export function vendorCategoryNeighborhoodPath(
  categorySlug: string,
  boroughSlug: string,
  neighborhoodSlug: string,
): string {
  return `${VENDOR_CATEGORY_HUBS_BASE}/${categorySlug}/${boroughSlug}/${neighborhoodSlug}`;
}

export type VendorCategoryPageConfig = {
  slug: string;
  directoryCategoryName: string;
  heroTitle: string;
  heroSubhead: string;
  metaTitle: string;
  metaDescription: string;
};

export const VENDOR_CATEGORY_PAGES: VendorCategoryPageConfig[] = [
  {
    slug: "djs",
    directoryCategoryName: "DJs",
    heroTitle: "Find Brooklyn DJs for Weddings, Parties & Events",
    heroSubhead:
      "Compare local DJs who list Brooklyn and NYC on Brook Planner — clear bios, service areas, and public reviews before you request quotes.",
    metaTitle: "Find Brooklyn DJs for Weddings, Parties & Events",
    metaDescription:
      "Discover Brooklyn DJs for weddings, parties, and corporate events on Brook Planner. Browse public profiles, then post your event to receive structured quotes.",
  },
  {
    slug: "photographers",
    directoryCategoryName: "Photographers",
    heroTitle: "Find Brooklyn Wedding & Event Photographers",
    heroSubhead:
      "From documentary wedding coverage to brand launches — explore photographers with marketplace-ready profiles across Brooklyn and NYC.",
    metaTitle: "Brooklyn Wedding Photographers & Event Photographers",
    metaDescription:
      "Find Brooklyn wedding photographers and event photographers on Brook Planner. Compare service areas and portfolios, then invite quotes for your date.",
  },
  {
    slug: "caterers",
    directoryCategoryName: "Caterers",
    heroTitle: "Find Brooklyn Caterers for Events & Receptions",
    heroSubhead:
      "Browse caterers for plated dinners, cocktail receptions, and corporate menus — matched to your headcount and neighborhood.",
    metaTitle: "Brooklyn Caterers for Parties & Weddings",
    metaDescription:
      "Browse Brooklyn caterers on Brook Planner with public bios and service areas. Post your event to compare structured quotes from trusted vendors.",
  },
  {
    slug: "venues",
    directoryCategoryName: "Venues",
    heroTitle: "Find Brooklyn & NYC Event Venues",
    heroSubhead:
      "Explore venues for receptions, corporate gatherings, and private celebrations — compare profiles and connect when you are ready to tour.",
    metaTitle: "Brooklyn & NYC Event Venues",
    metaDescription:
      "Discover Brooklyn and NYC venues on Brook Planner. Filter by service area, compare profiles, and request quotes when you are ready to book.",
  },
  {
    slug: "party-rentals",
    directoryCategoryName: "Party Rentals",
    heroTitle: "Party Rentals in Brooklyn & NYC",
    heroSubhead:
      "Tables, tents, linens, lighting, and staging from vendors who understand NYC logistics — compare options side by side.",
    metaTitle: "Brooklyn Party Rentals — Tables, Tents & More",
    metaDescription:
      "Find party rentals in Brooklyn and NYC on Brook Planner. Browse vendor profiles and service areas, then post your event to compare quotes.",
  },
  {
    slug: "event-planners",
    directoryCategoryName: "Event Planners",
    heroTitle: "Event Planners in Brooklyn & NYC",
    heroSubhead:
      "Full-service and day-of planners for weddings, corporate programs, and private milestones — find specialists who match your timeline.",
    metaTitle: "Brooklyn Event Planners — Weddings & Corporate",
    metaDescription:
      "Find event planners in Brooklyn and NYC on Brook Planner. Compare bios and neighborhoods, then invite quotes for your wedding or corporate program.",
  },
];

const bySlug = new Map(VENDOR_CATEGORY_PAGES.map((c) => [c.slug, c]));

export function getVendorCategoryPageBySlug(slug: string): VendorCategoryPageConfig | undefined {
  return bySlug.get(slug);
}

export function getCategorySlugForDirectoryName(name: string): string | undefined {
  const trimmed = name.trim().toLowerCase();
  return VENDOR_CATEGORY_PAGES.find((c) => c.directoryCategoryName.toLowerCase() === trimmed)?.slug;
}
