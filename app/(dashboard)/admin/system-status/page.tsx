import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getDeploymentReadinessSnapshot, getSuggestedPublicOriginForOps } from "@/lib/ops/deploymentReadiness";

export const metadata: Metadata = {
  title: "Admin · System status",
};

function yesNo(ok: boolean): ReactNode {
  return (
    <StatusBadge tone={ok ? "success" : "warning"}>{ok ? "Configured" : "Not set"}</StatusBadge>
  );
}

export default function AdminSystemStatusPage() {
  const snap = getDeploymentReadinessSnapshot();
  const { origin, source } = getSuggestedPublicOriginForOps();
  const stripeWebhookUrl = origin ? `${origin}/api/stripe/webhook` : null;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Admin</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">System status</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Phase 41 diagnostics for production readiness. Values are boolean flags and public URL hints only — no API
          keys, tokens, or message bodies are shown here.
        </p>
      </header>

      <DashboardCard
        title="Environment"
        description="Runtime and high-level readiness (admin-only page; still avoid sharing screenshots publicly)."
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-navy/[0.04] px-3 py-2">
            <dt className="text-brand-navy-muted">NODE_ENV</dt>
            <dd className="font-medium text-brand-navy">{snap.nodeEnv}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-navy/[0.04] px-3 py-2">
            <dt className="text-brand-navy-muted">Supabase (URL + anon + service role)</dt>
            <dd>{yesNo(snap.supabaseConfigured)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-navy/[0.04] px-3 py-2">
            <dt className="text-brand-navy-muted">Stripe (secret + webhook signing secret)</dt>
            <dd>{yesNo(snap.stripeConfigured)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-navy/[0.04] px-3 py-2">
            <dt className="text-brand-navy-muted">Resend (API key + EMAIL_FROM)</dt>
            <dd>{yesNo(snap.resendConfigured)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-navy/[0.04] px-3 py-2">
            <dt className="text-brand-navy-muted">NEXT_PUBLIC_APP_URL</dt>
            <dd>{yesNo(snap.nextPublicAppUrlSet)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-navy/[0.04] px-3 py-2">
            <dt className="text-brand-navy-muted">NEXT_PUBLIC_SITE_URL</dt>
            <dd>{yesNo(snap.nextPublicSiteUrlSet)}</dd>
          </div>
        </dl>
      </DashboardCard>

      <DashboardCard
        title="Integration detail (flags only)"
        description="Finer-grained checks for support — still no secret values."
      >
        <ul className="space-y-2 text-sm text-brand-navy-muted">
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>NEXT_PUBLIC_SUPABASE_URL</span>
            {yesNo(snap.supabaseUrlSet)}
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
            {yesNo(snap.supabaseAnonKeySet)}
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>SUPABASE_SERVICE_ROLE_KEY</span>
            {yesNo(snap.supabaseServiceRoleSet)}
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>STRIPE_SECRET_KEY</span>
            {yesNo(snap.stripeSecretKeySet)}
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>STRIPE_WEBHOOK_SECRET</span>
            {yesNo(snap.stripeWebhookSecretSet)}
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>RESEND_API_KEY</span>
            {yesNo(snap.resendApiKeySet)}
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>EMAIL_FROM</span>
            {yesNo(snap.emailFromSet)}
          </li>
        </ul>
      </DashboardCard>

      <DashboardCard
        title="Webhook URL checklist"
        description="Stripe must deliver checkout events to your deployed app. Use the live signing secret in production."
      >
        <ul className="list-inside list-disc space-y-2 text-sm text-brand-navy-muted">
          <li>
            Endpoint path: <code className="text-xs text-brand-navy">POST /api/stripe/webhook</code>
          </li>
          <li>
            Suggested full URL (from{" "}
            {source === "app_url"
              ? "NEXT_PUBLIC_APP_URL"
              : source === "site_url"
                ? "NEXT_PUBLIC_SITE_URL"
                : source === "vercel"
                  ? "VERCEL_URL (preview-style host)"
                  : "fallback"}
            ):
            {stripeWebhookUrl ? (
              <code className="mt-1 block break-all rounded bg-brand-navy/[0.06] px-2 py-1 text-xs text-brand-navy">
                {stripeWebhookUrl}
              </code>
            ) : (
              <span className="mt-1 block text-brand-navy">
                Set <code className="text-xs">NEXT_PUBLIC_APP_URL</code> (preferred) or{" "}
                <code className="text-xs">NEXT_PUBLIC_SITE_URL</code> to preview the full URL.
              </span>
            )}
          </li>
          <li>Stripe Dashboard → Developers → Webhooks: confirm recent deliveries return HTTP 2xx.</li>
          <li>After rotating secrets, redeploy so the server sees the new env vars.</li>
        </ul>
      </DashboardCard>

      <DashboardCard title="Recent deployment notes" description="Static summary — update in-repo when you cut releases.">
        <ul className="list-inside list-disc space-y-2 text-sm text-brand-navy-muted">
          <li>Phase 41 added production-safe server logging tags and this admin-only diagnostics page.</li>
          <li>Stripe client initialization is lazy: missing STRIPE_SECRET_KEY no longer throws at module load.</li>
          <li>Operational runbook: see docs/PRODUCTION_OPERATIONS.md.</li>
        </ul>
      </DashboardCard>
    </div>
  );
}
