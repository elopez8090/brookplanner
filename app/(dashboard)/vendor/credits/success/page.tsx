import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "Payment received",
};

export default function VendorCreditsSuccessPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Credits</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Payment received</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Your payment was received successfully. Credits may take a moment to appear on your account while Stripe
          finishes processing.
        </p>
      </header>

      <ButtonLink href="/vendor/credits">Back to Buy Credits</ButtonLink>
    </div>
  );
}
