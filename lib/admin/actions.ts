"use server";

import { revalidatePath } from "next/cache";
import { fetchProfileByUserId } from "@/lib/auth/ensureProfile";
import { serverWarn } from "@/lib/logging/serverLog";
import { createClient } from "@/lib/supabase/server";
import {
  adminCreditAdjustmentInitialState,
  adminCustomerNotesInitialState,
  adminProfileStatusInitialState,
  adminReviewVisibilityInitialState,
  adminVendorCreditsInitialState,
  adminVendorFlagsInitialState,
  type AdminCreditAdjustmentFormState,
  type AdminCustomerNotesFormState,
  type AdminProfileStatusFormState,
  type AdminReviewVisibilityFormState,
  type AdminVendorCreditsFormState,
  type AdminVendorFlagsFormState,
} from "@/lib/admin/form-state";

function parseBool(raw: FormDataEntryValue | null, fallback: boolean): boolean {
  if (raw === null || raw === undefined) {
    return fallback;
  }
  const s = String(raw).toLowerCase();
  if (s === "true" || s === "1" || s === "on" || s === "yes") {
    return true;
  }
  if (s === "false" || s === "0" || s === "off" || s === "no") {
    return false;
  }
  return fallback;
}

export async function adminUpdateVendorMarketplaceFlags(
  prevState: AdminVendorFlagsFormState,
  formData: FormData,
): Promise<AdminVendorFlagsFormState> {
  void prevState;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can update vendor flags.", success: null };
  }

  const vendorId = String(formData.get("vendor_id") ?? "").trim();
  if (!vendorId) {
    return { error: "Missing vendor.", success: null };
  }

  const isPublic = parseBool(formData.get("is_public"), true);
  const isFeatured = parseBool(formData.get("is_featured"), false);
  const adminNotes = String(formData.get("admin_notes") ?? "");

  const { error } = await supabase.rpc("admin_set_vendor_marketplace_flags", {
    p_vendor_id: vendorId,
    p_is_public: isPublic,
    p_is_featured: isFeatured,
    p_admin_notes: adminNotes,
  });

  if (error) {
    serverWarn("RPC", "admin_set_vendor_marketplace_flags failed", { message: error.message });
    return { error: error.message, success: null };
  }

  const slug = String(formData.get("vendor_slug") ?? "").trim();
  revalidatePath("/admin/vendors");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  revalidatePath("/vendors");
  if (slug) {
    revalidatePath(`/vendors/${slug}`);
  }
  revalidatePath("/categories", "layout");

  return { ...adminVendorFlagsInitialState, success: "Saved." };
}

export async function adminUpdateReviewVisibility(
  prevState: AdminReviewVisibilityFormState,
  formData: FormData,
): Promise<AdminReviewVisibilityFormState> {
  void prevState;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can change review visibility.", success: null };
  }

  const reviewId = String(formData.get("review_id") ?? "").trim();
  if (!reviewId) {
    return { error: "Missing review.", success: null };
  }

  const isPublic = parseBool(formData.get("is_public"), true);

  const { error } = await supabase.rpc("admin_set_review_visibility", {
    p_review_id: reviewId,
    p_is_public: isPublic,
  });

  if (error) {
    serverWarn("RPC", "admin_set_review_visibility failed", { message: error.message });
    return { error: error.message, success: null };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/admin/dashboard");
  revalidatePath("/vendors");

  const slug = String(formData.get("vendor_slug") ?? "").trim();
  if (slug) {
    revalidatePath(`/vendors/${slug}`);
  }

  return {
    ...adminReviewVisibilityInitialState,
    success: isPublic ? "Review is now public." : "Review hidden from public profiles.",
  };
}

export async function adminSetProfileStatus(
  prevState: AdminProfileStatusFormState,
  formData: FormData,
): Promise<AdminProfileStatusFormState> {
  void prevState;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can change account status.", success: null };
  }

  const profileId = String(formData.get("profile_id") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!profileId) {
    return { error: "Missing profile.", success: null };
  }
  if (intent !== "suspend" && intent !== "restore" && intent !== "deactivate") {
    return { error: "Invalid action.", success: null };
  }

  const { error } = await supabase.rpc("admin_set_profile_status", {
    p_profile_id: profileId,
    p_action: intent,
    p_reason: reason,
  });

  if (error) {
    serverWarn("RPC", "admin_set_profile_status failed", { message: error.message });
    return { error: error.message, success: null };
  }

  revalidatePath("/admin/vendors");
  revalidatePath("/admin/dashboard");
  revalidatePath("/account-suspended");

  const successCopy =
    intent === "suspend"
      ? "Account suspended."
      : intent === "deactivate"
        ? "Account deactivated."
        : "Account restored.";

  return { ...adminProfileStatusInitialState, success: successCopy };
}

