import { vendorCategoryBoroughPath, vendorCategoryNeighborhoodPath } from "@/lib/marketplace/vendorCategoryPages";

/** Curated internal links for crawl depth and topical authority (all public routes). */
export const POPULAR_VENDOR_SEARCH_LINKS: { label: string; href: string }[] = [
  { label: "Brooklyn DJs", href: vendorCategoryBoroughPath("djs", "brooklyn") },
  { label: "Brooklyn wedding photographers", href: vendorCategoryBoroughPath("photographers", "brooklyn") },
  { label: "Brooklyn caterers", href: vendorCategoryBoroughPath("caterers", "brooklyn") },
  { label: "Party rentals in Williamsburg", href: vendorCategoryNeighborhoodPath("party-rentals", "brooklyn", "williamsburg") },
  { label: "Event planners in Park Slope", href: vendorCategoryNeighborhoodPath("event-planners", "brooklyn", "park-slope") },
  { label: "Brooklyn venues", href: vendorCategoryBoroughPath("venues", "brooklyn") },
  { label: "DJs in Williamsburg", href: vendorCategoryNeighborhoodPath("djs", "brooklyn", "williamsburg") },
  { label: "Photographers in Bushwick", href: vendorCategoryNeighborhoodPath("photographers", "brooklyn", "bushwick") },
];
