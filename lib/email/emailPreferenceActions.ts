"use server";

import { revalidatePath } from "next/cache";
import { fetchProfileByUserId } from "@/lib/auth/ensureProfile";
import type { EmailPreferencesFormState } from "@/lib/email/emailPreferenceFormState";
import { createClient } from "@/lib/supabase/server";

function formCheckboxOn(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

async function saveEmailPreferencesForWorkspace(
  workspace: "customer" | "vendor",
  prevState: EmailPreferencesFormState,
  formData: FormData,
): Promise<EmailPreferencesFormState> {
  void prevState;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== workspace) {
    return { error: "You cannot update these settings from this workspace.", success: null };
  }

  const payload = {
    user_id: user.id,
    quote_emails: formCheckboxOn(formData, "quote_emails"),
    message_emails: formCheckboxOn(formData, "message_emails"),
    review_emails: formCheckboxOn(formData, "review_emails"),
    marketing_emails: formCheckboxOn(formData, "marketing_emails"),
  };

  const { error } = await supabase.from("user_email_preferences").upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("[email prefs] upsert:", error.message);
    return { error: "Could not save preferences. Try again.", success: null };
  }

  revalidatePath(`/${workspace}/settings/notifications`);
  return { error: null, success: "Notification preferences saved." };
}

export async function updateCustomerEmailPreferences(
  prevState: EmailPreferencesFormState,
  formData: FormData,
): Promise<EmailPreferencesFormState> {
  return saveEmailPreferencesForWorkspace("customer", prevState, formData);
}

export async function updateVendorEmailPreferences(
  prevState: EmailPreferencesFormState,
  formData: FormData,
): Promise<EmailPreferencesFormState> {
  return saveEmailPreferencesForWorkspace("vendor", prevState, formData);
}
