import { absoluteUrl } from "@/lib/site";
import type { PublicVendorDirectoryRow } from "@/lib/vendor-profile/types";

export function breadcrumbListJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function vendorDirectoryItemListJsonLd(vendors: PublicVendorDirectoryRow[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: vendors.length,
    itemListElement: vendors.map((v, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: v.business_name,
        url: absoluteUrl(`/vendors/${v.slug}`),
      },
    })),
  };
}

export function localBusinessJsonLd(input: {
  name: string;
  description: string | null;
  urlPath: string;
  imageUrls: string[];
  aggregateRating?: { ratingValue: number; reviewCount: number } | null;
}): Record<string, unknown> {
  const url = absoluteUrl(input.urlPath);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    url,
    description: (input.description || "").trim() || undefined,
  };
  if (input.imageUrls.length) {
    node.image = input.imageUrls;
  }
  if (input.aggregateRating && input.aggregateRating.reviewCount > 0) {
    node.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.aggregateRating.ratingValue,
      reviewCount: input.aggregateRating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return node;
}
