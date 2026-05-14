/**
 * SEO neighborhood hubs under `/vendors/[category]/[borough]/[neighborhood]`.
 * `serviceAreaMatch` is passed to `public_vendor_directory` as `p_area` (ILIKE on `service_areas`).
 */

import { getBoroughPageBySlug } from "@/lib/marketplace/boroughPages";
import { getVendorCategoryPageBySlug } from "@/lib/marketplace/vendorCategoryPages";

export type NeighborhoodPageConfig = {
  slug: string;
  displayName: string;
  boroughSlug: string;
  /** Substring matched against `profiles.service_areas`. */
  serviceAreaMatch: string;
};

export const NEIGHBORHOOD_PAGES: NeighborhoodPageConfig[] = [
  { boroughSlug: "brooklyn", slug: "williamsburg", displayName: "Williamsburg", serviceAreaMatch: "Williamsburg" },
  { boroughSlug: "brooklyn", slug: "park-slope", displayName: "Park Slope", serviceAreaMatch: "Park Slope" },
  { boroughSlug: "brooklyn", slug: "bushwick", displayName: "Bushwick", serviceAreaMatch: "Bushwick" },
  { boroughSlug: "brooklyn", slug: "greenpoint", displayName: "Greenpoint", serviceAreaMatch: "Greenpoint" },
  { boroughSlug: "brooklyn", slug: "dumbo", displayName: "Dumbo", serviceAreaMatch: "Dumbo" },
  { boroughSlug: "brooklyn", slug: "fort-greene", displayName: "Fort Greene", serviceAreaMatch: "Fort Greene" },
  { boroughSlug: "brooklyn", slug: "bed-stuy", displayName: "Bed-Stuy", serviceAreaMatch: "Bed-Stuy" },
  { boroughSlug: "brooklyn", slug: "crown-heights", displayName: "Crown Heights", serviceAreaMatch: "Crown Heights" },
  { boroughSlug: "manhattan", slug: "soho", displayName: "SoHo", serviceAreaMatch: "SoHo" },
  { boroughSlug: "manhattan", slug: "tribeca", displayName: "Tribeca", serviceAreaMatch: "Tribeca" },
  { boroughSlug: "manhattan", slug: "upper-west-side", displayName: "Upper West Side", serviceAreaMatch: "Upper West Side" },
  { boroughSlug: "queens", slug: "astoria", displayName: "Astoria", serviceAreaMatch: "Astoria" },
  { boroughSlug: "queens", slug: "long-island-city", displayName: "Long Island City", serviceAreaMatch: "Long Island City" },
];

const neighborhoodKey = (boroughSlug: string, neighborhoodSlug: string) => `${boroughSlug}:${neighborhoodSlug}`;

const neighborhoodByRoute = new Map(
  NEIGHBORHOOD_PAGES.map((n) => [neighborhoodKey(n.boroughSlug, n.slug), n]),
);

export function getNeighborhoodPageByRoute(
  boroughSlug: string,
  neighborhoodSlug: string,
): NeighborhoodPageConfig | undefined {
  return neighborhoodByRoute.get(neighborhoodKey(boroughSlug, neighborhoodSlug));
}

export function neighborhoodsForBorough(boroughSlug: string): NeighborhoodPageConfig[] {
  return NEIGHBORHOOD_PAGES.filter((n) => n.boroughSlug === boroughSlug).sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  );
}

/** Deterministic peers for internal linking (same borough, excluding current). */
export function nearbyNeighborhoods(
  boroughSlug: string,
  currentSlug: string,
  limit: number,
): NeighborhoodPageConfig[] {
  return neighborhoodsForBorough(boroughSlug)
    .filter((n) => n.slug !== currentSlug)
    .slice(0, Math.max(0, limit));
}

export function isSupportedVendorNeighborhoodRoute(
  categorySlug: string,
  boroughSlug: string,
  neighborhoodSlug: string,
): boolean {
  return Boolean(
    getVendorCategoryPageBySlug(categorySlug) &&
      getBoroughPageBySlug(boroughSlug) &&
      getNeighborhoodPageByRoute(boroughSlug, neighborhoodSlug),
  );
}
