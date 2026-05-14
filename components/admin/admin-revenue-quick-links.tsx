import Link from "next/link";

const LINKS = [
  {
    href: "/admin/credits",
    title: "Manage credits",
    description: "Promotional, bonus, correction, and refund adjustments with audit history.",
  },
  {
    href: "/admin/vendors",
    title: "View vendors",
    description: "Directory profiles, visibility, credit balances, and marketplace status.",
  },
  {
    href: "/admin/analytics",
    title: "View analytics",
    description: "Customers, vendors, events, quotes, and high-level credit totals.",
  },
] as const;

export function AdminRevenueQuickLinks() {
  return (
    <section aria-labelledby="revenue-quick-links-heading" className="space-y-3">
      <h3 id="revenue-quick-links-heading" className="text-sm font-semibold text-brand-navy">
        Quick actions
      </h3>
      <ul className="grid gap-4 sm:grid-cols-3">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex h-full flex-col gap-1 rounded-xl border border-border-subtle bg-card p-4 shadow-sm ring-1 ring-transparent transition hover:border-accent-blue/40 hover:ring-accent-blue/15"
            >
              <span className="text-sm font-semibold text-brand-navy">{item.title}</span>
              <span className="text-xs leading-relaxed text-brand-navy-muted">{item.description}</span>
              <span className="mt-auto pt-2 text-xs font-semibold text-accent-blue">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
