import {
  formatAvgRatingOneDecimal,
  isVendorTopReviewed,
  quoteActivityLabel,
} from "@/lib/marketplace/vendorTrustPresentation";

export type VendorDirectoryTrustSignalsProps = {
  reviewCount: number;
  avgRating: number | null;
  quotesSubmittedCount: number;
  isFeatured?: boolean;
  /** Directory rows are marketplace-complete; still show badge for credibility. */
  showCompleteProfileBadge?: boolean;
  className?: string;
};

export function VendorDirectoryTrustSignals({
  reviewCount,
  avgRating,
  quotesSubmittedCount,
  isFeatured,
  showCompleteProfileBadge = true,
  className = "",
}: VendorDirectoryTrustSignalsProps) {
  const avgLabel = formatAvgRatingOneDecimal(avgRating);
  const topReviewed = isVendorTopReviewed(reviewCount, avgRating);
  const activity = quoteActivityLabel(quotesSubmittedCount);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap gap-1.5">
        {showCompleteProfileBadge ? (
          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-200/80">
            Complete profile
          </span>
        ) : null}
        {isFeatured ? (
          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200/80">
            Featured
          </span>
        ) : null}
        {topReviewed ? (
          <span className="inline-flex rounded-full bg-brand-navy/[0.08] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-navy ring-1 ring-brand-navy/15">
            Top reviewed
          </span>
        ) : null}
      </div>
      <p className="text-xs leading-relaxed text-brand-navy-muted">
        {reviewCount > 0 && avgLabel ? (
          <>
            <span className="font-semibold tabular-nums text-brand-navy">{avgLabel}</span> avg ·{" "}
            <span className="tabular-nums">{reviewCount}</span> {reviewCount === 1 ? "review" : "reviews"}
          </>
        ) : (
          <span>No public reviews yet</span>
        )}
        {activity ? (
          <>
            {" "}
            · <span className="text-brand-navy">{activity}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
