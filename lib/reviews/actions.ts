"use server";

import { revalidatePath } from "next/cache";
import { isAccountRestrictedStatus } from "@/lib/auth/accountStatus";
import { fetchProfileByUserId } from "@/lib/auth/ensureProfile";
import { notifyVendorNewReviewEmail } from "@/lib/email/notifyMarketplace";
import { createClient } from "@/lib/supabase/server";

export type CustomerReviewFormState = {
  error: string | null;
  success: string | null;
};

function parseRating(raw: FormDataEntryValue | null): number | null {
  const n = Number(String(raw ?? "").trim());
  if (!Number.isFinite(n)) {
    return null;
  }
  const r = Math.round(n);
  if (r < 1 || r > 5) {
    return null;
  }
  return r;
}

export async function submitCustomerReview(
  prevState: CustomerReviewFormState,
  formData: FormData,
): Promise<CustomerReviewFormState> {
  void prevState;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "customer") {
    return { error: "Only customers can submit reviews.", success: null };
  }
  if (isAccountRestrictedStatus(profile.status)) {
    return { error: "Your account cannot submit reviews right now.", success: null };
  }

  const quoteId = String(formData.get("quote_id") ?? "").trim();
  const eventId = String(formData.get("event_id") ?? "").trim();
  const vendorId = String(formData.get("vendor_id") ?? "").trim();
  const vendorSlug = String(formData.get("vendor_slug") ?? "").trim();
  const rating = parseRating(formData.get("rating"));
  const reviewText = String(formData.get("review_text") ?? "").trim();

  if (!quoteId || !eventId || !vendorId) {
    return { error: "Missing quote information.", success: null };
  }
  if (rating === null) {
    return { error: "Choose a rating from 1 to 5.", success: null };
  }

  const { error } = await supabase.from("reviews").insert({
    quote_id: quoteId,
    event_id: eventId,
    vendor_id: vendorId,
    customer_id: user.id,
    rating,
    review_text: reviewText,
    is_public: true,
  });

  if (error) {
    return { error: error.message, success: null };
  }

  void notifyVendorNewReviewEmail({ vendorUserId: vendorId, rating });

  revalidatePath(`/customer/events/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  if (vendorSlug) {
    revalidatePath(`/vendors/${vendorSlug}`);
  }
  revalidatePath("/vendor/dashboard");

  return { error: null, success: "Thanks — your review was posted." };
}
