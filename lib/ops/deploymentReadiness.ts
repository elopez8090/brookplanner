import "server-only";

export type DeploymentReadinessSnapshot = {
  nodeEnv: string;
  stripeSecretKeySet: boolean;
  stripeWebhookSecretSet: boolean;
  stripeConfigured: boolean;
  resendApiKeySet: boolean;
  emailFromSet: boolean;
  resendConfigured: boolean;
  supabaseUrlSet: boolean;
  supabaseAnonKeySet: boolean;
  supabaseServiceRoleSet: boolean;
  supabaseConfigured: boolean;
  nextPublicSiteUrlSet: boolean;
  nextPublicAppUrlSet: boolean;
};

function isNonEmpty(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

/** Boolean flags only — safe to render on admin diagnostics. */
export function getDeploymentReadinessSnapshot(): DeploymentReadinessSnapshot {
  const stripeSecretKeySet = isNonEmpty(process.env.STRIPE_SECRET_KEY);
  const stripeWebhookSecretSet = isNonEmpty(process.env.STRIPE_WEBHOOK_SECRET);
  return {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    stripeSecretKeySet,
    stripeWebhookSecretSet,
    stripeConfigured: stripeSecretKeySet && stripeWebhookSecretSet,
    resendApiKeySet: isNonEmpty(process.env.RESEND_API_KEY),
    emailFromSet: isNonEmpty(process.env.EMAIL_FROM),
    resendConfigured: isNonEmpty(process.env.RESEND_API_KEY) && isNonEmpty(process.env.EMAIL_FROM),
    supabaseUrlSet: isNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeySet: isNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRoleSet: isNonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseConfigured:
      isNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      isNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      isNonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY),
    nextPublicSiteUrlSet: isNonEmpty(process.env.NEXT_PUBLIC_SITE_URL),
    nextPublicAppUrlSet: isNonEmpty(process.env.NEXT_PUBLIC_APP_URL),
  };
}

/** Public origin for ops copy (Stripe webhooks, etc.). No secrets. */
export function getSuggestedPublicOriginForOps(): {
  origin: string | null;
  source: "app_url" | "site_url" | "vercel" | "none";
} {
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (app) {
    return { origin: app, source: "app_url" };
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (site) {
    return { origin: site, source: "site_url" };
  }
  const v = process.env.VERCEL_URL?.trim();
  if (v) {
    return { origin: `https://${v.replace(/^https?:\/\//, "")}`, source: "vercel" };
  }
  return { origin: null, source: "none" };
}
