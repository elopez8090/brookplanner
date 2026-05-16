import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  VendorCategoryNeighborhoodHub,
  buildNeighborhoodMetaDescription,
} from "@/components/marketplace/VendorCategoryNeighborhoodHub";
import { parseVendorDirectorySort } from "@/lib/filters/phase30Search";
import { getBoroughPageBySlug } from "@/lib/marketplace/boroughPages";
import {
  NEIGHBORHOOD_PAGES,
  getNeighborhoodPageByRoute,
  isSupportedVendorNeighborhoodRoute,
} from "@/lib/marketplace/neighborhoodPages";
import { getVendorCategoryPageBySlug, VENDOR_CATEGORY_PAGES, vendorCategoryNeighborhoodPath } from "@/lib/marketplace/vendorCategoryPages";
import { absoluteUrl } from "@/lib/site";
import { PublicVendorDiscoveryPausedPanel } from "@/components/marketplace/PublicVendorDiscoveryPausedPanel";
import { isPublicVendorDiscoveryEnabled } from "@/lib/marketplace/publicVendorDiscovery";

type PageProps = {
  params: Promise<{ slug: string; borough: string; neighborhood: string }>;
  searchParams: Promise<{ q?: string; sort?: string }>;
};

export function generateStaticParams() {
  const out: { slug: string; borough: string; neighborhood: string }[] = [];
  for (const c of VENDOR_CATEGORY_PAGES) {
    for (const n of NEIGHBORHOOD_PAGES) {
      out.push({ slug: c.slug, borough: n.boroughSlug, neighborhood: n.slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, borough, neighborhood } = await params;
  if (!isSupportedVendorNeighborhoodRoute(slug, borough, neighborhood)) {
    return { title: "Vendors | Brook Planner" };
  }
  const cat = getVendorCategoryPageBySlug(slug)!;
  const bor = getBoroughPageBySlug(borough)!;
  const hood = getNeighborhoodPageByRoute(borough, neighborhood)!;
  const title = `${cat.directoryCategoryName} in ${hood.displayName}, ${bor.displayName}`;
  const description = buildNeighborhoodMetaDescription(cat, bor, hood);
  const path = vendorCategoryNeighborhoodPath(slug, borough, neighborhood);
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      type: "website",
    },
  };
}

export default async function VendorCategoryNeighborhoodPage({ params, searchParams }: PageProps) {
  const { slug, borough, neighborhood } = await params;
  if (!isSupportedVendorNeighborhoodRoute(slug, borough, neighborhood)) {
    notFound();
  }
  const cat = getVendorCategoryPageBySlug(slug)!;
  const bor = getBoroughPageBySlug(borough)!;
  const hood = getNeighborhoodPageByRoute(borough, neighborhood)!;
  if (!isPublicVendorDiscoveryEnabled()) {
    return (
      <PublicVendorDiscoveryPausedPanel
        title={`${cat.directoryCategoryName} in ${hood.displayName} — post your event for quotes`}
      />
    );
  }
  const sp = await searchParams;
  const sort = parseVendorDirectorySort(sp.sort);
  return <VendorCategoryNeighborhoodHub category={cat} borough={bor} neighborhood={hood} query={sp.q ?? ""} sort={sort} />;
}
