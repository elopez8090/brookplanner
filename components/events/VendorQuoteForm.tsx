"use client";

import { useActionState, useMemo, useState } from "react";
import { submitVendorQuote, type SubmitQuoteFormState } from "@/lib/events/actions";

type QuoteServiceOption = {
  id: string;
  categoryName: string;
  creditsRequired: number | string | null;
  quoteCount?: number | null;
  spotsRemaining?: number | null;
  alreadyQuoted?: boolean;
};

type VendorQuoteFormProps = {
  eventId: string;
  services: QuoteServiceOption[];
  creditsBalance: number | string | null;
  /** Extra copy for vendors who have not submitted any quotes yet. */
  emphasizeFirstQuote?: boolean;
};

const initialState: SubmitQuoteFormState = {
  error: null,
  success: null,
};

export function VendorQuoteForm({
  eventId,
  services,
  creditsBalance,
  emphasizeFirstQuote = false,
}: VendorQuoteFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitVendorQuote,
    initialState
  );

  const [selectedServiceId, setSelectedServiceId] = useState("");

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === selectedServiceId) ?? null;
  }, [services, selectedServiceId]);

  const vendorCredits = Number(creditsBalance ?? 0);

  const creditsRequired = Number(selectedService?.creditsRequired ?? 0);

  const hasSelectedService = Boolean(selectedServiceId) && selectedService !== null;

  const shouldShowCreditWarning =
    hasSelectedService &&
    creditsRequired > 0 &&
    vendorCredits < creditsRequired;

  const selectedServiceAlreadyQuoted = Boolean(selectedService?.alreadyQuoted);

  const selectedServiceFull =
    hasSelectedService && Number(selectedService?.quoteCount ?? 0) >= 4;

  const shouldDisableSubmit =
    isPending ||
    !hasSelectedService ||
    shouldShowCreditWarning ||
    selectedServiceAlreadyQuoted ||
    selectedServiceFull;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />

      <div className="rounded-xl border border-border-subtle bg-slate-50/90 p-3 text-sm leading-relaxed text-brand-navy-muted">
        <p className="font-semibold text-brand-navy">Hosts compare quickly</p>
        <p className="mt-1">
          Only four quotes are allowed per requested service. Your profile and message are what build trust before any
          booking — be specific, professional, and fast.
        </p>
        {emphasizeFirstQuote ? (
          <p className="mt-2 border-t border-border-subtle pt-2 text-brand-navy-muted">
            Quotes are time-sensitive: when slots fill or the host shortlists vendors, late entries miss the window. Vendors who respond
            early tend to win more events — submit as soon as you have a clear offer.
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="event_service_id"
          className="block text-sm font-semibold text-brand-navy"
        >
          Service
        </label>

        <select
          id="event_service_id"
          name="event_service_id"
          value={selectedServiceId}
          onChange={(event) => setSelectedServiceId(event.target.value)}
          required
          className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
        >
          <option value="">Select a service</option>

          {services.map((service) => {
            const serviceCreditsRequired = Number(service.creditsRequired ?? 0);
            const qc = Number(service.quoteCount ?? 0);
            const rem = Math.max(0, 4 - qc);
            const spotsLabel =
              service.spotsRemaining !== undefined && service.spotsRemaining !== null
                ? Number(service.spotsRemaining)
                : rem;

            return (
              <option key={service.id} value={service.id}>
                {service.categoryName} — {qc}/4 quotes · {spotsLabel} spot{spotsLabel === 1 ? "" : "s"} left —{" "}
                {serviceCreditsRequired > 0 ? serviceCreditsRequired : 1}{" "}
                {serviceCreditsRequired === 1 ? "credit" : "credits"}
              </option>
            );
          })}
        </select>
      </div>

      {hasSelectedService ? (
        <div className="rounded-xl border border-border-subtle bg-slate-50 p-3 text-sm text-brand-navy-muted">
          <p>
            Submitting uses{" "}
            <span className="font-semibold text-brand-navy">
              {creditsRequired > 0 ? creditsRequired : 1}
            </span>{" "}
            {creditsRequired === 1 ? "credit" : "credits"} from your balance right away when your quote is recorded
            (per category rules). Customers do not see your credit balance.
          </p>
          <p className="mt-2">
            Open quote slots on this service before you submit:{" "}
            <span className="font-semibold text-brand-navy">
              {Math.max(0, 4 - Number(selectedService?.quoteCount ?? 0))}
            </span>
            .
          </p>
          <p className="mt-2">
            Your balance:{" "}
            <span className="font-semibold text-brand-navy">
              {vendorCredits}
            </span>{" "}
            credits.
          </p>
        </div>
      ) : null}

      {shouldShowCreditWarning ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          You need more credits to submit this quote.
        </p>
      ) : null}

      {selectedServiceAlreadyQuoted ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          You already submitted a quote for this service.
        </p>
      ) : null}

      {selectedServiceFull ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          This service already has the maximum number of quotes.
        </p>
      ) : null}

      <div>
        <label
          htmlFor="quote_amount"
          className="block text-sm font-semibold text-brand-navy"
        >
          Quote amount
        </label>
        <input
          id="quote_amount"
          name="quote_amount"
          type="number"
          min="1"
          step="0.01"
          required
          className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          placeholder="Example: 1200"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-semibold text-brand-navy"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          placeholder="Introduce your business and explain why you're a good fit."
        />
      </div>

      <div>
        <label
          htmlFor="what_is_included"
          className="block text-sm font-semibold text-brand-navy"
        >
          What is included
        </label>
        <textarea
          id="what_is_included"
          name="what_is_included"
          required
          rows={3}
          className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          placeholder="List what your quote includes."
        />
      </div>

      <div>
        <label
          htmlFor="availability_note"
          className="block text-sm font-semibold text-brand-navy"
        >
          Availability note
        </label>
        <input
          id="availability_note"
          name="availability_note"
          required
          className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          placeholder="Example: Available weekends and evenings"
        />
      </div>

      <div>
        <label
          htmlFor="estimated_timeframe"
          className="block text-sm font-semibold text-brand-navy"
        >
          Estimated timeframe
        </label>
        <input
          id="estimated_timeframe"
          name="estimated_timeframe"
          required
          className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          placeholder="Example: 4–6 hours"
        />
      </div>

      <div>
        <label
          htmlFor="business_phone"
          className="block text-sm font-semibold text-brand-navy"
        >
          Business phone
        </label>
        <input
          id="business_phone"
          name="business_phone"
          required
          className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          placeholder="Example: (555) 123-4567"
        />
      </div>

      <div>
        <label
          htmlFor="business_email"
          className="block text-sm font-semibold text-brand-navy"
        >
          Business email
        </label>
        <input
          id="business_email"
          name="business_email"
          type="email"
          required
          className="mt-2 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          placeholder="you@business.com"
        />
      </div>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p className="font-semibold">Quote sent</p>
          <p className="mt-1 leading-relaxed">{state.success}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={shouldDisableSubmit}
        className="w-full rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Submitting quote..." : "Submit quote — use a slot while they are open"}
      </button>
    </form>
  );
}