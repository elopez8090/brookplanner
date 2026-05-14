import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "How It Works",
};

const customerSteps = [
  {
    title: "Post your event",
    body: "Add your date, neighborhood, guest count, and the services you need. Free to post.",
  },
  {
    title: "Get quotes from Brooklyn vendors",
    body: "Local vendors review your brief and submit proposals. Compare up to 4 quotes per service so you can decide with confidence.",
  },
  {
    title: "Pick your partner",
    body: "Compare pricing, portfolios, and reviews. Reach out and book your favorite—no obligation until you say yes.",
  },
];

const vendorSteps = [
  {
    title: "See live opportunities",
    body: "Browse events across Brooklyn that match your services and availability.",
  },
  {
    title: "Submit quotes to customers",
    body: "When a brief fits your work, send a proposal with pricing and anything hosts need to decide. You connect with people who are actively planning their event.",
  },
  {
    title: "Win transparently",
    body: "Up to four vendors may quote per category on each event—fair competition, same rules for everyone. Clear pricing and a thoughtful proposal help you stand out.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        title="How Brook Planner works"
        description="A simple flow for hosts: free to post, compare up to 4 quotes, then book when you are ready. Vendors get their own workspace to respond."
      />
      <Section dense className="bg-background">
        <Container>
          <h2 className="text-xl font-bold text-brand-navy sm:text-2xl">For customers</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {customerSteps.map((s, i) => (
              <Card key={s.title} className="relative pt-10">
                <span className="absolute left-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-accent-coral/15 text-sm font-bold text-accent-coral">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold text-brand-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
      <Section dense className="bg-card/40">
        <Container>
          <h2 className="text-xl font-bold text-brand-navy sm:text-2xl">For vendors</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {vendorSteps.map((s, i) => (
              <Card key={s.title} className="relative pt-10">
                <span className="absolute left-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/15 text-sm font-bold text-accent-blue">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold text-brand-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/post-event">Post an event</ButtonLink>
            <ButtonLink href="/vendor-signup" variant="secondary">
              Vendor signup
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
