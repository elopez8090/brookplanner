import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "Pricing",
};

const hostTier = {
  name: "Hosts",
  price: "Free",
  blurb: "Post unlimited events. Compare up to four quotes per category. No listing fees.",
  bullets: ["Free", "No obligation", "Compare up to 4 quotes"],
};

const vendorTier = {
  name: "Vendors",
  price: "Join",
  blurb:
    "Discover Brooklyn event opportunities that fit your services, connect with hosts who are actively planning, and compete on a level field—each category welcomes up to four vendors.",
  bullets: [
    "Event opportunities matched to what you offer",
    "Connect with customers planning their celebrations",
    "Fair competition with up to four vendors per category",
  ],
};

export default function PricingPage() {
  return (
    <>
      <PageIntro
        title="Simple, fair pricing"
        description="Free to post your event and compare up to four quotes from Brooklyn vendors. Vendors get a clear path to local opportunities—see the vendor card below."
      />
      <Section className="bg-background">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col border-accent-blue/20 p-8">
              <Badge variant="blue" className="w-fit">
                Customers
              </Badge>
              <h2 className="mt-4 text-2xl font-bold text-brand-navy">{hostTier.name}</h2>
              <p className="mt-2 text-4xl font-bold text-brand-navy">{hostTier.price}</p>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{hostTier.blurb}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-stone-600">
                {hostTier.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-accent-blue">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/post-event" className="mt-8 w-full justify-center sm:w-auto">
                Post an event
              </ButtonLink>
            </Card>
            <Card className="flex flex-col border-accent-coral/25 p-8">
              <Badge variant="coral" className="w-fit">
                Vendors
              </Badge>
              <h2 className="mt-4 text-2xl font-bold text-brand-navy">{vendorTier.name}</h2>
              <p className="mt-2 text-4xl font-bold text-brand-navy">{vendorTier.price}</p>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{vendorTier.blurb}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-stone-600">
                {vendorTier.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-accent-coral">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href="/vendor-signup"
                variant="secondary"
                className="mt-8 w-full justify-center sm:w-auto"
              >
                Become a vendor
              </ButtonLink>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
