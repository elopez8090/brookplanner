# Brook Planner — production launch checklist

Use this list before pointing a custom domain at production or inviting a broad audience. Treat secrets as sensitive: configure them only in Supabase, Vercel, and Stripe dashboards (never commit real values).

## Environment variables (verified in codebase)

Use this as the single inventory when creating Vercel environments. Names must match exactly.

| Variable | Vercel environment | Client (browser) | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Yes | Supabase project URL (`lib/supabase/*`, middleware). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Yes | Public anon key; RLS must protect data. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview (if you test webhooks there), Development | **No** — server only | Stripe webhook and vendor credit checkout (`app/api/stripe/webhook`, `app/api/vendor/credits/checkout`, `lib/supabase/service-role.ts`). Never prefix with `NEXT_PUBLIC_`. |
| `STRIPE_SECRET_KEY` | Production, Preview (test key for previews), Development | **No** | `lib/stripe.ts` — live key on Production only. |
| `STRIPE_WEBHOOK_SECRET` | Production (and Preview if you register a preview webhook) | **No** | Signing secret for `POST /api/stripe/webhook` — **one secret per endpoint**; test and live dashboards each have their own. |
| `RESEND_API_KEY` | Production, Preview, Development | **No** | `lib/email/sendEmail.ts`. |
| `EMAIL_FROM` | Production, Preview, Development | **No** | Verified sender string for Resend (same file). |
| `NEXT_PUBLIC_APP_URL` | Production (required for credit checkout in prod); Preview recommended | Yes | **App origin** for Stripe success/cancel URLs, transactional email links (`getPublicAppBaseUrl` / `absoluteUrl` in `lib/email/sendEmail.ts`). Use your real public origin in Production, e.g. `https://brookplanner.com` (no trailing slash). |
| `NEXT_PUBLIC_SITE_URL` | Production (set before launch); Preview optional | Yes | **SEO / metadata origin** via `getSiteUrl()` in `lib/site.ts`: root `metadataBase`, vendor listing `alternates.canonical`, Open Graph `url`, and every `loc` in `/sitemap.xml`. Should match your public marketing domain. If unset, Vercel falls back to `https://$VERCEL_URL` (often a `*.vercel.app` host — wrong for public SEO). |
| `ADMIN_NOTIFICATION_EMAIL` | Production (optional) | **No** | Internal notifications (e.g. new vendor signup) in `lib/email/notifyMarketplace.ts`. |

**Practical split:** In Production, set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` to the **same** canonical HTTPS origin (your primary custom domain) unless you deliberately run the “app” and “marketing site” on different hosts (not the default for this repo).

## Vercel — step-by-step production setup

1. **Import the repo**  
   Vercel Dashboard → Add New → Project → import the Git repository. Root directory should be the Next.js app root (repository root if `package.json` is at the top level).

2. **Framework**  
   Preset: **Next.js**. Build command: `npm run build` (default). Install command: `npm install` (default). Output: managed by Next (no static export unless you change the project).

3. **Node version**  
   Align with `package.json` `engines` / team standard. Project Settings → General → Node.js Version.

4. **Production environment variables**  
   Settings → Environment Variables → scope **Production**. Add every row from the table above that applies (all server secrets only under Production unless you use Preview with real services).  
   - Use **Sensitive** for secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`).  
   - Do **not** enable “Expose to browser” for server-only keys (Vercel does not expose non-`NEXT_PUBLIC_` vars to the client by default — keep it that way).

5. **Preview / Development (optional but recommended)**  
   Duplicate **test** Stripe keys and a **non-production** Supabase project (or same project with care) into **Preview** / **Development** scopes so PR previews do not call live payments. If Preview uses a different Supabase project, point preview env vars at that project.

6. **Deploy**  
   Merge to the production branch (usually `main`) or trigger Deploy. After **any** change to env vars, trigger a **redeploy** so serverless functions pick up new values.

