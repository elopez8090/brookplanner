"use client";

import { useActionState } from "react";
import {
  emailPreferencesInitialState,
  type EmailPreferencesFormState,
} from "@/lib/email/emailPreferenceFormState";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

type EmailNotificationPreferencesFormProps = {
  saveAction: (prevState: EmailPreferencesFormState, formData: FormData) => Promise<EmailPreferencesFormState>;
  quoteEmails: boolean;
  messageEmails: boolean;
  reviewEmails: boolean;
  marketingEmails: boolean;
};

const checkboxClass =
  "mt-1 h-5 w-5 shrink-0 rounded border-border-subtle text-brand-navy focus:ring-brand-navy";

export function EmailNotificationPreferencesForm({
  saveAction,
  quoteEmails,
  messageEmails,
  reviewEmails,
  marketingEmails,
}: EmailNotificationPreferencesFormProps) {
  const [state, formAction, pending] = useActionState(saveAction, emailPreferencesInitialState);

  return (
    <form action={formAction} className="space-y-6">
      <DashboardCard
        title="Quote emails"
        description="Messages when quotes are submitted or your quote decisions are confirmed."
      >
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span className="text-sm leading-snug text-brand-navy">
            Email me about quote updates{" "}
            <span className="block text-xs font-normal text-brand-navy-muted">
              Customers hear when vendors quote; vendors hear when quotes are accepted or declined.
            </span>
          </span>
          <input
            type="checkbox"
            name="quote_emails"
            defaultChecked={quoteEmails}
            value="on"
            className={checkboxClass}
          />
        </label>
      </DashboardCard>

      <DashboardCard
        title="Message emails"
        description="Alerts when someone sends you a new message on an event conversation."
      >
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span className="text-sm leading-snug text-brand-navy">
            Email me when I receive a message
            <span className="block text-xs font-normal text-brand-navy-muted">
              In-app messaging and notifications are unchanged; this only controls email copies.
            </span>
          </span>
          <input
            type="checkbox"
            name="message_emails"
            defaultChecked={messageEmails}
            value="on"
            className={checkboxClass}
          />
        </label>
      </DashboardCard>

      <DashboardCard
        title="Review emails"
        description="Heads-up when a customer leaves feedback on your work."
      >
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span className="text-sm leading-snug text-brand-navy">
            Email me about new reviews
            <span className="block text-xs font-normal text-brand-navy-muted">Vendors receive review alerts.</span>
          </span>
          <input
            type="checkbox"
            name="review_emails"
            defaultChecked={reviewEmails}
            value="on"
            className={checkboxClass}
          />
        </label>
      </DashboardCard>

      <DashboardCard
        title="Marketing"
        description="Product news and tips from Brook Planner. Rare; you can turn this off anytime."
      >
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span className="text-sm leading-snug text-brand-navy">
            Email me occasional updates and tips
            <span className="block text-xs font-normal text-brand-navy-muted">
              Transactional emails above may still be sent when enabled.
            </span>
          </span>
          <input
            type="checkbox"
            name="marketing_emails"
            defaultChecked={marketingEmails}
            value="on"
            className={checkboxClass}
          />
        </label>
      </DashboardCard>

      <p className="text-xs leading-relaxed text-brand-navy-muted">
        Security and important account emails (such as password resets) are always sent and cannot be disabled here.
      </p>

      {state.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p> : null}
      {state.success ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}
