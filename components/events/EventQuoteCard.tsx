import { CustomerQuoteDecisionForm } from "@/components/events/CustomerQuoteDecisionForm";
import { CustomerQuoteReviewForm, ReviewPostedSummary } from "@/components/events/CustomerQuoteReviewForm";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { VendorDirectoryLogoImage } from "@/components/ui/VendorDirectoryLogoImage";
import {
  customerVendorPublicRatingLabel,
  formatQuoteAmountUsd,
  normalizeQuoteStatus,
  quoteStatusPresentation,
} from "@/lib/events/presentation";

export type EventQuoteCardVendor = {
  vendor_id: string;
  displayName: string;
  service_areas: string | null;
  logo_url: string | null;
  slug: string | null;
  /** Public reviews only (from customer-safe RPC). */
  publicReviewCount?: number | null;
  publicAvgRating?: number | null;
};

export type EventQuoteCardQuote = {
  id: string;
  quote_amount: number;
  message: string;
  what_is_included: string | null;
  availability_note: string | null;
  estimated_timeframe: string | null;
  status: string;
};

function optionalText(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

type EventQuoteCardProps = {
  quote: EventQuoteCardQuote;
  vendor: EventQuoteCardVendor;
  eventId: string;
  serviceCategoryName?: string | null;
  showCustomerActions: boolean;
  /** When set for an accepted quote, shows review form or the customer's submitted review. */
  customerReview?: {
    existing: { rating: number; review_text: string } | null;
  } | null;
  acceptedConversationHref?: string | null;
};

export function EventQuoteCard({
  quote,
  vendor,
  eventId,
  serviceCategoryName,
  showCustomerActions,
  customerReview,
  acceptedConversationHref,
}: EventQuoteCardProps) {
  const whatIsIncluded = optionalText(quote.what_is_included);
  const availabilityNote = optionalText(quote.availability_note);
  const estimatedTimeframe = optionalText(quote.estimated_timeframe);
  const quoteStatus = quoteStatusPresentation(quote.status);
  const statusKey = normalizeQuoteStatus(String(quote.status));
  const ratingLine = customerVendorPublicRatingLabel(
    vendor.publicAvgRating ?? null,
    vendor.publicReviewCount ?? 0,
  );

  return (
    <li className="rounded-2xl border border-border-subtle bg-card p-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] sm:p-6">
      <div className="flex flex-wrap gap-4">
        <div className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-white">
          <VendorDirectoryLogoImage
            logoUrl={vendor.logo_url}
            businessName={vendor.displayName}
            alt={`${vendor.displayName} logo`}
            fallbackClassName="bg-brand-navy/[0.04] text-lg font-semibold text-brand-navy-muted"
            sizes="56px"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-brand-navy">{vendor.displayName}</p>
              {vendor.service_areas?.trim() ? (
                <p className="text-xs text-brand-navy-muted">Service area: {vendor.service_areas.trim()}</p>
              ) : null}
              {serviceCategoryName ? (
                <p className="text-xs font-medium text-brand-navy-muted">Service: {serviceCategoryName}</p>
              ) : null}
              {ratingLine ? (
                <p className="text-xs font-medium text-amber-800/90" aria-label="Vendor public review summary">
                  {ratingLine}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <p className="text-base font-semibold tabular-nums text-brand-navy">
                {formatQuoteAmountUsd(Number(quote.quote_amount))}
              </p>
              <StatusBadge tone={quoteStatus.tone}>{quoteStatus.label}</StatusBadge>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-brand-navy-muted">{quote.message}</p>
          {whatIsIncluded ? (
            <p className="text-sm text-brand-navy">
              <span className="font-semibold">What is included:</span> {whatIsIncluded}
            </p>
          ) : null}
          {availabilityNote ? (
            <p className="text-sm text-brand-navy">
              <span className="font-semibold">Availability note:</span> {availabilityNote}
            </p>
          ) : null}
          {estimatedTimeframe ? (
            <p className="text-sm text-brand-navy">
              <span className="font-semibold">Estimated timeframe:</span> {estimatedTimeframe}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-border-subtle pt-4">
            {vendor.slug?.trim() ? (
              <ButtonLink href={`/vendors/${vendor.slug.trim()}`} variant="secondary" className="text-sm">
                View Vendor Profile
              </ButtonLink>
            ) : (
              <p className="text-xs text-brand-navy-muted">Public vendor profile isn&apos;t available yet.</p>
            )}
            {statusKey === "accepted" && acceptedConversationHref ? (
              <ButtonLink href={acceptedConversationHref} variant="secondary" className="text-sm">
                Message vendor
              </ButtonLink>
            ) : null}
          </div>

          {showCustomerActions ? (
            <CustomerQuoteDecisionForm
              quoteId={quote.id}
              eventId={eventId}
              showActions={statusKey === "pending"}
            />
          ) : null}

          {showCustomerActions && statusKey === "accepted" && customerReview ? (
            customerReview.existing ? (
              <ReviewPostedSummary rating={customerReview.existing.rating} reviewText={customerReview.existing.review_text} />
            ) : (
              <CustomerQuoteReviewForm
                quoteId={quote.id}
                eventId={eventId}
                vendorId={vendor.vendor_id}
                vendorSlug={vendor.slug}
              />
            )
          ) : null}
        </div>
      </div>
    </li>
  );
}
