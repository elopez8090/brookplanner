import type { VendorDirectorySort } from "@/lib/filters/phase30Search";
import { createClient } from "@/lib/supabase/server";
import type { PublicVendorDirectoryRow, PublicVendorProfile, VendorProfileRow } from "@/lib/vendor-profile/types";

const VENDOR_PROFILE_SELECT = `
  id,
  role,
  full_name,
  business_name,
  slug,
  bio,
  business_phone,
  website,
  instagram,
  facebook,
  tiktok,
  service_areas,
  logo_url,
  cover_image_url,
  is_profile_complete,
  is_public,
  is_featured,
  admin_notes
`;

export async function fetchVendorProfileByUserId(userId: string): Promise<VendorProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(VENDOR_PROFILE_SELECT)
    .eq("id", userId)
    .eq("role", "vendor")
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("fetchVendorProfileByUserId", error.message);
    }
    return null;
  }

  return data as VendorProfileRow;
}

function toNonNegativeInt(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function toOptionalRating(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchPublicVendorBySlug(slug: string): Promise<PublicVendorProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_vendor_page", { p_slug: slug });

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      console.error("fetchPublicVendorBySlug", error.message);
    }
    return null;
  }

  const row = data[0] as PublicVendorProfile & Record<string, unknown>;
  return {
    ...row,
    categories: Array.isArray(row.categories) ? row.categories.filter((item) => typeof item === "string") : [],
    is_profile_complete: Boolean(row.is_profile_complete),
    is_featured: Boolean(row.is_featured),
    quote_activity_count: toNonNegativeInt(row.quote_activity_count),
    public_review_count: toNonNegativeInt(row.public_review_count),
    public_avg_rating: toOptionalRating(row.public_avg_rating),
  };
}

type PublicVendorDirectoryFilters = {
  query?: string;
  category?: string;
  area?: string;
  sort?: VendorDirectorySort;
};

export async function fetchPublicVendorDirectory(
  filters: PublicVendorDirectoryFilters = {},
): Promise<PublicVendorDirectoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_vendor_directory", {
    p_query: filters.query?.trim() || null,
    p_category: filters.category?.trim() || null,
    p_area: filters.area?.trim() || null,
    p_sort: filters.sort ?? "name",
  });

  if (error || !Array.isArray(data)) {
    if (error) {
      console.error("fetchPublicVendorDirectory", error.message);
    }
    return [];
  }

  return data
    .map((row) => row as PublicVendorDirectoryRow & Record<string, unknown>)
    .filter((row) => Boolean(row.slug) && Boolean(row.business_name))
    .map((row) => ({
      ...row,
      categories: Array.isArray(row.categories) ? row.categories.filter((item) => typeof item === "string") : [],
      website: row.website ?? null,
      instagram: row.instagram ?? null,
      facebook: row.facebook ?? null,
      tiktok: row.tiktok ?? null,
      cover_image_url: row.cover_image_url ?? null,
      created_at: (row as { created_at?: string | null }).created_at ?? null,
      is_featured: Boolean((row as { is_featured?: boolean }).is_featured),
      review_count: toNonNegativeInt(row.review_count),
      avg_rating: toOptionalRating(row.avg_rating),
      quotes_submitted_count: toNonNegativeInt(row.quotes_submitted_count),
    }));
}

/** Distinct marketplace category names derived from this vendor's quotes (matches public profile). */
export async function fetchVendorQuoteCategoryNames(vendorId: string): Promise<string[]> {
  const supabase = await createClient();
  void vendorId;
  const { data, error } = await supabase.rpc("vendor_list_quote_category_names");

  if (error || !data) {
    if (error) {
      console.error("fetchVendorQuoteCategoryNames", error.message);
    }
    return [];
  }

  const names = new Set<string>();
  for (const row of data as Array<{ name: string | null }>) {
    const name = row.name?.trim();
    if (name) {
      names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
