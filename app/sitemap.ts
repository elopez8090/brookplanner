import type { MetadataRoute } from "next";
import { BOROUGH_PAGES } from "@/lib/marketplace/boroughPages";
import { NEIGHBORHOOD_PAGES } from "@/lib/marketplace/neighborhoodPages";
import {
  getVendorCategoryPageBySlug,
  VENDOR_CATEGORY_PAGES,
  vendorCategoryBoroughPath,
  vendorCategoryHubPath,
  vendorCategoryNeighborhoodPath,
} from "@/lib/marketplace/vendorCategoryPages";
import { getSiteUrl } from "@/lib/site";
import { fetchPublicVendorDirectory } from "@/lib/vendor-profile/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const stamp = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/vendors`, lastModified: stamp, changeFrequency: "weekly", priority: 0.9 },
  ];

  for (const c of VENDOR_CATEGORY_PAGES) {
    entries.push({
      url: `${base}${vendorCategoryHubPath(c.slug)}`,
      lastModified: stamp,
      changeFrequency: "weekly",
      priority: 0.85,
    });
    for (const b of BOROUGH_PAGES) {
      entries.push({
        url: `${base}${vendorCategoryBoroughPath(c.slug, b.slug)}`,
        lastModified: stamp,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const n of NEIGHBORHOOD_PAGES) {
      entries.push({
        url: `${base}${vendorCategoryNeighborhoodPath(c.slug, n.boroughSlug, n.slug)}`,
        lastModified: stamp,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  }

  const vendors = await fetchPublicVendorDirectory();
  for (const v of vendors) {
    if (!v.slug) {
      continue;
    }
    if (getVendorCategoryPageBySlug(v.slug)) {
      continue;
    }
    entries.push({
      url: `${base}/vendors/${v.slug}`,
      lastModified: stamp,
      changeFrequency: "monthly",
      priority: 0.65,
    });
  }

  return entries;
}
