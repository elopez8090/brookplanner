import type { Metadata } from "next";
import { VendorLeadsSection } from "@/components/vendor/VendorLeadsSection";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getUserProfile } from "@/lib/auth/getUserProfile";
import {
  fetchVendorActiveEvents,
  fetchVendorCreditSummary,
  fetchVendorCreditTransactions,
  fetchVendorHasCompletedCreditPurchase,
  fetchVendorQuotedServiceMap,
  fetchVendorSubmittedQuotes,
  type VendorQuotedServiceMap,
} from "@/lib/events/queries";
import { formatEventDateLabel, quoteStatusPresentation } from "@/lib/events/presentation";
import { VendorDashboardMarketplacePresence } from "@/components/vendor/VendorDashboardMarketplacePresence";
import { fetchVendorDashboardReviews, fetchVendorReviewAggregate } from "@/lib/reviews/queries";
import { fetchVendorProfileByUserId } from "@/lib/vendor-profile/queries";
import { ensureConversationsByQuoteIdsForRole, fetchConversationsForRole } from "@/lib/messages/queries";
import { fetchCategoryNamesOrdered } from "@/lib/categories/queries";
import { firstSearchParam, parseVendorLeadSort, rpcOptionalText } from "@/lib/filters/phase30Search";
import {
  computeMarketplaceReadiness,
  isStrictFirstTimeVendor,
} from "@/lib/vendor-onboarding/marketplaceReadiness";
import {
  computeVendorProfileCompletionPercent,
  vendorProfileRowToCompletionInput,
} from "@/lib/vendor-profile/profileCompletion";
import { VendorOnboardingExperience } from "@/components/vendor/VendorOnboardingExperience";

export const metadata: Metadata = {
  title: "Vendor Dashboard",
};

type VendorDashboardPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    neighborhood?: string | string[];
    category?: string | string[];
    sort?: string | string[];
  }>;
};

function formatCreditActivityDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCreditTransactionType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatQuoteAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatReviewListDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function normalizeVendorQuoteStatus(raw: string): "pending" | "accepted" | "declined" {
  if (raw === "accepted" || raw === "declined") {
    return raw;
  }
  return "pending";
}

