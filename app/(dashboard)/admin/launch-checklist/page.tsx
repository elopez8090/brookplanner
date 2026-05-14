import type { Metadata } from "next";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "Admin · Launch checklist",
};

const envSections = [
  {
    title: "Supabase",
    items: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY (server only)",
      "Migrations applied to the production database",
      "Auth redirect URLs aligned with NEXT_PUBLIC_APP_URL",
    ],
  },
  {
    title: "Stripe",
    items: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "Live webhook → /api/stripe/webhook", "Verify checkout amounts in live mode"],
  },
  {
    title: "Resend & email",
    items: ["RESEND_API_KEY", "EMAIL_FROM (verified sender)", "ADMIN_NOTIFICATION_EMAIL (optional)"],
  },
  {
    title: "Vercel / app",
    items: [
      "NEXT_PUBLIC_APP_URL (canonical production URL)",
      "NEXT_PUBLIC_SITE_URL before production launch (canonical URLs, Open Graph, sitemap origin; see docs/LAUNCH_CHECKLIST.md)",
      "Server-only env vars not exposed to the client",
    ],
  },
] as const;

const manualChecks = [
  "Protected routes: unauthenticated users hit /login; wrong role is sent to the correct workspace.",
  "Public marketplace pages load without a session.",
  "Admin RPCs and admin UI are unreachable to customer and vendor sessions (RLS + role checks).",
  "Vendor quote credits and internal admin notes never appear on customer-facing surfaces.",
  "Stripe webhook deliveries return 2xx after deploy.",
] as const;

const smokeItems = [
  "Home and vendor directory browse (logged out).",
  "Customer journey: post event → quotes → accept or decline.",
  "Vendor journey: lead list → quote → credits purchase (or test mode).",
  "Post-accept messaging for customer and vendor.",
  "Admin overview, revenue, platform health, audit logs, vendors, events.",
] as const;

export default function AdminLaunchChecklistPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Launch checklist</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Phase 33–39 readiness: environment variables, Vercel production setup, webhooks, and smoke tests before real users. The
          authoritative written checklist lives in the repository at{" "}
          <code className="rounded bg-brand-navy/[0.06] px-1.5 py-0.5 text-xs text-brand-navy">docs/LAUNCH_CHECKLIST.md</code>.
        </p>
      </header>

      <DashboardCard
        id="routing-access-model"
        title="Routing + access control"
        description="Phase 33.1 — do not rely on middleware for roles; match new routes to the right segment or explicit server guards."
      >
        <ul className="list-inside list-disc space-y-2 text-sm text-brand-navy-muted">
          <li>
            <code className="text-xs text-brand-navy">middleware.ts</code> only refreshes Supabase session cookies.
          </li>
          <li>
            Admin, customer, and vendor access is enforced in{" "}
            <code className="text-xs text-brand-navy">app/(dashboard)/admin|customer|vendor/layout.tsx</code>. New dashboard pages must stay in the matching segment.
          </li>
          <li>
            Other protected pages must call <code className="text-xs text-brand-navy">requireUser</code> or{" "}
            <code className="text-xs text-brand-navy">requireRole</code> on the server.
          </li>
          <li>
            Marketing stays under <code className="text-xs text-brand-navy">app/(marketing)</code>.
          </li>
          <li>
            <code className="text-xs text-brand-navy">/events/[id]</code> is login-only (quotes and customer-specific context).
          </li>
        </ul>
      </DashboardCard>

      <DashboardCard
        id="admin-quick-links"
        title="Operations shortcuts"
        description="Deep links for launch-day verification."
      >
        <ul className="flex flex-wrap gap-3">
          <li>
            <ButtonLink href="/admin/revenue" variant="secondary" className="justify-center">
              Revenue / Financials
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/platform-health" variant="secondary" className="justify-center">
              Platform health
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/audit-logs" variant="secondary" className="justify-center">
              Audit logs
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/vendors" variant="secondary" className="justify-center">
              Vendors
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/events" variant="secondary" className="justify-center">
              Events
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/admin/dashboard" variant="secondary" className="justify-center">
              Admin overview
            </ButtonLink>
          </li>
        </ul>
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {envSections.map((section) => (
          <DashboardCard key={section.title} title={section.title} description="Configure in Vercel (and Supabase/Stripe dashboards).">
            <ul className="list-inside list-disc space-y-2 text-sm text-brand-navy-muted">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </DashboardCard>
        ))}
      </div>

      <DashboardCard title="Webhooks" description="Stripe sends payment events to the app; the app uses the Supabase service role to record outcomes.">
        <ol className="list-inside list-decimal space-y-2 text-sm text-brand-navy-muted">
          <li>Create a live Stripe webhook pointing at your production origin + /api/stripe/webhook</li>
          <li>Set STRIPE_WEBHOOK_SECRET in Vercel from the signing secret</li>
          <li>Redeploy, then confirm a test delivery shows HTTP 2xx in the Stripe dashboard</li>
        </ol>
      </DashboardCard>

      <DashboardCard title="Manual verification" description="Security and routing checks before broad access.">
        <ul className="list-inside list-disc space-y-2 text-sm text-brand-navy-muted">
          {manualChecks.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </DashboardCard>

      <DashboardCard title="Smoke test checklist" description="Minimal path coverage after deploy.">
        <ul className="list-inside list-disc space-y-2 text-sm text-brand-navy-muted">
          {smokeItems.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </DashboardCard>

      <DashboardCard title="Test accounts" description="Keep dedicated users for each role in your password manager.">
        <p className="text-sm text-brand-navy-muted">
          Prepare at least one <span className="font-medium text-brand-navy">customer</span>, one{" "}
          <span className="font-medium text-brand-navy">vendor</span>, and one tightly controlled{" "}
          <span className="font-medium text-brand-navy">admin</span> account. Run the smoke list above under each role.
        </p>
      </DashboardCard>

      <p className="text-xs text-brand-navy-muted">
        Full tables, Vercel steps, Stripe/Resend production notes, and deployment smoke tests: open{" "}
        <span className="font-mono text-brand-navy">docs/LAUNCH_CHECKLIST.md</span> in your repository checkout.
      </p>
    </div>
  );
}
