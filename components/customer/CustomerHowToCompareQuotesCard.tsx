export function CustomerHowToCompareQuotesCard() {
  return (
    <div className="rounded-2xl border border-border-subtle bg-card px-5 py-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] sm:px-6">
      <h2 className="text-sm font-semibold text-brand-navy">How to compare quotes</h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-navy-muted">
        Take a beat to line up proposals fairly — you are not rushed to accept.
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-brand-navy-muted">
        <li>
          <span className="font-medium text-brand-navy">Price</span> — totals and what is included for the fee.
        </li>
        <li>
          <span className="font-medium text-brand-navy">Included services</span> — staffing, rentals, travel, and exclusions.
        </li>
        <li>
          <span className="font-medium text-brand-navy">Timing</span> — load-in, service windows, and flexibility on your date.
        </li>
        <li>
          <span className="font-medium text-brand-navy">Reviews</span> — patterns in feedback from other hosts when shown.
        </li>
        <li>
          <span className="font-medium text-brand-navy">Message quality</span> — clarity, professionalism, and how well they listened to your brief.
        </li>
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-brand-navy-muted">
        Use <span className="font-medium text-brand-navy">Open compare layout</span> above for a wide view of every proposal at once.
      </p>
    </div>
  );
}
