export type VendorProfileRow = {
  id: string;
  role: "customer" | "vendor" | "admin";
  full_name: string;
  business_name: string | null;
  slug: string | null;
  bio: string | null;
  business_phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  service_areas: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  is_profile_complete: boolean;
  is_public?: boolean;
  is_featured?: boolean;
  admin_notes?: string | null;
};

export type PublicVendorProfile = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  slug: string;
  bio: string | null;
  business_phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  service_areas: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  categories: string[];
  /** From `public_vendor_page` (Phase 31). */
  is_profile_complete?: boolean;
  is_featured?: boolean;
  quote_activity_count?: number;
  public_review_count?: number;
  public_avg_rating?: number | null;
};

export type PublicVendorDirectoryRow = {
  id: string;
  business_name: string;
  slug: string;
  bio: string | null;
  service_areas: string | null;
  logo_url: string | null;
  categories: string[];
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  cover_image_url: string | null;
  /** Present when `public_vendor_directory` includes profile row timestamps (Phase 17+). */
  created_at?: string | null;
  /** Admin-curated; homepage spotlight lists `true` rows before completion-based fallback (Phase 19+). */
  is_featured?: boolean;
  /** Public reviews (Phase 31+ directory RPC). */
  review_count?: number;
  avg_rating?: number | null;
  quotes_submitted_count?: number;
};
