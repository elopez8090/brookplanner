import type { Metadata } from "next";
import { EmailNotificationPreferencesForm } from "@/components/settings/EmailNotificationPreferencesForm";
import { updateVendorEmailPreferences } from "@/lib/email/emailPreferenceActions";
import { fetchUserEmailPreferences } from "@/lib/email/preferenceQueries";
import { requireRole } from "@/lib/auth/getUserProfile";

export const metadata: Metadata = {
  title: "Notification settings",
};

export default async function VendorNotificationSettingsPage() {
  const { user } = await requireRole("vendor");
  const row = await fetchUserEmailPreferences(user.id);

  const quoteEmails = row?.quote_emails ?? true;
  const messageEmails = row?.message_emails ?? true;
  const reviewEmails = row?.review_emails ?? true;
  const marketingEmails = row?.marketing_emails ?? false;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Settings</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Email notifications</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Choose which marketplace emails we send. Critical account messages are always delivered.
        </p>
      </header>

      <EmailNotificationPreferencesForm
        saveAction={updateVendorEmailPreferences}
        quoteEmails={quoteEmails}
        messageEmails={messageEmails}
        reviewEmails={reviewEmails}
        marketingEmails={marketingEmails}
      />
    </div>
  );
}
