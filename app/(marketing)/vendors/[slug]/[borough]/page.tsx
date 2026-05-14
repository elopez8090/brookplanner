import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  VendorCategoryBoroughHub,
  buildBoroughCategoryMetaDescription,
} from "@/components/marketplace/VendorCategoryBoroughHub";
import { parseVendorDirectorySort } from "@/lib/filters/phase30Search";
import { BOROUGH_PAGES, getBoroughPageBySlug, isSupportedVendorBoroughRoute } from "@/lib/marketplace/boroughPages";
import { getVendorCategoryPageBySlug, VENDOR_CATEGORY_PAGES, vendorCategoryBoroughPath } from "@/lib/marketplace/vendorCategoryPages";
import { absoluteUrl } from "@/lib/site";

type PageProps = {
  params: Promise<{ slug: string; borough: string }>;
  searchParams: Promise<{ q?: string; sort?: string }>;
};

export function generateStaticParams() {
  const out: { slug: string; borough: string }[] = [];
  for (const c of VENDOR_CATEGORY_PAGES) {
    for (const b of BOROUGH_PAGES) {
      out.push({ slug: c.slug, borough: b.slug });
    }
  }
  return out;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, borough } = await params;
  if (!isSupportedVendorBoroughRoute(slug, borough)) {
    return { title: "Vendors | Brook Planner" };
  }
  const cat = getVendorCategoryPageBySlug(slug)!;
  const bor = getBoroughPageBySlug(borough)!;
  const title = `${bor.displayName} ${cat.directoryCategoryName}`;
  const description = buildBoroughCategoryMetaDescription(cat, bor);
  const path = vendorCategoryBoroughPath(slug, borough);
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

export default async function VendorCategoryBoroughPage({ params, searchParams }: PageProps) {
  const { slug, borough } = await params;
  if (!isSupportedVendorBoroughRoute(slug, borough)) {
    notFound();
  }
  const cat = getVendorCategoryPageBySlug(slug)!;
  const bor = getBoroughPageBySlug(borough)!;
  const sp = await searchParams;
  const sort = parseVendorDirectorySort(sp.sort);
  return <VendorCategoryBoroughHub category={cat} borough={bor} query={sp.q ?? ""} sort={sort} />;
}
