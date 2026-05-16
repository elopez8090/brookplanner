import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { isPublicVendorDiscoveryEnabled } from "@/lib/marketplace/publicVendorDiscovery";

const itemsWhenDiscoveryEnabled = [
  {
    title: "Structured marketplace",
    body: "Browse vendor profiles with logos, service areas, and categories — vendors respond with quotes and you pick who fits.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    title: "Clear quote caps",
    body: "Each service category accepts up to four vendor quotes so comparisons stay focused and easy to scan.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "No obligation to book",
    body: "Posting is free for hosts. Review proposals when you are ready — move forward only with vendors you trust.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const itemsWhenDiscoveryPaused = [
  {
    title: "Post once, get matched",
    body: "Vendors are matched after you post your event. Share your date, neighborhood, and services — qualified NYC vendors respond with quotes.",
    icon: itemsWhenDiscoveryEnabled[0].icon,
  },
  itemsWhenDiscoveryEnabled[1],
  itemsWhenDiscoveryEnabled[2],
];

export function TrustBullets() {
  const items = isPublicVendorDiscoveryEnabled() ? itemsWhenDiscoveryEnabled : itemsWhenDiscoveryPaused;
  return (
    <Section className="border-t border-border-subtle bg-white">
      <Container>
        <div className="grid gap-6 sm:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl border border-border-subtle bg-card p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-navy/[0.06] text-brand-navy">
                {item.icon}
              </div>
              <div>
                <h2 className="font-semibold text-brand-navy">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-brand-navy-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
