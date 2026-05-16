import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { publicVendorDiscoveryPausedCopy } from "@/lib/marketplace/publicVendorDiscovery";

type PublicVendorDiscoveryPausedPanelProps = {
  className?: string;
  /** Optional page-specific title (SEO pages keep metadata; body can name the hub). */
  title?: string;
};

export function PublicVendorDiscoveryPausedPanel({ className = "", title }: PublicVendorDiscoveryPausedPanelProps) {
  const copy = publicVendorDiscoveryPausedCopy;
  return (
    <Container className={`py-10 sm:py-14 ${className}`.trim()}>
      <div className="mx-auto max-w-2xl rounded-2xl border border-border-subtle bg-white p-8 text-center shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">{copy.eyebrow}</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">{title ?? copy.headline}</h1>
        <p className="mt-4 text-sm leading-relaxed text-brand-navy-muted sm:text-base">{copy.body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href={copy.primaryCta.href} className="min-w-[200px] px-6 py-3 text-base">
            {copy.primaryCta.label}
          </ButtonLink>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-brand-navy-muted">{copy.secondaryLine}</p>
      </div>
    </Container>
  );
}
