import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function FinalCta() {
  return (
    <div className="border-t border-border-subtle bg-background py-20 sm:py-24 lg:py-28">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl bg-[#E85D4A] p-8 text-center text-white shadow-lg sm:p-10 lg:p-12">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Ready to compare NYC vendor quotes?</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/95 sm:mt-6">
            Post your event brief, browse vendor profiles, and collect structured proposals — built for hosts planning real
            gatherings across the city.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:mt-12 sm:flex-row sm:gap-4">
            <ButtonLink
              href="/post-event"
              variant="secondary"
              className="min-w-[200px] border-0 bg-white text-[#003C28] shadow-md hover:bg-stone-100 hover:text-[#003C28]"
            >
              Post Your Event
            </ButtonLink>
            <Link
              href="/vendors"
              className="inline-flex min-w-[160px] items-center justify-center rounded-xl border-2 border-white bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-white/10"
            >
              Browse vendors
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
