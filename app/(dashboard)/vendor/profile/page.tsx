import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { VendorProfileForm } from "@/components/vendor/VendorProfileForm";
import { requireRole } from "@/lib/auth/getUserProfile";
import {
  computeVendorProfileCompletionPercent,
  getVendorProfileCompletionChecklist,
  isVendorProfileCompletionRequiredComplete,
  vendorProfileRowToCompletionInput,
} from "@/lib/vendor-profile/profileCompletion";
import { fetchVendorProfileByUserId } from "@/lib/vendor-profile/queries";

export const metadata: Metadata = {
  title: "Vendor Profile",
};

export default async function VendorProfilePage() {
  const { user } = await requireRole("vendor");
  const profile = await fetchVendorProfileByUserId(user.id);

  if (!profile) {
    notFound();
  }

  const completionInput = vendorProfileRowToCompletionInput(profile);
  const marketplaceCompletion = computeVendorProfileCompletionPercent(completionInput);
  const checklist = getVendorProfileCompletionChecklist(completionInput);
  const isChecklistComplete = isVendorProfileCompletionRequiredComplete(completionInput);
  const publicHref = profile.slug ? `/vendors/${profile.slug}` : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Vendor profile</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Build your public business page</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Add your brand details so customers can trust your business before requesting a quote.
        </p>
      </header>

      <DashboardCard
        title="Profile status"
        description={
          isChecklistComplete
            ? `Your Brook Planner checklist is satisfied. Marketplace presence score: ${marketplaceCompletion}%.`
            : `Add missing checklist fields so customers can reach you. Marketplace presence score: ${marketplaceCompletion}%.`
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isChecklistComplete ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {isChecklistComplete ? "Checklist complete" : "Checklist incomplete"}
          </span>
          <span className="rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-semibold text-brand-navy">
            Marketplace profile {marketplaceCompletion}%
          </span>
          {publicHref ? (
            <a
              href={publicHref}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-accent-blue hover:underline"
            >
              View Public Profile
            </a>
          ) : null}
        </div>
        <ul className="mt-4 grid gap-2 border-t border-border-subtle pt-4 sm:grid-cols-2">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  item.done ? "bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-white text-slate-400"
                }`}
                aria-hidden
              >
                {item.done ? "✓" : ""}
              </span>
              <span className={item.done ? "text-brand-navy-muted" : "font-medium text-brand-navy"}>{item.label}</span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      <VendorProfileForm profile={profile} />
    </div>
  );
}
