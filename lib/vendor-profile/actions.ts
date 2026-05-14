"use server";

import { revalidatePath } from "next/cache";
import { isAccountRestrictedStatus } from "@/lib/auth/accountStatus";
import { fetchProfileByUserId } from "@/lib/auth/ensureProfile";
import { createClient } from "@/lib/supabase/server";
import {
  generateVendorSlug,
  isVendorProfileComplete,
  normalizeSocialHandle,
  normalizeUrl,
} from "@/lib/vendor-profile/helpers";

export type VendorProfileFormState = {
  error: string | null;
  success: string | null;
};

const initialState: VendorProfileFormState = {
  error: null,
  success: null,
};

function cleanText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

async function uploadVendorImage(params: {
  userId: string;
  bucket: "vendor-logos" | "vendor-covers";
  file: File | null;
}): Promise<{ url: string | null; error: string | null }> {
  if (!params.file || params.file.size === 0) {
    return { url: null, error: null };
  }

  const mime = params.file.type?.toLowerCase() ?? "";
  if (!mime.startsWith("image/")) {
    return { url: null, error: "Please upload a valid image file." };
  }

  if (params.file.size > 5 * 1024 * 1024) {
    return { url: null, error: "Please upload images smaller than 5MB." };
  }

  const ext = params.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const objectPath = `${params.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage.from(params.bucket).upload(objectPath, params.file, {
    contentType: mime,
    upsert: false,
  });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(params.bucket).getPublicUrl(objectPath);
  return { url: data.publicUrl, error: null };
}

export async function updateVendorProfile(
  prevState: VendorProfileFormState = initialState,
  formData: FormData,
): Promise<VendorProfileFormState> {
  void prevState;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "vendor") {
    return { error: "Only vendors can edit this profile.", success: null };
  }
  if (isAccountRestrictedStatus(profile.status)) {
    return { error: "Your account is restricted and cannot edit this profile right now.", success: null };
  }

  const businessName = cleanText(formData.get("business_name"));
  const slugInput = cleanText(formData.get("slug"));
  const bio = cleanText(formData.get("bio"));
  const businessPhone = cleanText(formData.get("business_phone"));
  const website = cleanText(formData.get("website"));
  const instagram = cleanText(formData.get("instagram"));
  const facebook = cleanText(formData.get("facebook"));
  const tiktok = cleanText(formData.get("tiktok"));
  const serviceAreas = cleanText(formData.get("service_areas"));

  const generatedSlug = generateVendorSlug(slugInput || businessName);
  if (!businessName) {
    return { error: "Business name is required.", success: null };
  }
  if (!generatedSlug) {
    return { error: "Enter a business name or slug with letters or numbers.", success: null };
  }

  const [logoUpload, coverUpload] = await Promise.all([
    uploadVendorImage({
      userId: user.id,
      bucket: "vendor-logos",
      file: formData.get("logo") as File | null,
    }),
    uploadVendorImage({
      userId: user.id,
      bucket: "vendor-covers",
      file: formData.get("cover_image") as File | null,
    }),
  ]);

  if (logoUpload.error) {
    return { error: `Logo upload failed: ${logoUpload.error}`, success: null };
  }
  if (coverUpload.error) {
    return { error: `Cover upload failed: ${coverUpload.error}`, success: null };
  }

  const isComplete = isVendorProfileComplete({
    businessName,
    slug: generatedSlug,
    bio,
    businessPhone,
    serviceAreas,
  });

  const updatePayload: Record<string, unknown> = {
    business_name: businessName,
    slug: generatedSlug,
    bio: bio || null,
    business_phone: businessPhone || null,
    website: normalizeUrl(website),
    instagram: normalizeSocialHandle(instagram),
    facebook: normalizeSocialHandle(facebook),
    tiktok: normalizeSocialHandle(tiktok),
    service_areas: serviceAreas || null,
    is_profile_complete: isComplete,
  };

  if (logoUpload.url) {
    updatePayload.logo_url = logoUpload.url;
  }
  if (coverUpload.url) {
    updatePayload.cover_image_url = coverUpload.url;
  }

  const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id).eq("role", "vendor");

  if (error) {
    if (error.message.toLowerCase().includes("profiles_vendor_slug_unique_idx")) {
      return { error: "That profile URL is already taken. Choose a different slug.", success: null };
    }
    return { error: error.message, success: null };
  }

  revalidatePath("/vendor/profile");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${generatedSlug}`);

  return { error: null, success: "Business profile updated." };
}
