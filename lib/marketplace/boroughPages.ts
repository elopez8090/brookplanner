/**
 * SEO borough hubs under `/vendors/[category]/[borough]`.
 * `serviceAreaMatch` is passed to `public_vendor_directory` as `p_area` (ILIKE on `service_areas`).
 */

import { getVendorCategoryPageBySlug } from "@/lib/marketplace/vendorCategoryPages";

export type BoroughPageConfig = {
  slug: string;
  displayName: string;
  /** Substring matched against `profiles.service_areas` (comma-separated text). */
  serviceAreaMatch: string;
};

export const BOROUGH_PAGES: BoroughPageConfig[] = [
  { slug: "brooklyn", displayName: "Brooklyn", serviceAreaMatch: "Brooklyn" },
  { slug: "manhattan", displayName: "Manhattan", serviceAreaMatch: "Manhattan" },
  { slug: "queens", displayName: "Queens", serviceAreaMatch: "Queens" },
  { slug: "bronx", displayName: "Bronx", serviceAreaMatch: "Bronx" },
  { slug: "staten-island", displayName: "Staten Island", serviceAreaMatch: "Staten Island" },
];

const boroughBySlug = new Map(BOROUGH_PAGES.map((b) => [b.slug, b]));

export function getBoroughPageBySlug(slug: string): BoroughPageConfig | undefined {
  return boroughBySlug.get(slug);
}

export function isSupportedVendorBoroughRoute(categorySlug: string, boroughSlug: string): boolean {
  return Boolean(getVendorCategoryPageBySlug(categorySlug) && getBoroughPageBySlug(boroughSlug));
}
