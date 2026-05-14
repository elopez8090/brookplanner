"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import {
  acceptCustomerQuote,
  declineCustomerQuote,
  type CustomerQuoteDecisionFormState,
} from "@/lib/events/actions";

const initialDecisionState: CustomerQuoteDecisionFormState = { error: null };

type CustomerQuoteDecisionFormProps = {
  quoteId: string;
  eventId: string;
  showActions: boolean;
};

export function CustomerQuoteDecisionForm({ quoteId, eventId, showActions }: CustomerQuoteDecisionFormProps) {
  const router = useRouter();
  const [acceptState, acceptAction, acceptPending] = useActionState(acceptCustomerQuote, initialDecisionState);
  const [declineState, declineAction, declinePending] = useActionState(declineCustomerQuote, initialDecisionState);
  const wasBusyRef = useRef(false);

  useEffect(() => {
    const busy = acceptPending || declinePending;
    if (wasBusyRef.current && !busy) {
      router.refresh();
    }
    wasBusyRef.current = busy;
  }, [acceptPending, declinePending, router]);

  if (!showActions) {
    return null;
  }

  const decisionError = acceptState.error ?? declineState.error;
  const busy = acceptPending || declinePending;

  return (
    <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
      {decisionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {decisionError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <form action={acceptAction}>
          <input type="hidden" name="quote_id" value={quoteId} />
          <input type="hidden" name="event_id" value={eventId} />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-accent-coral px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ease-out hover:bg-accent-coral-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Accept
          </button>
        </form>
        <form action={declineAction}>
          <input type="hidden" name="quote_id" value={quoteId} />
          <input type="hidden" name="event_id" value={eventId} />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition-colors duration-200 ease-out hover:bg-brand-navy/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Decline
          </button>
        </form>
      </div>
    </div>
  );
}