export async function adminGrantVendorPromotionalCredits(
  prevState: AdminVendorCreditsFormState,
  formData: FormData,
): Promise<AdminVendorCreditsFormState> {
  void prevState;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can grant credits.", success: null };
  }

  const vendorId = String(formData.get("vendor_id") ?? "").trim();
  const creditsRaw = String(formData.get("credits_added") ?? "").trim();
  const creditsAdded = Number.parseInt(creditsRaw, 10);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!vendorId) {
    return { error: "Missing vendor.", success: null };
  }
  if (!Number.isFinite(creditsAdded) || creditsAdded <= 0) {
    return { error: "Enter a positive whole number of credits.", success: null };
  }

  const { error } = await supabase.rpc("admin_grant_vendor_promotional_credits", {
    p_vendor_id: vendorId,
    p_credits_added: creditsAdded,
    p_reason: reason || "Manual adjustment",
  });

  if (error) {
    serverWarn("RPC", "admin_grant_vendor_promotional_credits failed", { message: error.message });
    return { error: error.message, success: null };
  }

  const slug = String(formData.get("vendor_slug") ?? "").trim();
  revalidatePath("/admin/vendors");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/credits");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/credits");
  if (slug) {
    revalidatePath(`/vendors/${slug}`);
  }

  return { ...adminVendorCreditsInitialState, success: `Added ${creditsAdded} credits.` };
}

const CREDIT_ADJUSTMENT_TYPES = ["promotional", "bonus", "correction", "refund"] as const;

export async function adminSubmitCreditAdjustment(
  prevState: AdminCreditAdjustmentFormState,
  formData: FormData,
): Promise<AdminCreditAdjustmentFormState> {
  void prevState;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can record credit adjustments.", success: null };
  }

  const vendorId = String(formData.get("vendor_id") ?? "").trim();
  const adjustmentType = String(formData.get("adjustment_type") ?? "").trim();
  const creditRaw = String(formData.get("credit_amount") ?? "").trim();
  const creditAmount = Number.parseInt(creditRaw, 10);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!vendorId) {
    return { error: "Select a vendor.", success: null };
  }

  if (!CREDIT_ADJUSTMENT_TYPES.includes(adjustmentType as (typeof CREDIT_ADJUSTMENT_TYPES)[number])) {
    return { error: "Choose a valid adjustment type.", success: null };
  }

  const { data: vendorRow } = await supabase.from("profiles").select("id, role, slug").eq("id", vendorId).maybeSingle();

  if (!vendorRow || vendorRow.role !== "vendor") {
    return { error: "That profile is not a vendor.", success: null };
  }

  const slug = typeof vendorRow.slug === "string" ? vendorRow.slug.trim() : "";

  if (adjustmentType === "promotional" || adjustmentType === "bonus") {
    if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
      return { error: "Promotional and bonus credits must be a positive whole number.", success: null };
    }

    let rpcError: { message: string } | null = null;
    if (adjustmentType === "promotional") {
      const { error } = await supabase.rpc("admin_grant_vendor_promotional_credits", {
        p_vendor_id: vendorId,
        p_credits_added: creditAmount,
        p_reason: reason || "Manual adjustment",
      });
      rpcError = error;
    } else {
      const { error } = await supabase.rpc("admin_grant_vendor_bonus_credits", {
        p_vendor_id: vendorId,
        p_credits_added: creditAmount,
        p_reason: reason || "Manual adjustment",
      });
      rpcError = error;
    }

    if (rpcError) {
      serverWarn("RPC", "admin credit grant RPC failed", { message: rpcError.message });
      return { error: rpcError.message, success: null };
    }

    revalidatePath("/admin/credits");
    revalidatePath("/admin/vendors");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/revenue");
    revalidatePath("/vendor/dashboard");
    revalidatePath("/vendor/credits");
    if (slug) {
      revalidatePath(`/vendors/${slug}`);
    }

    const label = adjustmentType === "promotional" ? "Promotional" : "Bonus";
    return {
      ...adminCreditAdjustmentInitialState,
      success: `${label}: added ${creditAmount} credits to the vendor wallet and recorded the adjustment.`,
    };
  }

  if (!Number.isFinite(creditAmount) || creditAmount === 0) {
    return {
      error: "Correction and refund entries need a non-zero whole number (negative values are allowed for reporting).",
      success: null,
    };
  }

  const { error } = await supabase.from("admin_credit_adjustments").insert({
    vendor_id: vendorId,
    admin_id: user.id,
    credits_added: creditAmount,
    reason: reason || "Recorded adjustment",
    adjustment_type: adjustmentType,
  });

  if (error) {
    serverWarn("ADMIN", "admin_credit_adjustments insert failed", { message: error.message });
    return { error: error.message, success: null };
  }

  revalidatePath("/admin/credits");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/revenue");

  return {
    ...adminCreditAdjustmentInitialState,
    success: "Recorded correction or refund row. Vendor wallet balance was not changed.",
  };
}

export async function adminSaveCustomerAdminNotes(
  prevState: AdminCustomerNotesFormState,
  formData: FormData,
): Promise<AdminCustomerNotesFormState> {
  void prevState;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not signed in.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can edit internal notes.", success: null };
  }

  const customerId = String(formData.get("customer_id") ?? "").trim();
  const adminNotes = String(formData.get("admin_notes") ?? "");

  if (!customerId) {
    return { error: "Missing customer.", success: null };
  }

  const { error } = await supabase.rpc("admin_set_customer_admin_notes", {
    p_customer_id: customerId,
    p_admin_notes: adminNotes,
  });

  if (error) {
    serverWarn("RPC", "admin_set_customer_admin_notes failed", { message: error.message });
    return { error: error.message, success: null };
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");

  return { ...adminCustomerNotesInitialState, success: "Notes saved." };
}
