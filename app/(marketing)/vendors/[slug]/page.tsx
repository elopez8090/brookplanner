import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicVendorProfileView } from "@/components/marketplace/PublicVendorProfileView";
import { VendorCategoryHub } from "@/components/marketplace/VendorCategoryHub";
import { parseVendorDirectorySort } from "@/lib/filters/phase30Search";
import { getVendorCategoryPageBySlug, VENDOR_CATEGORY_PAGES } from "@/lib/marketplace/vendorCategoryPages";
import { breadcrumbListJsonLd, localBusinessJsonLd } from "@/lib/seo/vendorListingSchema";
import { absoluteUrl } from "@/lib/site";
import { averageRating, fetchPublicReviewsForVendor } from "@/lib/reviews/queries";
import { fetchPublicVendorBySlug } from "@/lib/vendor-profile/queries";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; area?: string; sort?: string }>;
};

export function generateStaticParams() {
  return VENDOR_CATEGORY_PAGES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getVendorCategoryPageBySlug(slug);
  if (category) {
    const path = `/vendors/${category.slug}`;
    return {
      title: category.metaTitle,
      description: category.metaDescription,
      alternates: { canonical: absoluteUrl(path) },
      openGraph: {
        title: category.metaTitle,
        description: category.metaDescription,
        url: absoluteUrl(path),
        type: "website",
      },
    };
  }

  const vendor = await fetchPublicVendorBySlug(slug);
  if (!vendor) {
    return { title: "Vendor not found" };
  }

  const businessName = vendor.business_name || vendor.full_name || "Vendor";
  const primaryCategory = vendor.categories[0] || "Event vendor";
  const serviceAreaText = vendor.service_areas?.split(",")[0]?.trim() || "Brooklyn";
  const title = `${businessName} — ${primaryCategory} in ${serviceAreaText}`;
  const description =
    vendor.bio?.trim() ||
    `${businessName} on Brook Planner. Compare public profiles and request quotes from trusted Brooklyn event vendors.`;
  const path = `/vendors/${vendor.slug}`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      type: "profile",
      ...(vendor.cover_image_url || vendor.logo_url
        ? { images: [{ url: (vendor.cover_image_url || vendor.logo_url) as string }] }
        : {}),
    },
  };
}

export default async function VendorsCategoryOrProfilePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = getVendorCategoryPageBySlug(slug);
  if (category) {
    const sp = await searchParams;
    const sort = parseVendorDirectorySort(sp.sort);
    return <VendorCategoryHub config={category} query={sp.q ?? ""} area={sp.area ?? ""} sort={sort} />;
  }

  const vendor = await fetchPublicVendorBySlug(slug);
  if (!vendor) {
    notFound();
  }

  const reviewItems = await fetchPublicReviewsForVendor(vendor.id);
  const avg = averageRating(reviewItems);
  const path = `/vendors/${vendor.slug}`;
  const images: string[] = [vendor.cover_image_url, vendor.logo_url].filter(Boolean) as string[];

  return (
    <>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Vendors", path: "/vendors" },
          { name: vendor.business_name || vendor.full_name || "Vendor", path },
        ])}
      />
      <JsonLd
        data={localBusinessJsonLd({
          name: vendor.business_name || vendor.full_name || "Vendor",
          description: vendor.bio,
          urlPath: path,
          imageUrls: images,
          aggregateRating:
            reviewItems.length && avg !== null
              ? { ratingValue: Math.round(avg * 10) / 10, reviewCount: reviewItems.length }
              : null,
        })}
      />
      <PublicVendorProfileView
        vendor={vendor}
        reviews={{
          items: reviewItems,
          total: reviewItems.length,
          average: avg,
        }}
      />
    </>
  );
}
