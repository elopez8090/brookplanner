# Brook Planner — Phase 40 Pre-Launch QA Report

**Date:** 2026-05-14  
**Scope:** Final production-readiness sweep (no new features, no business-logic changes except confirmed bug fixes).  
**Methods:** Static code review of routing, auth, empty states, and financial/credit exposure; automated `eslint` and `next build` (includes TypeScript and static page generation).

---

## 1. Route smoke test audit

### How this was verified

- **Layouts:** `app/(dashboard)/customer/layout.tsx`, `vendor/layout.tsx`, and `admin/layout.tsx` each call `requireRole` for the matching workspace before rendering children.
- **Standalone auth:** `app/(marketing)/post-event/page.tsx` calls `requireRole("customer")`. `app/(marketing)/events/[id]/page.tsx` uses `getUserProfile()` and branches by `profile.role` (customer / admin full access; vendor only if they have quoted the event, otherwise `notFound()`).
- **Build manifest:** `next build` completed and listed all app routes (see §5).

### Routes checked (mapping)

| Flow | Route(s) | Gate / notes |
|------|-----------|----------------|
| Public homepage | `/` | Public |
| Vendor directory | `/vendors` | Public; empty catalog uses `FilterListEmptyState` |
| Category hub (e.g. DJs) | `/vendors/djs` (and other category slugs from `VENDOR_CATEGORY_PAGES`) | Public; `VendorCategoryHub` |
| Borough / neighborhood hubs | `/vendors/[slug]/[borough]`, `/vendors/[slug]/[borough]/[neighborhood]` | Public |
| Vendor public profile | `/vendors/[slug]` (non-category slug) | Public; `notFound()` if unknown slug |
| Customer signup / login | `/signup`, `/login`, `/register` | Public marketing |
| Customer dashboard | `/customer/dashboard` | `requireRole("customer")` in layout |
| Post event | `/post-event` | `requireRole("customer")` on page |
| Customer event detail | `/customer/events/[id]`, `/customer/events/[id]/edit` | Customer layout |
| Compare / shared event hub | `/events/[id]` | Role-aware server page (see above) |
| Vendor signup | `/vendor-signup` | Public |
| Vendor dashboard / leads / profile / credits | `/vendor/dashboard`, `/vendor/leads`, `/vendor/profile`, `/vendor/credits`, success/cancel | `requireRole("vendor")` in layout |
| Vendor opportunity + quote | `/vendor/events/[id]` | Vendor layout; `VendorQuoteForm` |
| Messages | `/customer/messages`, `/customer/messages/[id]`, `/vendor/messages`, `/vendor/messages/[id]` | Layout + `requireRole` on thread pages; conversation fetch scoped by `customer_id` / `vendor_id` |
| Admin | `/admin/dashboard`, `/admin/vendors`, `/admin/customers`, `/admin/events`, `/admin/revenue`, `/admin/credits`, `/admin/audit-logs`, `/admin/platform-health`, `/admin/marketplace-ops`, `/admin/launch-checklist`, plus `/admin/analytics`, `/admin/quotes`, `/admin/reviews` | `requireRole("admin")` in `admin/layout.tsx` |
| Other | `/pricing`, `/how-it-works`, `/privacy`, `/terms`, `/categories`, `/account-suspended`, `/sitemap.xml` | Per existing app structure |

**Note:** End-to-end browser smoke (click-through with real sessions) in staging/production is still recommended as a final human gate; this pass did not substitute for that.

---

## 2. Security audit

| Check | Result |
|--------|--------|
| Customer cannot access vendor/admin routes | **Pass.** Wrong role → `redirect(dashboardPathForRole(profile.role))` in `requireRole` (`lib/auth/getUserProfile.ts`). |
| Vendor cannot access customer/admin routes | **Pass.** Same mechanism. |
| Admin routes use `requireRole("admin")` | **Pass.** `app/(dashboard)/admin/layout.tsx` awaits `requireRole("admin")` for the entire admin tree. |
| No vendor credit/pricing on customer-facing marketing | **Pass.** No `credit` string matches under `app/(marketing)/`. Public pricing page describes tiers without per-credit dollar SKUs. |
| Admin financial data admin-only | **Pass.** Revenue/credits/analytics live under admin layout. |
| `SUPABASE_SERVICE_ROLE_KEY` server-only | **Pass.** Used in `lib/supabase/service-role.ts`, `app/api/stripe/webhook/route.ts`, `app/api/vendor/credits/checkout/route.ts`, and server email helpers — not `NEXT_PUBLIC_*`. Checkout route enforces authenticated **vendor** (`app/api/vendor/credits/checkout/route.ts`). |

---

## 3. Error / empty state audit

| Scenario | Finding |
|----------|---------|
| No vendors (directory) | `FilterListEmptyState` with `no-records` vs `no-results` on `/vendors`. Category hubs use filtered labels and listing patterns consistent with main directory. |
| No customer events | `EmptyState` on customer dashboard “My recent events”. |
| No quotes | Customer event detail and dashboard quote sections use `EmptyState` or explanatory copy. |
| No messages | Both customer and vendor message index pages use `EmptyState`. |
| No reviews | Public vendor profile and vendor dashboard use copy or “—” / “No reviews yet” patterns. |
| No credits / no credit activity | Vendor dashboard cards show zero balances and “No credit activity yet”; credits page patterns unchanged in this pass. |
| Vendor quote form when no quotable services | `availableToQuote` can be empty: dropdown only has placeholder; submit remains disabled. **Not a crash**; optional future UX: explicit “no open slots” blurb above the form. |

No blank-screen or unhandled-exception patterns were identified in the reviewed pages for the empty-data cases above.

---

## 4. Build quality

| Command | Result |
|---------|--------|
| `npm run lint` | **Pass** (exit code 0). |
| `npm run build` | **Pass** (exit code 0). TypeScript OK; 157 static pages generated. |

### Remaining known warnings

- **Next.js middleware deprecation:** Build prints: *The "middleware" file convention is deprecated. Please use "proxy" instead.* (`middleware.ts` → future Next.js migration). Non-blocking for launch; track upstream migration when upgrading Next.js.

---

## 5. Fixes made during this audit

**None.** No production bug was reproduced or confirmed that required a code change under the Phase 40 rules (fix only confirmed issues).

---

## 6. Final launch recommendation

**Recommend:** Proceed toward launch after **one short manual smoke pass** in the target environment (sign-in as customer, vendor, and admin; spot-check compare layout, quote submit, credit purchase webhook path, and admin revenue/credits screens with real or staging data).

**Confidence:** High for RBAC separation and server-only service role usage based on code layout and successful production build. Residual risk is mainly **integration and data-dependent** behavior (Stripe, Supabase RLS, email), which automated static QA cannot fully certify.

---

## Appendix: Routes emitted by `next build` (reference)

Includes all major segments: marketing, `customer/*`, `vendor/*`, `admin/*`, `/events/[id]`, `/api/stripe/webhook`, `/api/vendor/credits/checkout`, `/vendors` hierarchy, etc. (full list was printed in the local build log on 2026-05-14).
