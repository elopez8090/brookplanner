import { ButtonLink } from "@/components/ui/ButtonLink";
import { VendorCoverImage } from "@/components/ui/VendorCoverImage";
import { VendorDirectoryLogoImage } from "@/components/ui/VendorDirectoryLogoImage";
import {
  computeVendorProfileCompletionPercent,
  getVendorProfileCompletionChecklist,
  vendorProfileRowToCompletionInput,
  VENDOR_PROFILE_COMPLETION_WARNING_THRESHOLD,
} from "@/lib/vendor-profile/profileCompletion";
import type { VendorProfileRow } from "@/lib/vendor-profile/types";

type VendorDashboardMarketplacePresenceProps = {
  profile: VendorProfileRow;
};

export function VendorDashboardMarketplacePresence({ profile }: VendorDashboardMarketplacePresenceProps) {
  const completionInput = vendorProfileRowToCompletionInput(profile);
  const percent = computeVendorProfileCompletionPercent(completionInput);
  const checklist = getVendorProfileCompletionChecklist(completionInput);
  const businessName = profile.business_name?.trim() || profile.full_name?.trim() || "Your business";
  const publicHref = profile.slug ? `/vendors/${profile.slug}` : null;
  const bioPreview = (profile.bio ?? "").trim() || "Add a short bio so customers understand what you offer.";

  return (
    <div className="space-y-5">
      {percent < VENDOR_PROFILE_COMPLETION_WARNING_THRESHOLD ? (
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-r from-slate-50/90 to-white px-4 py-3.5 shadow-sm sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-brand-navy sm:max-w-[min(100%,28rem)]">
              Complete your profile to build trust with customers and improve marketplace visibility.
            </p>
            <ButtonLink href="/vendor/profile" className="shrink-0 sm:w-auto">
              Complete profile
            </ButtonLink>
          </div>
        </div>
      ) : null}

      <section
        aria-labelledby="vendor-profile-completion-heading"
        className="overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-b from-white via-white to-slate-50/60 p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] sm:p-7"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Marketplace presence</p>
            <h2 id="vendor-profile-completion-heading" className="mt-1 text-lg font-semibold text-brand-navy sm:text-xl">
              Profile completion
            </h2>
            <p className="mt-1 max-w-md text-sm text-brand-navy-muted">
              A complete profile helps you stand out in the directory and on your public page.
            </p>
          </div>
          <div className="flex shrink-0 items-baseline gap-1.5 rounded-2xl border border-border-subtle bg-white/80 px-4 py-2.5 shadow-sm">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-brand-navy">{percent}</span>
            <span className="text-sm font-semibold text-brand-navy-muted">%</span>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-blue to-[#2d6a8f] transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
            />
          </div>
        </div>

        <ul className="mt-6 space-y-2.5 border-t border-border-subtle pt-5">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-3 text-sm">
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

        <div className="mt-6 flex flex-wrap gap-3 border-t border-border-subtle pt-5">
          <ButtonLink href="/vendor/profile">Edit profile</ButtonLink>
          {publicHref ? (
            <ButtonLink href={publicHref} variant="secondary">
              View public profile
            </ButtonLink>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="vendor-profile-preview-heading"
        className="rounded-2xl border border-border-subtle bg-card p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] sm:p-7"
      >
        <h2 id="vendor-profile-preview-heading" className="text-lg font-semibold text-brand-navy">
          How customers see you
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-brand-navy-muted">
          Customers are more likely to contact vendors with complete profiles. This is a simplified preview of your
          marketplace listing.
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-inner">
          <div className="relative h-20 bg-gradient-to-r from-brand-navy to-[#12553f] sm:h-24">
            {profile.cover_image_url ? (
              <VendorCoverImage src={profile.cover_image_url} alt="" fallback={null} sizes="(max-width: 640px) 100vw, 560px" />
            ) : null}
          </div>
          <div className="relative px-4 pb-4 pt-0 sm:px-5">
            <div className="-mt-8 flex items-end gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl border-4 border-white bg-slate-100 shadow-sm sm:h-[4.5rem] sm:w-[4.5rem]">
                <VendorDirectoryLogoImage
                  logoUrl={profile.logo_url}
                  businessName={businessName}
                  alt=""
                  fallbackClassName="text-lg font-bold text-brand-navy"
                  sizes="(max-width: 640px) 64px, 72px"
                />
              </div>
              <div className="pb-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Preview</p>
                <p className="text-base font-semibold text-brand-navy">{businessName}</p>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-brand-navy">{bioPreview}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {publicHref ? (
            <ButtonLink href={publicHref} variant="secondary">
              View public profile
            </ButtonLink>
          ) : (
            <p className="text-sm text-brand-navy-muted">Save your profile with a public URL slug to preview your live page.</p>
          )}
          <p className="text-xs text-brand-navy-muted sm:ml-auto">Directory and homepage highlights favor complete profiles.</p>
        </div>
      </section>
    </div>
  );
}
