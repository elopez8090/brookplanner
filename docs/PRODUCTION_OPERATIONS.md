# Brook Planner — production operations

This document complements `docs/LAUNCH_CHECKLIST.md` with day‑two runbook material: deploy, rollback, webhooks, email, migrations, and smoke tests. Keep secrets out of tickets and chat — use your host’s encrypted env storage (e.g. Vercel) and Supabase / Stripe / Resend dashboards.

## Deployment flow

1. **Merge to the production branch** (e.g. `main`) after CI passes (`npm run lint`, `npm run build`).
2. **Apply database migrations** to the production Supabase project before or in lockstep with the app deploy (see [Migration deployment flow](#migration-deployment-flow)).
3. **Deploy the app** (e.g. Vercel production deployment from `main`).
4. **Verify env vars** on the production environment match what the new build expects (especially new keys or renamed public vars).
5. **Run the [Smoke test after deploy](#smoke-test-after-deploy)** and spot-check **Admin → System status** for integration flags.

## Rollback basics

- **App:** In Vercel (or your host), **Promote a previous successful deployment** to production. This restores the prior server bundle and env snapshot tied to that deployment.
- **Database:** Migrations are not automatically rolled back. Prefer **forward fixes** (a new migration) over destructive rollback. If you must revert schema, restore from a **Supabase backup** or a planned dump — coordinate with a maintenance window.
- **Stripe / webhooks:** Rolling back the app does not change Stripe’s endpoint URL; confirm the old build still handles events you care about, or pause webhooks briefly if versions are incompatible (rare).

## Webhook debugging

1. **Stripe Dashboard → Developers → Webhooks** — select the production endpoint.
2. Confirm the URL is `https://<your-production-origin>/api/stripe/webhook` (same origin you use for live traffic, typically your custom domain).
3. Open **Recent deliveries**: look for **4xx** (signature/metadata — often wrong signing secret or bad metadata) vs **5xx** (server/database — check application logs).
4. **Signing secret:** `STRIPE_WEBHOOK_SECRET` must match the secret for *that* endpoint in the Stripe dashboard. After creating a new endpoint or rotating secrets, **update Vercel env and redeploy**.
5. **Logs:** Server logs use the `[STRIPE]` and `[ERROR]` prefixes for webhook paths (see `lib/logging/serverLog.ts`). Avoid pasting raw request bodies into public channels.

## Stripe troubleshooting

| Symptom | Things to check |
|--------|------------------|
| Checkout never starts | Admin **System status**: `STRIPE_SECRET_KEY` configured? Logs `[STRIPE]` on checkout failures. |
| Webhook 400 | Missing `stripe-signature` header, bad payload, or wrong `STRIPE_WEBHOOK_SECRET`. |
| Webhook 503 | `STRIPE_SECRET_KEY` missing on the server, or Supabase service role env missing for persistence. |
| Credits not applied | Stripe shows `checkout.session.completed` delivered 2xx? DB row in `credit_purchases` for the session? Logs `[STRIPE]` for vendor/profile mismatches. |

Always test **live vs test** keys and webhooks separately; do not point production webhooks at preview URLs unless you intend to.

## Resend troubleshooting

| Symptom | Things to check |
|--------|------------------|
| No email in dev | `RESEND_API_KEY` unset is expected for dry run; see `[EMAIL]` logs. |
| No email in prod | **System status:** `RESEND_API_KEY` and `EMAIL_FROM` both set? `EMAIL_FROM` must be a verified sender/domain in Resend. |
| API errors | Resend dashboard logs; app logs `[EMAIL]` with message only (no recipient addresses in error paths). |

## Migration deployment flow

1. Develop migrations under `supabase/migrations/` locally.
2. **Test** against a staging or local database (`supabase db reset` / push to a non‑prod project).
3. For production: use **Supabase SQL editor / CLI** per your team policy to apply pending migrations in order.
4. Deploy the application commit that assumes the new schema **after** migrations succeed.

## Smoke test after deploy

Run these as a signed‑in user with the right role (or incognito where noted):

- **Public:** home, vendor directory, vendor profile (logged out).
- **Customer:** create or open an event, quote flow, messages if used.
- **Vendor:** dashboard, credits page (checkout redirect in test mode if applicable).
- **Admin:** dashboard, **System status**, platform health, revenue, audit logs.
- **Stripe:** one test webhook delivery or successful test checkout in non‑prod; in prod, a small real transaction only if policy allows.

## Env var update process

1. Edit variables in the **production** environment on the host (e.g. Vercel → Project → Settings → Environment Variables).
2. **Redeploy** so serverless functions pick up new values (changing env alone does not always replay into warm instances immediately).
3. For `NEXT_PUBLIC_*` vars, a redeploy is required for the browser bundle to update.
4. Confirm on **Admin → System status** that toggles match expectations (booleans only — no secret display).

## Internal diagnostics

**Admin → System status** (`/admin/system-status`) is **admin‑only** (enforced by `app/(dashboard)/admin/layout.tsx`). It shows configuration booleans and suggested webhook URLs — never paste API keys into support threads; use the dashboards to rotate and verify.
