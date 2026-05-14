"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { submitCustomerReview } from "@/lib/reviews/actions";
import { customerReviewInitialState } from "@/lib/reviews/state";

type CustomerQuoteReviewFormProps = {
  quoteId: string;
  eventId: string;
  vendorId: string;
  vendorSlug: string | null;
};

export function CustomerQuoteReviewForm({ quoteId, eventId, vendorId, vendorSlug }: CustomerQuoteReviewFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitCustomerReview, customerReviewInitialState);
  const wasBusyRef = useRef(false);

  useEffect(() => {
    if (wasBusyRef.current && !pending && state.success) {
      router.refresh();
    }
    wasBusyRef.current = pending;
  }, [pending, router, state.success]);

  return (
    <div className="mt-4 space-y-3 border-t border-border-subtle pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Leave a review</p>
      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {state.success}
        </p>
      ) : (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="quote_id" value={quoteId} />
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="vendor_id" value={vendorId} />
          {vendorSlug?.trim() ? <input type="hidden" name="vendor_slug" value={vendorSlug.trim()} /> : null}
          <div>
            <label htmlFor={`rating-${quoteId}`} className="block text-xs font-semibold text-brand-navy-muted">
              Rating
            </label>
            <select
              id={`rating-${quoteId}`}
              name="rating"
              required
              disabled={pending}
              className="mt-1 w-full max-w-xs rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy shadow-sm focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25 disabled:opacity-60"
              defaultValue=""
            >
              <option value="" disabled>
                Select 1–5 stars
              </option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={String(n)}>
                  {n} — {n === 5 ? "Excellent" : n === 4 ? "Good" : n === 3 ? "Okay" : n === 2 ? "Fair" : "Poor"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`review-${quoteId}`} className="block text-xs font-semibold text-brand-navy-muted">
              Short feedback (optional)
            </label>
            <textarea
              id={`review-${quoteId}`}
              name="review_text"
              rows={3}
              disabled={pending}
              maxLength={2000}
              placeholder="What stood out about working with this vendor?"
              className="mt-1 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy shadow-sm focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a2f4f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit review
          </button>
        </form>
      )}
    </div>
  );
}

export function ReviewPostedSummary({ rating, reviewText }: { rating: number; reviewText: string }) {
  return (
    <div className="mt-4 space-y-2 border-t border-border-subtle pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Your review</p>
      <p className="text-sm font-medium text-brand-navy">
        You rated this vendor {rating} out of 5.
      </p>
      {reviewText.trim() ? (
        <p className="text-sm leading-relaxed text-brand-navy-muted whitespace-pre-wrap">{reviewText.trim()}</p>
      ) : null}
    </div>
  );
}
