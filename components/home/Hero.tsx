import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

const marketplaceTiles = [
  { label: "DJs & audio", tone: "from-accent-coral/25 to-accent-coral/5" },
  { label: "Photo & video", tone: "from-accent-blue/30 to-brand-navy/10" },
  { label: "Food & beverage", tone: "from-emerald-400/25 to-emerald-700/10" },
  { label: "Venues & rentals", tone: "from-amber-300/35 to-amber-700/12" },
] as const;

function HeroMarketplaceIllustration() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[1.35rem] border border-border-subtle bg-white/90 p-6 shadow-[var(--shadow-hero-preview)] backdrop-blur-sm sm:p-8"
      aria-hidden
    >
      <div className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rounded-full bg-accent-coral/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-6 h-36 w-36 rounded-full bg-accent-blue/18 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-navy-muted">Marketplace</p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight text-brand-navy">NYC event vendors</p>
        </div>
        <span className="shrink-0 rounded-full border border-border-subtle bg-brand-navy/[0.06] px-3 py-1 text-[11px] font-semibold text-brand-navy">
          One workspace
        </span>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3">
        {marketplaceTiles.map((tile) => (
          <div
            key={tile.label}
            className={`rounded-xl border border-border-subtle bg-gradient-to-br ${tile.tone} px-3 py-4 shadow-sm ring-1 ring-black/[0.03]`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-navy/90">{tile.label}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/70">
              <div className="h-full w-2/3 rounded-full bg-brand-navy/25" />
            </div>
          </div>
        ))}
      </div>

      <p className="relative mt-6 text-center text-xs leading-relaxed text-brand-navy-muted">
        Post once — vendors come to you with structured proposals.
      </p>

      <div className="relative mt-5 flex flex-wrap justify-center gap-2 border-t border-border-subtle pt-5">
        <span className="rounded-full bg-brand-navy/[0.06] px-2.5 py-1 text-[11px] font-medium text-brand-navy">
          Built for NYC hosts
        </span>
        <span className="rounded-full bg-brand-navy/[0.06] px-2.5 py-1 text-[11px] font-medium text-brand-navy">
          Clear quote caps
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <div className="relative overflow-hidden border-b border-border-subtle bg-gradient-to-br from-brand-navy/[0.045] via-[#eef1ec] to-background">
      <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-accent-coral/16 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent-blue/14 blur-3xl" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-[28%] h-[30rem] w-[min(100%,56rem)] -translate-x-1/2 rounded-full bg-brand-navy/[0.035] blur-3xl"
        aria-hidden
      />

      <Container className="relative py-16 sm:py-24 lg:py-[7rem]">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 xl:gap-20">
          <div className="min-w-0 max-w-3xl lg:max-w-none">
            <Badge variant="navy" className="mb-5">
              NYC · Verified vendor profiles
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-[#00291C] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.09] xl:leading-[1.12]">
              Book The Right NYC Event Vendors Without The Stress
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-stone-700 sm:text-xl xl:leading-[1.65]">
              Compare trusted DJs, photographers, caterers, venues, and party vendors — all in one place.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <ButtonLink
                href="/post-event"
                variant="primary"
                className="sm:min-w-[200px] bg-[#E85D4A] px-6 py-3 text-base shadow-md ring-1 ring-accent-coral/25 hover:bg-[#d14f3f] hover:shadow-lg"
              >
                Post Your Event
              </ButtonLink>
              <ButtonLink
                href="/vendors"
                variant="secondary"
                className="sm:min-w-[200px] border-stone-300/95 px-6 py-3 text-base text-brand-navy shadow-sm hover:bg-stone-50"
              >
                Browse Vendors
              </ButtonLink>
            </div>

            <p className="mt-8 text-sm leading-relaxed text-stone-600">
              Free to post your brief. Review proposals on your timeline — no obligation until you choose to move
              forward.
            </p>

            <p className="mt-6 text-sm text-brand-navy-muted">
              Planning an event in Brooklyn or across NYC?{" "}
              <Link
                href="/vendor-signup"
                className="font-semibold text-accent-blue underline-offset-4 transition-colors hover:text-brand-navy hover:underline"
              >
                Vendors can join the marketplace here.
              </Link>
            </p>
          </div>

          <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
            <HeroMarketplaceIllustration />
          </div>
        </div>
      </Container>
    </div>
  );
}
