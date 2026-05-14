import type { Metadata } from "next";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { requireRole } from "@/lib/auth/getUserProfile";
import { CreditPackageCard } from "./CreditPackageCard";

export const metadata: Metadata = {
  title: "Buy Credits",
};

const CREDIT_PACKAGES = [
  { id: "starter", name: "Starter Pack", amountLabel: "$25", credits: 6 },
  { id: "growth", name: "Growth Pack", amountLabel: "$50", credits: 12 },
  { id: "pro", name: "Pro Pack", amountLabel: "$100", credits: 25 },
] as const;

export default async function VendorCreditsPage() {
  const { profile } = await requireRole("vendor");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Credits</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Buy Credits</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Purchase additional credits to submit more quotes on active customer events.
        </p>
      </header>

      <DashboardCard title="Current credit balance">
        <p className="text-3xl font-bold tracking-tight text-brand-navy">{profile.credits_balance} credits</p>
        <p className="mt-2 text-sm text-brand-navy-muted">
          Credits are added only after Stripe confirms a successful payment.
        </p>
      </DashboardCard>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-brand-navy">Credit packages</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <CreditPackageCard
              key={pkg.id}
              packageId={pkg.id}
              name={pkg.name}
              amountLabel={pkg.amountLabel}
              credits={pkg.credits}
            />
          ))}
        </div>
      </section>

      <ButtonLink href="/vendor/dashboard" variant="secondary">
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
