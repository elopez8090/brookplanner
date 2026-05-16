import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { MVP_CATEGORIES } from "@/lib/constants";
import { vendorCategoryHubPath } from "@/lib/marketplace/vendorCategoryPages";
import { isPublicVendorDiscoveryEnabled, publicVendorDiscoveryPausedCopy } from "@/lib/marketplace/publicVendorDiscovery";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Categories",
};

export default function CategoriesPage() {
  const discoveryEnabled = isPublicVendorDiscoveryEnabled();

  if (!discoveryEnabled) {
    const copy = publicVendorDiscoveryPausedCopy;
    return (
      <>
        <PageIntro title="Event services" description={copy.body} />
        <Section className="bg-background">
          <Container>
            <div className="mx-auto max-w-2xl rounded-2xl border border-border-subtle bg-white p-8 text-center shadow-[var(--shadow-card)]">
              <p className="text-sm font-semibold text-brand-navy">{copy.headline}</p>
              <ButtonLink href={copy.primaryCta.href} className="mt-6">
                {copy.primaryCta.label}
              </ButtonLink>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MVP_CATEGORIES.map((cat) => (
                <Card key={cat.slug} className="flex flex-col">
                  <h2 className="text-lg font-semibold text-brand-navy">{cat.name}</h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-600">{cat.blurb}</p>
                  <p className="mt-4 text-xs text-brand-navy-muted">Include this category when you post your event.</p>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageIntro
        title="Browse categories"
        description="Core services for Brooklyn events. Up to four vendors can submit quotes per category so you can compare without noise."
      />
      <Section className="bg-background">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MVP_CATEGORIES.map((cat) => (
              <Card key={cat.slug} hover className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-brand-navy">{cat.name}</h2>
                  <Badge variant="navy">Max 4 quotes</Badge>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-600">{cat.blurb}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-stone-400">Brooklyn vendors</p>
                <Link
                  href={vendorCategoryHubPath(cat.slug)}
                  className="mt-4 inline-flex text-sm font-semibold text-accent-blue transition-colors hover:text-brand-navy hover:underline"
                >
                  Browse {cat.name} →
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
