import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MVP_CATEGORIES } from "@/lib/constants";
import { vendorCategoryHubPath } from "@/lib/marketplace/vendorCategoryPages";

export const metadata: Metadata = {
  title: "Categories",
};

export default function CategoriesPage() {
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
                <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-600">
                  {cat.blurb}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-stone-400">
                  Brooklyn vendors
                </p>
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
