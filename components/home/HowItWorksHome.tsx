import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";

const steps = [
  {
    step: "01",
    title: "Post Your Event",
    body: "Share your date, neighborhood, headcount, budget range, and which vendor categories you need — hosts post free.",
  },
  {
    step: "02",
    title: "Receive Vendor Quotes",
    body: "Qualified NYC-area vendors review your brief and respond with clear proposals you can compare in one place.",
  },
  {
    step: "03",
    title: "Hire Your Favorite Vendor",
    body: "Message, clarify scope, and book when it feels right — you stay in control from brief to signature.",
  },
];

export function HowItWorksHome() {
  return (
    <Section className="border-t border-border-subtle bg-[#f5f7f4]">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="navy" className="mb-3">
            How it works
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">The marketplace flow</h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-navy-muted sm:text-base">
            Built for busy hosts planning real events across NYC — fewer blind outreach threads, more structured choices.
          </p>
        </div>
        <ol className="mt-14 grid gap-6 lg:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.step}
              className="relative rounded-2xl border border-border-subtle bg-card p-8 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03]"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-accent-coral">{s.step}</span>
              <h3 className="mt-3 text-lg font-semibold text-brand-navy">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-navy-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
