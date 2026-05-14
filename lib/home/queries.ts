import { HOME_MARKETPLACE_CATEGORY_CARDS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { VENDOR_CATEGORY_PAGES } from "@/lib/marketplace/vendorCategoryPages";
import { fetchPublicVendorDirectory } from "@/lib/vendor-profile/queries";
import {
  compareDirectoryRowsByFeaturedRanking,
  isVendorFeaturedEligibleByCompletion,
  publicVendorDirectoryRowToCompletionInput,
} from "@/lib/vendor-profile/profileCompletion";
import type { PublicVendorDirectoryRow } from "@/lib/vendor-profile/types";

export type MarketplaceStats = {
  vendorCount: number;
  eventsPosted: number;
  quotesSubmitted: number;
  boroughsWithVendorCoverage: number;
  publicReviewsCount: number;
  vendorProfilesComplete: number;
  vendorsJoinedLast30Days: number;
};

type StatsRpcRow = {
  vendor_count: number | string | null;
  events_posted: number | string | null;
  quotes_submitted: number | string | null;
  boroughs_with_vendor_coverage: number | string | null;
  public_reviews_count?: number | string | null;
  vendor_profiles_complete?: number | string | null;
  vendors_joined_last_30_days?: number | string | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchMarketplaceStats(): Promise<MarketplaceStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_marketplace_stats");

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      console.error("fetchMarketplaceStats", error.message);
    }
    return null;
  }

  const row = data[0] as StatsRpcRow;
  return {
    vendorCount: toNumber(row.vendor_count),
    eventsPosted: toNumber(row.events_posted),
    quotesSubmitted: toNumber(row.quotes_submitted),
    boroughsWithVendorCoverage: toNumber(row.boroughs_with_vendor_coverage),
    publicReviewsCount: toNumber(row.public_reviews_count),
    vendorProfilesComplete: toNumber(row.vendor_profiles_complete),
    vendorsJoinedLast30Days: toNumber(row.vendors_joined_last_30_days),
  };
}

export type HomeCategoryCardWithCount = (typeof HOME_MARKETPLACE_CATEGORY_CARDS)[number] & {
  vendorCount: number;
};

export function selectFeaturedFromDirectoryVendors(
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

/** Counts match category hubs: each row's `categories` are quote-derived in `public_vendor_directory`. */
export function buildHomeCategoryCardsWithCounts(vendors: PublicVendorDirectoryRow[]): HomeCategoryCardWithCount[] {
  const slugToDirName = new Map(VENDOR_CATEGORY_PAGES.map((c) => [c.slug, c.directoryCategoryName]));
  return HOME_MARKETPLACE_CATEGORY_CARDS.map((card) => {
    const dirName = slugToDirName.get(card.slug);
    const vendorCount =
      dirName !== undefined
        ? vendors.filter((v) =>
            v.categories.some((c) => c.trim().toLowerCase() === dirName.trim().toLowerCase()),
          ).length
        : 0;
    return { ...card, vendorCount };
  });
}

function directorySortCreatedDesc(a: PublicVendorDirectoryRow, b: PublicVendorDirectoryRow): number {
  const ta = Date.parse(a.created_at ?? "");
  const tb = Date.parse(b.created_at ?? "");
  const sa = Number.isFinite(ta) ? ta : 0;
  const sb = Number.isFinite(tb) ? tb : 0;
  if (sb !== sa) {
    return sb - sa;
  }
  return a.business_name.localeCompare(b.business_name);
}

/** Recently joined marketplace vendors (directory members), ordered by profile `created_at` when available. */
export function selectNewDirectoryVendors(vendors: PublicVendorDirectoryRow[], limit: number): PublicVendorDirectoryRow[] {
  const cap = Math.max(0, Math.min(6, limit));
  if (cap === 0) {
    return [];
  }
  return [...vendors].sort(directorySortCreatedDesc).slice(0, cap);
}

export async function fetchFeaturedDirectoryVendors(limit: number): Promise<PublicVendorDirectoryRow[]> {
  const vendors = await fetchPublicVendorDirectory();
  return selectFeaturedFromDirectoryVendors(vendors, limit);
}

/** Single directory fetch for homepage vendor sections + category counts. */
export async function fetchHomepageMarketplaceDirectory(): Promise<{
  featuredVendors: PublicVendorDirectoryRow[];
  newVendors: PublicVendorDirectoryRow[];
  categoryCards: HomeCategoryCardWithCount[];
}> {
  const directory = await fetchPublicVendorDirectory();
  return {
    featuredVendors: selectFeaturedFromDirectoryVendors(directory, 6),
    newVendors: selectNewDirectoryVendors(directory, 6),
    categoryCards: buildHomeCategoryCardsWithCounts(directory),
  };
}
