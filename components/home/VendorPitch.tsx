import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/ButtonLink";

const bulletColors = ["bg-accent-coral", "bg-emerald-300", "bg-accent-coral"] as const;

export function VendorPitch() {
  return (
    <Section className="border-y border-border-subtle bg-[#003C28] !py-20 text-white sm:!py-24 lg:!py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex flex-col gap-6 lg:pr-2">
            <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-inset ring-white/20">
              For vendors
            </span>
            <h2 className="text-2xl font-bold leading-relaxed tracking-tight sm:text-3xl sm:leading-relaxed">
              Get in front of NYC hosts who are ready to book
            </h2>
            <p className="text-base leading-loose text-white/78">
              Join the marketplace with a polished public profile. Browse active opportunities, submit quotes on events that
              fit your calendar, and grow your pipeline without scattered DM threads.
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/vendor-signup" variant="primary" className="rounded-xl border-0 bg-[#E85D4A] text-white shadow-md hover:bg-accent-coral-hover">
                Become a Vendor
              </ButtonLink>
              <ButtonLink href="/pricing" variant="secondary">
                See pricing
              </ButtonLink>
              <ButtonLink
                href="/vendors"
                variant="secondary"
                className="!rounded-xl !border-2 !border-white !bg-transparent !text-white !shadow-none hover:!border-white hover:!bg-accent-blue/35 hover:!text-white"
              >
                Preview directory
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white p-8 shadow-lg ring-1 ring-black/10">
            <ul className="space-y-5 text-sm">
              <li className="flex gap-4">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${bulletColors[0]}`} aria-hidden />
                <span className="text-slate-600">
                  <strong className="font-semibold text-slate-900">Public profile:</strong> logo, service areas, categories,
                  and social links help hosts understand your brand before they reach out.
                </span>
              </li>
              <li className="flex gap-4">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${bulletColors[1]}`} aria-hidden />
                <span className="text-slate-600">
                  <strong className="font-semibold text-slate-900">Credits for quotes:</strong> pay when you pitch an event —
                  wallet and balances live in your vendor dashboard.
                </span>
              </li>
              <li className="flex gap-4">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${bulletColors[2]}`} aria-hidden />
                <span className="text-slate-600">
                  <strong className="font-semibold text-slate-900">Fair visibility:</strong> each listing caps competing quotes
                  so hosts see a tight shortlist, not an endless inbox.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
