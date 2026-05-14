type CustomerTrustCalloutProps = {
  /** Tighter padding when nested in cards */
  dense?: boolean;
};

export function CustomerTrustCallout({ dense }: CustomerTrustCalloutProps) {
  return (
    <div
      className={
        dense
          ? "rounded-xl border border-accent-blue/25 bg-accent-blue/[0.06] px-4 py-3 text-sm leading-relaxed text-brand-navy"
          : "rounded-2xl border border-accent-blue/20 bg-gradient-to-br from-accent-blue/[0.08] to-white px-5 py-4 text-sm leading-relaxed text-brand-navy shadow-sm ring-1 ring-black/[0.03] sm:px-6 sm:py-5"
      }
    >
      <p className="font-semibold text-brand-navy">You stay in control</p>
      <p className="mt-1.5 text-brand-navy-muted">
        Vendors submit quotes in response to your event — you compare proposals and accept only the vendor you want.
        There is no obligation to choose anyone.
      </p>
    </div>
  );
}
