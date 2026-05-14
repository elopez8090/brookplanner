import type { EventQuoteCardVendor } from "@/components/events/EventQuoteCard";
import type { QuoteVendorCardProfile } from "@/lib/events/queries";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function eventQuoteVendorFromProfileRpc(row: QuoteVendorCardProfile): EventQuoteCardVendor {
  const displayName = row.business_name?.trim() || row.full_name?.trim() || "Vendor";
  const count = Math.max(0, Math.floor(num(row.public_review_count)));
  const avgRaw = row.public_avg_rating;
  const avg = avgRaw === null || avgRaw === undefined ? null : num(avgRaw);
  return {
    vendor_id: row.vendor_id,
    displayName,
    service_areas: row.service_areas,
    logo_url: row.logo_url,
    slug: row.slug,
    publicReviewCount: count > 0 ? count : null,
    publicAvgRating: count > 0 && avg !== null ? avg : null,
  };
}
