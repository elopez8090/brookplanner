import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { publicVendorDiscoveryPausedCopy } from "@/lib/marketplace/publicVendorDiscovery";

export function PublicVendorDiscoveryHomeCta() {
  const copy = publicVendorDiscoveryPausedCopy;
  return (
    <Section className="border-y border-border-subtle bg-gradient-to-b from-brand-navy/[0.04] to-background">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">{copy.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">{copy.headline}</h2>
          <p className="mt-4 text-sm leading-relaxed text-brand-navy-muted sm:text-base">{copy.body}</p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href={copy.primaryCta.href} className="min-w-[220px] px-6 py-3 text-base">
              {copy.primaryCta.label}
            </ButtonLink>
          </div>
          <p className="mt-5 text-xs text-brand-navy-muted">{copy.secondaryLine}</p>
        </div>
      </Container>
    </Section>
  );
}