7. **Custom domain**  
   Settings → Domains → add apex and `www` as needed; set the primary domain you want users and Google to see. Then set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` to that **https** origin and redeploy again.

8. **Supabase + Stripe dashboards**  
   Complete URL configuration in Supabase (below) and register the **live** Stripe webhook URL on the **production** domain (below).

## Supabase

| Variable / item | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (and local `.env.local`) | Project URL from Supabase Settings → API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Public anon key; safe for browser with RLS enforced. |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only (server) | **Never** expose to the client. Used by API routes (Stripe webhook, credit checkout). |
| Database migrations | Supabase SQL / CLI | Apply all migrations from `supabase/migrations/` to the production project. |
| Auth URLs | Supabase → Authentication → **URL Configuration** | See **Supabase Auth redirect URLs** below. |
| Email templates (optional) | Supabase Auth | Confirm magic-link / reset copy matches your brand if you use Supabase-hosted emails. |

### Supabase Auth redirect URLs

Confirm in **Authentication → URL Configuration**:

- **Site URL** — Set to your production canonical origin (same as `NEXT_PUBLIC_APP_URL` in almost all cases), e.g. `https://brookplanner.com`. This is the default redirect target for auth flows and email links.
- **Redirect URLs** — Add every origin users may return to after magic links, OAuth, or email confirmation, for example:  
  - `https://brookplanner.com/**` or explicit paths such as `https://brookplanner.com/login`, `https://brookplanner.com/register` (match what Supabase allows; wildcards depend on your Supabase project settings).  
  - Preview deployments if you use Supabase auth on previews: `https://*.vercel.app/**` (only if your security model allows it) **or** omit previews and test auth only on a fixed staging host.  
  - Local development: `http://localhost:3000/**` (or your dev port).

If the Site URL or redirect allowlist does not include the origin the user is on, Supabase will reject or mis-route callbacks after sign-in or email confirmation.

## Stripe

| Variable / item | Where | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Vercel (server) | Live secret key for production. |
| `STRIPE_WEBHOOK_SECRET` | Vercel | Signing secret for the production webhook endpoint (see Webhooks below). |
| Products / prices | Stripe Dashboard | Credit checkout uses inline `price_data` in code; confirm USD amounts match business intent for live mode. |
| Test mode vs live | Stripe | Complete a full live-mode test purchase on a staging domain before launch. |

## Resend (transactional email)

| Variable / item | Where | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | Vercel (server) | Required for sending mail via Resend. |
| `EMAIL_FROM` | Vercel | Verified sender domain/address in Resend (see below). |
| `NEXT_PUBLIC_APP_URL` | Vercel | Used in transactional email deep links (`lib/email/sendEmail.ts`). |
| `ADMIN_NOTIFICATION_EMAIL` | Vercel (optional) | If set, used for internal notifications (e.g. new vendor signup). |

### Resend — domain and authentication

