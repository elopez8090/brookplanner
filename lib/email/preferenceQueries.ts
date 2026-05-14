import { createClient } from "@/lib/supabase/server";

export type UserEmailPreferencesRow = {
  user_id: string;
  quote_emails: boolean;
  message_emails: boolean;
  review_emails: boolean;
  marketing_emails: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchUserEmailPreferences(userId: string): Promise<UserEmailPreferencesRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_email_preferences")
    .select(
      "user_id, quote_emails, message_emails, review_emails, marketing_emails, created_at, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[email prefs] fetchUserEmailPreferences:", error.message);
    return null;
  }

  return data as UserEmailPreferencesRow | null;
}