export default async function VendorDashboardPage({ searchParams }: VendorDashboardPageProps) {
  const sp = await searchParams;
  const leadQ = rpcOptionalText(firstSearchParam(sp.q)) ?? "";
  const leadNeighborhood = rpcOptionalText(firstSearchParam(sp.neighborhood)) ?? "";
  const leadCategory = rpcOptionalText(firstSearchParam(sp.category)) ?? "";
  const leadSort = parseVendorLeadSort(firstSearchParam(sp.sort));

  const { user } = await getUserProfile();
  const [vendorProfile, events, categoryNames] = await Promise.all([
    user ? fetchVendorProfileByUserId(user.id) : Promise.resolve(null),
    fetchVendorActiveEvents({
      query: leadQ || undefined,
      neighborhood: leadNeighborhood || undefined,
      category: leadCategory || undefined,
      sort: leadSort,
    }),
    fetchCategoryNamesOrdered(),
  ]);
  const [quotedMap, creditSummary, creditTransactions, vendorQuotes, reviewAggregate, vendorReviews, hasCompletedCreditPurchase] =
    user
      ? await Promise.all([
          fetchVendorQuotedServiceMap(user.id),
          fetchVendorCreditSummary(user.id),
          fetchVendorCreditTransactions(user.id),
          fetchVendorSubmittedQuotes(user.id),
          fetchVendorReviewAggregate(user.id),
          fetchVendorDashboardReviews(user.id, 15),
          fetchVendorHasCompletedCreditPurchase(user.id),
        ])
      : [
          {} as VendorQuotedServiceMap,
          { creditsBalance: 0, creditsUsed: 0, quotesSubmitted: 0 },
          [],
          [],
          { average: null, total: 0 },
          [],
          false,
        ];
  const sortedCreditTransactions = [...creditTransactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const activeCount = events.length;
  const quoteStatusTotals = vendorQuotes.reduce(
    (totals, quote) => {
      const status = normalizeVendorQuoteStatus(String(quote.status));
      totals[status] += 1;
      return totals;
    },
    { pending: 0, accepted: 0, declined: 0 },
  );
  const acceptedQuoteIds = vendorQuotes.filter((quote) => normalizeVendorQuoteStatus(String(quote.status)) === "accepted").map((quote) => quote.id);
  const [conversationsByQuoteId, vendorConversationInbox] = user
    ? await Promise.all([
        ensureConversationsByQuoteIdsForRole("vendor", user.id, acceptedQuoteIds),
        fetchConversationsForRole("vendor", user.id),
      ])
    : [new Map<string, string>(), []];
  const unreadByConversationId = new Map(vendorConversationInbox.map((row) => [row.id, row.unread_count]));
  const inboxUnreadTotal = vendorConversationInbox.reduce((acc, row) => acc + row.unread_count, 0);
  const decidedQuotes = quoteStatusTotals.accepted + quoteStatusTotals.declined;
  const winRatePercent =
    decidedQuotes > 0 ? Math.round((quoteStatusTotals.accepted / decidedQuotes) * 100) : null;
  const profileCompletionPct = vendorProfile
    ? computeVendorProfileCompletionPercent(vendorProfileRowToCompletionInput(vendorProfile))
    : 100;
  const creditsBal = Number(creditSummary.creditsBalance ?? 0);
  const lowCredits = creditsBal <= 5;
  const quotesSubmittedTotal = Number(creditSummary.quotesSubmitted ?? 0);
  const readiness =
    vendorProfile && user
      ? computeMarketplaceReadiness({
          profile: vendorProfileRowToCompletionInput(vendorProfile),
          quotesSubmitted: quotesSubmittedTotal,
          hasCompletedCreditPurchase,
        })
      : null;
  const strictFirstTime =
    vendorProfile && user
      ? isStrictFirstTimeVendor({
          isProfileCompleteDb: vendorProfile.is_profile_complete,
          quotesSubmitted: quotesSubmittedTotal,
          hasCompletedCreditPurchase,
        })
      : false;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Overview</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Welcome back</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Browse active Brooklyn events and open each opportunity to review details and requested services.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/vendor/messages" variant="secondary">
            Open Messages
          </ButtonLink>
          {inboxUnreadTotal > 0 ? (
            <span className="text-sm font-semibold text-accent-coral">{inboxUnreadTotal} unread</span>
          ) : null}
        </div>
      </header>

      {readiness && vendorProfile && user ? (
        <VendorOnboardingExperience
          businessName={vendorProfile.business_name ?? vendorProfile.full_name}
          readiness={readiness}
          profileCompletionPercent={profileCompletionPct}
          isStrictFirstTime={strictFirstTime}
        />
      ) : null}

      {user && lowCredits ? (
        <div
          className={`rounded-2xl border px-4 py-3 sm:px-5 ${
            creditsBal === 0
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          <p className="text-sm font-semibold">{creditsBal === 0 ? "You are out of quote credits" : "Credit balance is low"}</p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">
            {creditsBal === 0
              ? "Buy credits to keep submitting quotes on new opportunities."
              : "Top up soon so you can respond quickly when high-intent leads appear."}
          </p>
          <div className="mt-3">
            <ButtonLink href="/vendor/credits">Buy credits</ButtonLink>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active opportunities" value={String(activeCount)} hint="Live customer events in Brooklyn" tone="accent" />
        <StatCard label="Quotes submitted" value={String(quotesSubmittedTotal)} hint="Total quote submissions you have sent" />
        <StatCard
          label="Quote win rate"
          value={winRatePercent !== null ? `${winRatePercent}%` : "—"}
          hint={
            decidedQuotes > 0
              ? `Accepted ${quoteStatusTotals.accepted} of ${decidedQuotes} decided quotes (${quoteStatusTotals.pending} still pending)`
              : "Shown once customers accept or decline quotes"
          }
          tone="accent"
        />
        <StatCard
          label="Quote credits"
          value={String(creditSummary.creditsBalance)}
          hint="Credits are spent immediately when a quote is recorded (per category)"
          tone={lowCredits ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <VendorLeadsSection
          actionPath="/vendor/dashboard"
          leadQ={leadQ}
          leadNeighborhood={leadNeighborhood}
          leadCategory={leadCategory}
          leadSort={leadSort}
          events={events}
          categoryNames={categoryNames}
          quotedMap={quotedMap}
          showFirstQuoteGuidance={Boolean(user && quotesSubmittedTotal === 0)}
        />

        <div className="space-y-6">
          <DashboardCard id="wallet" title="Credit Balance">
            <p className="text-2xl font-bold tabular-nums tracking-tight text-brand-navy sm:text-3xl">
              {creditSummary.creditsBalance} credits
            </p>
            <p className="mt-1 text-sm text-brand-navy-muted">Used to submit quotes to customer events.</p>
            {creditsBal === 0 && user && !hasCompletedCreditPurchase ? (
              <div className="mt-4 rounded-xl border border-accent-blue/25 bg-accent-blue/[0.06] px-3 py-3 text-sm leading-relaxed text-brand-navy">
                <p className="font-semibold text-brand-navy">Get started with credits</p>
                <p className="mt-1 text-brand-navy-muted">
                  Each quote uses credits based on the service category. Buying credits adds balance to your wallet; when you submit a
                  quote, the matching amount is deducted right away so you only spend when you act.
                </p>
                <ButtonLink href="/vendor/credits" className="mt-3">
                  Buy credits
                </ButtonLink>
              </div>
            ) : null}
            <p className="mt-3 text-sm text-brand-navy">
              <span className="font-semibold tabular-nums">{creditSummary.creditsUsed}</span> credits spent to date
            </p>
            <ButtonLink href="/vendor/credits" className="mt-4">
              Buy Credits
            </ButtonLink>
          </DashboardCard>

          <DashboardCard id="credit-activity" title="Credit Activity">
            {sortedCreditTransactions.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No credit activity yet</p>
            ) : (
              <ul className="max-h-80 divide-y divide-border-subtle overflow-y-auto rounded-xl border border-border-subtle bg-card">
                {sortedCreditTransactions.map((tx) => (
                  <li key={tx.id} className="space-y-2 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-sm font-bold ${tx.amount < 0 ? "text-red-600" : "text-brand-navy"}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount} credits
                      </p>
                      <p className="text-xs text-brand-navy-muted">{formatCreditActivityDate(tx.created_at)}</p>
                    </div>
                    <p className="text-xs font-medium text-brand-navy-muted">{formatCreditTransactionType(tx.type)}</p>
                    <p className="text-sm text-brand-navy">{tx.description || "No description"}</p>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard id="quotes" title="My quotes" description="Track services you already quoted.">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border-subtle bg-white px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Pending quotes</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-brand-navy">{quoteStatusTotals.pending}</p>
                </div>
                <div className="rounded-xl border border-border-subtle bg-white px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Accepted quotes</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-brand-navy">{quoteStatusTotals.accepted}</p>
                </div>
                <div className="rounded-xl border border-border-subtle bg-white px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Declined quotes</p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-brand-navy">{quoteStatusTotals.declined}</p>
                </div>
              </div>
              {vendorQuotes.length === 0 ? (
                <EmptyState
                  title="No quotes submitted yet"
                  description="Open an active opportunity from the leads list and send your first proposal. Quotes use your credit balance per service category."
                  action={
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <ButtonLink href="/vendor/leads">Browse opportunities</ButtonLink>
                      <ButtonLink href="/vendor/credits" variant="secondary">
                        Manage credits
                      </ButtonLink>
                    </div>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {vendorQuotes.map((quote) => {
                    const quoteStatus = quoteStatusPresentation(quote.status);
                    return (
                      <li key={quote.id} className="rounded-xl border border-border-subtle bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-semibold text-brand-navy">{quote.eventTitle}</p>
                            <p className="text-xs text-brand-navy-muted">
                              {formatEventDateLabel(quote.eventDate)} · {quote.neighborhood}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-brand-navy">{formatQuoteAmount(quote.quoteAmount)}</p>
                            <StatusBadge tone={quoteStatus.tone}>{quoteStatus.label}</StatusBadge>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-brand-navy">
                          <span className="font-semibold">Service:</span> {quote.serviceName ?? "Service"}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-brand-navy-muted">{quote.message}</p>
                        <div className="mt-4">
                          <ButtonLink href={`/events/${quote.eventId}`} variant="secondary" className="text-sm">
                            Event hub
                          </ButtonLink>
                          {normalizeVendorQuoteStatus(String(quote.status)) === "accepted" ? (
                            (() => {
                              const conversationId = conversationsByQuoteId.get(quote.id);
                              const rowUnread = conversationId ? unreadByConversationId.get(conversationId) ?? 0 : 0;
                              return conversationId ? (
                                <span className="ml-2 inline-flex flex-wrap items-center gap-2">
                                  <ButtonLink href={`/vendor/messages/${conversationId}`} variant="secondary" className="text-sm">
                                    Message customer
                                  </ButtonLink>
                                  {rowUnread > 0 ? (
                                    <span className="text-xs font-semibold text-accent-coral">{rowUnread} unread</span>
                                  ) : null}
                                </span>
                              ) : null;
                            })()
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </DashboardCard>

          <DashboardCard id="reviews" title="Reviews" description="Feedback from customers after they accept a quote.">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border-subtle bg-white px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Average rating</p>
                  <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-brand-navy">
                    {reviewAggregate.average !== null ? `${reviewAggregate.average.toFixed(1)} / 5` : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-border-subtle bg-white px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Total reviews</p>
                  <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-brand-navy">{reviewAggregate.total}</p>
                </div>
              </div>
              {vendorReviews.length === 0 ? (
                <p className="text-sm text-brand-navy-muted">No reviews yet.</p>
              ) : (
                <ul className="max-h-96 space-y-3 overflow-y-auto rounded-xl border border-border-subtle bg-card p-3">
                  {vendorReviews.map((rev) => (
                    <li key={rev.id} className="rounded-xl border border-border-subtle bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold tabular-nums text-brand-navy">{rev.rating} / 5</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {!rev.is_public ? (
                            <StatusBadge tone="neutral">Hidden from public</StatusBadge>
                          ) : null}
                          <p className="text-xs text-brand-navy-muted">{formatReviewListDate(rev.created_at)}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-brand-navy">
                        <span className="font-semibold">Event:</span> {rev.event_title?.trim() ? rev.event_title : "—"}
                      </p>
                      {rev.review_text?.trim() ? (
                        <p className="mt-2 text-sm leading-relaxed text-brand-navy-muted">{rev.review_text.trim()}</p>
                      ) : (
                        <p className="mt-2 text-sm italic text-brand-navy-muted">No written feedback.</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DashboardCard>

          {vendorProfile ? (
            <VendorDashboardMarketplacePresence profile={vendorProfile} />
          ) : (
            <DashboardCard id="profile" title="Business profile" description="Public-facing vendor details.">
              <p className="text-sm text-brand-navy-muted">We could not load your vendor profile. Try refreshing the page.</p>
              <ButtonLink href="/vendor/profile" className="mt-4">
                Open profile settings
              </ButtonLink>
            </DashboardCard>
          )}
        </div>
      </div>
    </div>
  );
}
