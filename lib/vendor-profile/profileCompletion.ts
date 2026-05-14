import type { PublicVendorDirectoryRow, VendorProfileRow } from "@/lib/vendor-profile/types";

/** Show marketplace quality reminder in vendor dashboard when below this percent. */
export const VENDOR_PROFILE_COMPLETION_WARNING_THRESHOLD = 70;

/** Homepage / category spotlight featured vendors must meet at least this completion. */
export const FEATURED_VENDOR_MIN_COMPLETION_PERCENT = 80;

const REQUIRED_COMPLETION_SEGMENTS = [
  "business_name",
  "bio",
  "service_areas",
  "logo_url",
  "cover_image_url",
  "slug",
] as const;

const OPTIONAL_COMPLETION_SEGMENTS = ["website", "instagram", "facebook", "tiktok"] as const;

const COMPLETION_SEGMENTS = [...REQUIRED_COMPLETION_SEGMENTS, ...OPTIONAL_COMPLETION_SEGMENTS] as const;

function trimmedLen(value: string | null | undefined): number {
  return (value ?? "").trim().length;
}

export type VendorProfileCompletionInput = {
  business_name: string | null | undefined;
  bio: string | null | undefined;
  logo_url: string | null | undefined;
  cover_image_url: string | null | undefined;
  slug: string | null | undefined;
  service_areas: string | null | undefined;
  website: string | null | undefined;
  instagram: string | null | undefined;
  facebook: string | null | undefined;
  tiktok: string | null | undefined;
};

export type VendorProfileCompletionCheckItem = {
  id: string;
  label: string;
  done: boolean;
};

export function vendorProfileRowToCompletionInput(
  profile: VendorProfileRow,
): VendorProfileCompletionInput {
  return {
    business_name: profile.business_name,
    bio: profile.bio,
    logo_url: profile.logo_url,
    cover_image_url: profile.cover_image_url,
    slug: profile.slug,
    service_areas: profile.service_areas,
    website: profile.website,
    instagram: profile.instagram,
    facebook: profile.facebook,
    tiktok: profile.tiktok,
  };
}

export function publicVendorDirectoryRowToCompletionInput(row: PublicVendorDirectoryRow): VendorProfileCompletionInput {
  return {
    business_name: row.business_name,
    bio: row.bio,
    logo_url: row.logo_url,
    cover_image_url: row.cover_image_url ?? null,
    slug: row.slug,
    service_areas: row.service_areas,
    website: row.website ?? null,
    instagram: row.instagram ?? null,
    facebook: row.facebook ?? null,
    tiktok: row.tiktok ?? null,
  };
}

export function completionFlags(input: VendorProfileCompletionInput): Record<(typeof COMPLETION_SEGMENTS)[number], boolean> {
  return {
    business_name: trimmedLen(input.business_name) > 1,
    bio: trimmedLen(input.bio) > 20,
    service_areas: trimmedLen(input.service_areas) > 2,
    logo_url: trimmedLen(input.logo_url) > 0,
    cover_image_url: trimmedLen(input.cover_image_url) > 0,
    slug: trimmedLen(input.slug) > 1,
    website: trimmedLen(input.website) > 0,
    instagram: trimmedLen(input.instagram) > 0,
    facebook: trimmedLen(input.facebook) > 0,
    tiktok: trimmedLen(input.tiktok) > 0,
  };
}

export function isVendorProfileCompletionRequiredComplete(input: VendorProfileCompletionInput): boolean {
  const flags = completionFlags(input);
  return REQUIRED_COMPLETION_SEGMENTS.every((field) => flags[field]);
}

export function computeVendorProfileCompletionPercent(input: VendorProfileCompletionInput): number {
  const flags = completionFlags(input);
  const done = COMPLETION_SEGMENTS.filter((field) => flags[field]).length;
  return Math.round((done / COMPLETION_SEGMENTS.length) * 100);
}

export function getVendorProfileCompletionChecklist(input: VendorProfileCompletionInput): VendorProfileCompletionCheckItem[] {
  const flags = completionFlags(input);
  const labels: Array<{ id: (typeof COMPLETION_SEGMENTS)[number]; label: string }> = [
    { id: "business_name", label: "Business name (required)" },
    { id: "bio", label: "Bio (required)" },
    { id: "service_areas", label: "Service areas (required)" },
    { id: "logo_url", label: "Logo image (required)" },
    { id: "cover_image_url", label: "Cover image (required)" },
    { id: "slug", label: "Public URL slug (required)" },
    { id: "website", label: "Website (optional)" },
    { id: "instagram", label: "Instagram (optional)" },
    { id: "facebook", label: "Facebook (optional)" },
    { id: "tiktok", label: "TikTok (optional)" },
  ];
  return labels.map((item) => ({ ...item, done: flags[item.id] ?? false }));
}

export function isVendorFeaturedEligibleByCompletion(input: VendorProfileCompletionInput): boolean {
  return computeVendorProfileCompletionPercent(input) >= FEATURED_VENDOR_MIN_COMPLETION_PERCENT;
}

function directoryRowHasLogo(row: PublicVendorDirectoryRow): boolean {
  return trimmedLen(row.logo_url) > 0;
}

export function compareDirectoryRowsByFeaturedRanking(a: PublicVendorDirectoryRow, b: PublicVendorDirectoryRow): number {
  const pa = computeVendorProfileCompletionPercent(publicVendorDirectoryRowToCompletionInput(a));
  const pb = computeVendorProfileCompletionPercent(publicVendorDirectoryRowToCompletionInput(b));
  if (pb !== pa) {
    return pb - pa;
  }
  const logoB = directoryRowHasLogo(b) ? 1 : 0;
  const logoA = directoryRowHasLogo(a) ? 1 : 0;
  if (logoB !== logoA) {
    return logoB - logoA;
  }
  return a.business_name.localeCompare(b.business_name);
}

/** Category hub “spotlight” strip: strongest completed profiles first. */
/** Curated `is_featured` rows first (any completion), then completion-eligible vendors. */
export function selectSpotlightDirectoryVendors(
  vendors: PublicVendorDirectoryRow[],
  limit: number,
): PublicVendorDirectoryRow[] {
  const cap = Math.max(0, limit);
  if (cap === 0) {
    return [];
  }
  const flagged = vendors.filter((row) => row.is_featured === true);
  const fallback = vendors.filter(
    (row) =>
      row.is_featured !== true &&
      isVendorFeaturedEligibleByCompletion(publicVendorDirectoryRowToCompletionInput(row)),
  );
  const ranked = [...[...flagged].sort(compareDirectoryRowsByFeaturedRanking), ...[...fallback].sort(compareDirectoryRowsByFeaturedRanking)];
  return ranked.slice(0, cap);
}