1. In the [Resend dashboard](https://resend.com/), add your sending **domain** and complete DNS: Resend will provide **SPF** and **DKIM** (and related) records for your DNS host. Propagation can take a short time; sending from the domain is blocked until verification succeeds.
2. Set `EMAIL_FROM` to an address on that verified domain, e.g. `Brook Planner <hello@yourdomain.com>` (must match what Resend allows for the verified domain).
3. Use a **production** API key in Vercel Production. Keep test keys scoped to Preview/Development if you use separate Resend environments.
4. If `RESEND_API_KEY` or `EMAIL_FROM` is missing, the app logs and skips sending rather than throwing in most paths — verify in staging with a real send so you do not discover a misconfiguration at launch.

## App / Vercel

| Variable / item | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Vercel | Production origin with scheme, e.g. `https://brookplanner.com`. Used for Stripe success/cancel URLs and email links. |
| `NEXT_PUBLIC_SITE_URL` | Vercel | **SEO + sitemap origin:** same style of URL as `NEXT_PUBLIC_APP_URL` unless you have a rare split-domain setup. Read by `getSiteUrl()` in `lib/site.ts` to build **canonical** `alternates`, **Open Graph** absolute URLs, root `metadataBase` in `app/layout.tsx`, and every **`loc`** in `/sitemap.xml`. If unset, production falls back to `VERCEL_URL` (the `*.vercel.app` host), which is usually wrong for public metadata—**set this before launch** on the primary custom domain. |
| Node / Next version | Vercel project | Match local `package.json` engines or CI expectations. |
| Build command | Vercel | `npm run build` (default is fine if repo root is the app). |
| Environment scope | Vercel | Mark server-only vars as not exposed to Edge/browser. |

### Canonical URLs, `metadataBase`, and sitemap (production)

Confirmed wiring in this repo:

- **`app/layout.tsx`** sets `metadataBase: new URL(getSiteUrl())` so default Open Graph / Twitter resolution uses the configured public origin.
- **Vendor marketing routes** (`app/(marketing)/vendors/...`) set `alternates.canonical` and OG `url` via `absoluteUrl(...)` from **`lib/site.ts`** (not the email module).
- **`app/sitemap.ts`** builds all entries with `const base = getSiteUrl()` from **`lib/site.ts`**.

**Action:** In Vercel Production, set `NEXT_PUBLIC_SITE_URL` to your live public HTTPS origin, redeploy, then open `/sitemap.xml` and “View source” on a vendor page and confirm URLs use that host—not `*.vercel.app`—unless you intentionally have not attached a custom domain yet.

## Routing + Access Control Model

When adding routes, follow this model so dashboard pages do not ship without role checks.

- **`middleware.ts`** only refreshes Supabase session cookies. It does not enforce admin/customer/vendor roles or “logged in for dashboard” rules beyond what those layouts and pages do.
- **Role protection** runs in the dashboard segment layouts:
  - `app/(dashboard)/admin/layout.tsx`
  - `app/(dashboard)/customer/layout.tsx`
  - `app/(dashboard)/vendor/layout.tsx`
- **New dashboard routes** for a given role must live under that role’s segment (e.g. admin pages under `app/(dashboard)/admin/...`) so they inherit the correct layout.
- **Standalone protected pages** (not under those segment layouts) must call `requireUser` or `requireRole` from server code so they stay gated.
- **Public marketing** pages belong under `app/(marketing)`.
- **`/events/[id]`** requires a logged-in user because it surfaces quote and customer-specific context.

## Webhook setup

### Stripe → Brook Planner (production)

Implementation: `app/api/stripe/webhook/route.ts` (Node.js runtime).

1. **Stripe Dashboard → Developers → Webhooks** (toggle **Live mode** for production).
2. **Add endpoint** — URL: `https://<your-production-domain>/api/stripe/webhook` (must be the same host users complete checkout on if you rely on session metadata; use HTTPS).
3. **Events to send** — The handler only processes **`checkout.session.completed`**. Selecting only that event reduces noise and surface area; you may add others later if code is extended.
4. After saving, open the endpoint → **Signing secret** → copy the `whsec_...` value into Vercel Production as `STRIPE_WEBHOOK_SECRET`.
5. **Redeploy** the Vercel project so the new secret is available to the function.
6. **Verify** — Stripe Dashboard → Webhooks → your endpoint → **Send test event** or complete a small real checkout; response should be **2xx**. Mismatched secrets produce **400** with an invalid signature error.

**Important:** Test mode and live mode each have their own webhook endpoints and signing secrets. Preview deployments on `*.vercel.app` need a **separate** Stripe webhook (test mode) pointing at `https://<preview-host>/api/stripe/webhook` and a matching `STRIPE_WEBHOOK_SECRET` in the **Preview** environment — or only test checkouts against Production with test cards in Stripe test mode on a dedicated staging URL, depending on your process.

### Supabase

- No Stripe webhook goes to Supabase directly; the app uses the service role to write ledger rows. Ensure `SUPABASE_SERVICE_ROLE_KEY` is present wherever the webhook route runs.

### Smoke the loop

- Use Stripe test mode on a preview deployment first, then one small live transaction after DNS cutover.

## Test accounts (recommended)

Create **separate** users in production (or a staging project) for:

| Role | Purpose |
| --- | --- |
| Customer | Post event, receive quotes, accept/decline, messaging. |
| Vendor | Browse leads, submit quote (credits), purchase credits, messaging. |
| Admin | Admin console, credits, revenue, audit logs (use a tightly controlled account). |

Document passwords in your team password manager only — not in git.

## Deployment smoke test checklist

Run immediately after the **first** successful production deploy (or after any env / domain / webhook change).

**Infra / config**

- [ ] Vercel deployment **Ready**; no build errors; production URL loads `/`.
- [ ] `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` match the browser origin you expect users to use (custom domain, not accidental `*.vercel.app` for public links).
- [ ] `/sitemap.xml` lists URLs on the intended public host.
- [ ] Stripe **live** webhook shows a recent **2xx** delivery (or send test event) for `/api/stripe/webhook`.
- [ ] Resend domain verified; send one real transactional email and confirm inbox + link targets.

**Application (by role)**

- [ ] Marketing home, `/vendors`, vendor profile slug pages, categories load without auth.
- [ ] Login and registration flows; wrong role visiting `/customer/...`, `/vendor/...`, or `/admin/...` redirects to the correct dashboard.
- [ ] Customer: post-event flow, dashboard, event detail, compare page (`/events/[id]`), messages.
- [ ] Vendor: dashboard, leads, event opportunity page, credits purchase (or test mode), messages.
- [ ] Admin: dashboard metrics load, vendors/customers/events lists, revenue page, platform health, audit logs.
- [ ] Suspended account hits `/account-suspended` as expected.
- [ ] Outbound email sends (signup or notification path you use) with correct `FROM` and links.

## SEO smoke test (public routes)

After deploy, hit these paths on the **production** host (replace the origin with your live domain, e.g. `https://brookplanner.com`). Expect **200**, correct metadata in “View source” / devtools, and no redirect to login for directory pages.

- [ ] `/vendors`
- [ ] `/vendors/djs`
- [ ] `/vendors/djs/brooklyn`
- [ ] `/vendors/djs/brooklyn/williamsburg`
- [ ] `/vendors/<vendor-slug>` — use a known live vendor profile slug (not a reserved category slug such as `djs` or `venues`).
- [ ] `/sitemap.xml` — URLs use your intended public origin (see `NEXT_PUBLIC_SITE_URL` above).

## Sitemap QA (`/sitemap.xml`)

Confirm generation matches intent (see `app/sitemap.ts`):

- [ ] **No private or app URLs** — entries must not include dashboard or auth paths (e.g. `/admin`, `/customer`, `/vendor`, `/login`, `/register`, `/events/` with ids, account-only pages). The sitemap is scoped to the public vendor directory SEO surface.
- [ ] **Reserved category slugs** — hubs from `VENDOR_CATEGORY_PAGES` in `lib/marketplace/vendorCategoryPages.ts` (e.g. `djs`, `photographers`) must appear **once** as category hub URLs. Vendor profile rows whose `slug` matches a reserved category slug must **not** produce a second `/vendors/<slug>` entry for the same path (the generator skips those vendors so category hubs do not duplicate vendor profile URLs).

## Manual verification (security & data)

- [ ] **RLS**: No table intended as internal-only is readable without policies (admin tables, audit logs, credit adjustments).
- [ ] **Admin RPCs**: Callable only by `profiles.role = 'admin'` at the database layer (Brook Planner migrations follow this pattern).
- [ ] **Vendor credits**: Public vendor directory and customer-facing quote cards do not expose wallet balances or internal pricing beyond what hosts should see (quote amounts are intentional).
- [ ] **Service role**: Only server routes that need it use `SUPABASE_SERVICE_ROLE_KEY`; it is not prefixed with `NEXT_PUBLIC_`.

---

*Phase 33 — Launch readiness; Phase 34.1 — SEO QA and production URL setup; Phase 39 — Vercel production deployment prep, env inventory, Stripe/Resend production notes, deployment smoke tests, and Supabase Auth URL detail. Complement this doc with the in-app **Admin → Launch checklist** page for day-of links and quick navigation.*
