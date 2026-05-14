"use client";

type DashboardTopbarProps = {
  title: string;
  subtitle?: string;
  onMenu: () => void;
  badge?: string;
};

export function DashboardTopbar({ title, subtitle, onMenu, badge }: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-card/95 shadow-[0_2px_16px_rgba(0,60,40,0.07)] backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle text-brand-navy shadow-sm transition-colors duration-200 ease-out hover:bg-brand-navy/[0.05] lg:hidden"
            aria-label="Open sidebar"
            onClick={onMenu}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight text-brand-navy sm:text-xl">
                {title}
              </h1>
              {badge ? (
                <span className="hidden rounded-full bg-brand-navy/[0.08] px-2.5 py-0.5 text-xs font-semibold text-brand-navy-muted ring-1 ring-inset ring-brand-navy/10 sm:inline">
                  {badge}
                </span>
              ) : null}
            </div>
            {subtitle ? <p className="truncate text-sm text-brand-navy-muted">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-card text-xs font-semibold text-brand-navy-muted shadow-sm sm:flex"
            title="Notifications (placeholder)"
          >
            BP
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent-coral ring-2 ring-white" />
          </span>
        </div>
      </div>
    </header>
  );
}
