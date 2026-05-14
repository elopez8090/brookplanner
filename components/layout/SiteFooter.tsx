import Link from "next/link";
import { FOOTER_LEGAL_LINKS, FOOTER_LINKS } from "@/lib/constants";
import { Container } from "@/components/ui/Container";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border-subtle bg-card">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="text-lg font-bold text-brand-navy">Brook Planner</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">
              Plan Brooklyn events with less guesswork. Free to post, get quotes from local vendors, and compare up to
              four quotes per service—built for New York hosts.
            </p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-stone-500">
              Brooklyn, NY
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Explore
              </p>
              <ul className="mt-4 space-y-2">
                {FOOTER_LINKS.slice(0, 4).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-600 transition-colors duration-200 ease-out hover:text-brand-navy"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Account
              </p>
              <ul className="mt-4 space-y-2">
                {FOOTER_LINKS.slice(4).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-600 transition-colors duration-200 ease-out hover:text-brand-navy"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border-subtle pt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} Brook Planner. Brooklyn event planning.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-stone-600 transition-colors duration-200 ease-out hover:text-brand-navy"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-stone-500 sm:ml-auto sm:text-right">
            UI preview — data and payments are not connected yet.
          </p>
        </div>
      </Container>
    </footer>
  );
}
