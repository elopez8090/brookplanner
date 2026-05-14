import { createClient } from "@/lib/supabase/server";
import type { PublicVendorReview, ReviewRow, VendorDashboardReview } from "@/lib/reviews/types";

export async function fetchCustomerReviewsByQuoteIds(
  customerId: string,
  quoteIds: string[],
): Promise<Map<string, ReviewRow>> {
  const map = new Map<string, ReviewRow>();
  if (quoteIds.length === 0) {
    return map;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, vendor_id, customer_id, event_id, quote_id, rating, review_text, is_public, created_at")
    .eq("customer_id", customerId)
    .in("quote_id", quoteIds);

  if (error || !data) {
    if (error) {
      console.error("fetchCustomerReviewsByQuoteIds", error.message);
    }
    return map;
  }

  for (const row of data as ReviewRow[]) {
    map.set(row.quote_id, row);
  }
  return map;
}

export async function fetchPublicReviewsForVendor(vendorId: string): Promise<PublicVendorReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, review_text, created_at")
    .eq("vendor_id", vendorId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    if (error) {
      console.error("fetchPublicReviewsForVendor", error.message);
    }
    return [];
  }

  return data as PublicVendorReview[];
}

export function averageRating(reviews: Array<{ rating: number }>): number | null {
  if (!reviews.length) {
    return null;
  }
  const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
  return sum / reviews.length;
}

export async function fetchVendorReviewAggregate(vendorId: string): Promise<{ average: number | null; total: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("reviews").select("rating").eq("vendor_id", vendorId);

  if (error || !data) {
    if (error) {
      console.error("fetchVendorReviewAggregate", error.message);
    }
    return { average: null, total: 0 };
  }

  const ratings = (data as Array<{ rating: number }>).map((r) => Number(r.rating));
  return {
    total: ratings.length,
    average: averageRating(ratings.map((rating) => ({ rating }))),
  };
}

export async function fetchVendorDashboardReviews(vendorId: string, limit = 12): Promise<VendorDashboardReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, review_text, is_public, created_at, event_id")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) {
      console.error("fetchVendorDashboardReviews", error.message);
    }
    return [];
  }

  const rows = data as Pick<VendorDashboardReview, "id" | "rating" | "review_text" | "is_public" | "created_at" | "event_id">[];
  const eventIds = [...new Set(rows.map((r) => r.event_id).filter(Boolean))];
  const titlesByEventId = new Map<string, string>();

  if (eventIds.length > 0) {
    const { data: eventRows, error: evErr } = await supabase.from("events").select("id, title").in("id", eventIds);

    if (!evErr && eventRows) {
      for (const ev of eventRows as Array<{ id: string; title: string }>) {
        titlesByEventId.set(ev.id, ev.title?.trim() ? ev.title : "");
      }
    } else if (evErr) {
      console.error("fetchVendorDashboardReviews.events", evErr.message);
    }
  }

  return rows.map((row) => ({
    ...row,
    event_title: titlesByEventId.get(row.event_id)?.trim() ? titlesByEventId.get(row.event_id)! : null,
  }));
}
