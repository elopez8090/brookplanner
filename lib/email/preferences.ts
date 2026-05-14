import "server-only";

import { serverWarn } from "@/lib/logging/serverLog";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/**
 * Marketplace / transactional emails consult `shouldSendMarketplaceEmail` so sends respect `user_email_preferences`.
 * Operational emails (e.g. admin alerts) bypass this helper.
 */

export type MarketplaceEmailNotificationType =
  | "quote_submitted_customer"
  | "quote_accepted_vendor"
  | "quote_declined_vendor"
  | "message_customer"
  | "message_vendor"
  | "review_vendor";

/** Types excluded from user prefs (broadcast / operational). */
export type OperationalEmailType = "admin_vendor_registered";

type PreferenceColumns = {
  quote_emails: boolean;
  message_emails: boolean;
  review_emails: boolean;
  marketing_emails: boolean;
};

/** When no row exists (or service role is unavailable), transactional marketplace emails default to on. */
function transactionalDefaultWhenMissingRow(): boolean {
  return true;
}

function resolveSendFromRow(row: PreferenceColumns, type: MarketplaceEmailNotificationType): boolean {
  switch (type) {
    case "quote_submitted_customer":
    case "quote_accepted_vendor":
    case "quote_declined_vendor":
      return row.quote_emails;
    case "message_customer":
    case "message_vendor":
      return row.message_emails;
    case "review_vendor":
      return row.review_emails;
  }
}

export async function shouldSendMarketplaceEmail(
  userId: string,
  type: MarketplaceEmailNotificationType,
): Promise<boolean> {
  const id = userId.trim();
  if (!id) {
    return false;
  }

  const admin = createServiceRoleSupabase();
  if (!admin) {
    if (process.env.NODE_ENV === "development") {
      serverWarn("EMAIL", "shouldSendMarketplaceEmail: missing service role client; defaulting to send.");
    }
    return transactionalDefaultWhenMissingRow();
  }

  const { data, error } = await admin
    .from("user_email_preferences")
    .select("quote_emails, message_emails, review_emails, marketing_emails")
    .eq("user_id", id)
    .maybeSingle();

  if (error) {
    serverWarn("EMAIL", "shouldSendMarketplaceEmail: query failed; defaulting to send", { message: error.message });
    return transactionalDefaultWhenMissingRow();
  }

  if (!data) {
    return transactionalDefaultWhenMissingRow();
  }

  const row = data as PreferenceColumns;
  return resolveSendFromRow(row, type);
}
