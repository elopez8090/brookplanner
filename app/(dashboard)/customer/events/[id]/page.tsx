import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CustomerEventJourney } from "@/components/customer/CustomerEventJourney";
import { CustomerHowToCompareQuotesCard } from "@/components/customer/CustomerHowToCompareQuotesCard";
import { CustomerQuotesWaitingGuide } from "@/components/customer/CustomerQuotesWaitingGuide";
import { CustomerTrustCallout } from "@/components/customer/CustomerTrustCallout";
import { CustomerVendorSelectedSuccessPanel } from "@/components/customer/CustomerVendorSelectedSuccessPanel";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DeleteCustomerEventForm } from "@/components/events/DeleteCustomerEventForm";
import { EventQuoteCard } from "@/components/events/EventQuoteCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { isPublicVendorDiscoveryEnabled } from "@/lib/marketplace/publicVendorDiscovery";
import { getUserProfile } from "@/lib/auth/getUserProfile";
import {
  fetchCustomerEventById,
  fetchQuoteVendorProfilesForCustomerEvent,
  fetchQuotesForEventDetail,
} from "@/lib/events/queries";
import { eventQuoteVendorFromProfileRpc } from "@/lib/events/vendorQuoteCard";
import {
  customerEventJourneySteps,
  eventStatusPresentation,
  formatEventDateLabel,
  groupCustomerQuotesByService,
  normalizeQuoteStatus,
  serviceNamesFromEvent,
} from "@/lib/events/presentation";
import { fetchCustomerReviewsByQuoteIds } from "@/lib/reviews/queries";
import { ensureConversationsByQuoteIdsForRole } from "@/lib/messages/queries";

export const metadata: Metadata = {
  title: "Event details",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ notice?: string | string[] }>;
};

export default async function CustomerEventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const noticeRaw = sp?.notice;
  const notice = typeof noticeRaw === "string" ? noticeRaw : Array.isArray(noticeRaw) ? noticeRaw[0] : undefined;

  const { user } = await getUserProfile();
  if (!user) {
    redirect("/login");
  }

  const event = await fetchCustomerEventById(user.id, id);
  if (!event) {
    notFound();
  }

  const quotes = await fetchQuotesForEventDetail({
    eventId: event.id,
    viewerRole: "customer",
    viewerId: user.id,
  });

  const vendorRpcRows = await fetchQuoteVendorProfilesForCustomerEvent(event.id);
  const vendorCardById = new Map(vendorRpcRows.map((row) => [row.vendor_id, row]));

  const reviewsByQuoteId = await fetchCustomerReviewsByQuoteIds(
    user.id,
    quotes.map((q) => q.id),
  );
  const acceptedQuoteIds = quotes
    .filter((quote) => normalizeQuoteStatus(String(quote.status)) === "accepted")
    .map((quote) => quote.id);
  const conversationByQuoteId = await ensureConversationsByQuoteIdsForRole("customer", user.id, acceptedQuoteIds);

  const firstAcceptedMessagesHref =
    acceptedQuoteIds
      .map((quoteId) => {
        const conversationId = conversationByQuoteId.get(quoteId);
        return conversationId ? `/customer/messages/${conversationId}` : null;
      })
      .find((href): href is string => typeof href === "string" && href.length > 0) ?? null;

  const status = eventStatusPresentation(event.status);
  const serviceNames = serviceNamesFromEvent(event.event_services);
  const hasAcceptedQuote = acceptedQuoteIds.length > 0;
  const journey = customerEventJourneySteps({
    eventStatus: event.status,
    totalQuotes: quotes.length,
    hasAcceptedQuote,
  });
  const quoteGroups = groupCustomerQuotesByService(quotes);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        {notice === "quoteAccepted" ? (
          <p
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            You accepted this quote. Other proposals for that service were declined automatically.
          </p>
        ) : null}
        {notice === "quoteDeclined" ? (
          <p className="rounded-xl border border-border-subtle bg-brand-navy/[0.03] px-4 py-3 text-sm text-brand-navy" role="status">
            You declined this quote.
          </p>
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Event details</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">{event.title}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Compare vendor proposals by service, then accept the offer you want — nothing is booked until you confirm.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href="/customer/dashboard#my-events" variant="secondary">
            ← Back to my events
          </ButtonLink>
          <ButtonLink href={`/events/${event.id}`} variant="secondary">
            Open compare layout
          </ButtonLink>
          <ButtonLink href={`/customer/events/${event.id}/edit`} variant="secondary">
            Edit event
          </ButtonLink>
          <DeleteCustomerEventForm eventId={event.id} />
        </div>
      </header>

      <CustomerTrustCallout />

      <CustomerEventJourney steps={journey} />

      {hasAcceptedQuote ? <CustomerVendorSelectedSuccessPanel messagesHref={firstAcceptedMessagesHref} /> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardCard title="Event overview">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Category</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">{event.event_type}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Event date</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">{formatEventDateLabel(event.event_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Location</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">{event.neighborhood}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Budget</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">
                  {event.budget_range?.trim() ? event.budget_range : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Guest count</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">{event.guest_count}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Status</dt>
                <dd className="mt-1">
                  <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                </dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-border-subtle pt-6">
              <h3 className="text-sm font-semibold text-brand-navy">Details</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy-muted">
                {event.details?.trim() ? event.details : "No additional details provided."}
              </p>
            </div>
          </DashboardCard>

          {quotes.length > 0 ? <CustomerHowToCompareQuotesCard /> : <CustomerQuotesWaitingGuide eventId={event.id} />}

          <DashboardCard
            title="Compare quotes by service"
            description="Pending quotes appear first within each group, sorted from lowest to highest proposed price. Accept only when you are ready — other proposals for that service close automatically."
          >
            {quotes.length === 0 ? (
              <EmptyState
                title="No proposals in this inbox yet"
                description="When vendors respond, each quote appears in the groups below with actions to accept or decline."
                action={
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <ButtonLink href={`/events/${event.id}`} variant="secondary">
                      Preview compare layout
                    </ButtonLink>
                    {isPublicVendorDiscoveryEnabled() ? (
                      <ButtonLink href="/vendors">Browse vendor styles</ButtonLink>
                    ) : (
                      <ButtonLink href="/post-event" variant="secondary">
                        Post another event
                      </ButtonLink>
                    )}
                  </div>
                }
              />
            ) : (
              <div className="space-y-8">
                {quoteGroups.map((group) => (
                  <section key={group.serviceLabel} className="space-y-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle pb-2">
                      <h3 className="text-sm font-semibold text-brand-navy">{group.serviceLabel}</h3>
                      <p className="text-xs text-brand-navy-muted">
                        {group.quotes.length} proposal{group.quotes.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ul className="space-y-4">
                      {group.quotes.map((quote) => {
                        const rpcVendor = vendorCardById.get(quote.vendor_id);
                        const vendorCard = rpcVendor
                          ? eventQuoteVendorFromProfileRpc(rpcVendor)
                          : {
                              vendor_id: quote.vendor_id,
                              displayName: "Vendor",
                              service_areas: null,
                              logo_url: null,
                              slug: null,
                            };

                        const accepted = normalizeQuoteStatus(String(quote.status)) === "accepted";
                        const reviewRow = reviewsByQuoteId.get(quote.id);

                        return (
                          <EventQuoteCard
                            key={quote.id}
                            quote={{
                              id: quote.id,
                              quote_amount: quote.quote_amount,
                              message: quote.message,
                              what_is_included: quote.what_is_included,
                              availability_note: quote.availability_note,
                              estimated_timeframe: quote.estimated_timeframe,
                              status: quote.status,
                            }}
                            vendor={vendorCard}
                            eventId={event.id}
                            serviceCategoryName={quote.service_category_name}
                            showCustomerActions
                            acceptedConversationHref={
                              accepted
                                ? (() => {
                                    const conversationId = conversationByQuoteId.get(quote.id);
                                    return conversationId ? `/customer/messages/${conversationId}` : null;
                                  })()
                                : null
                            }
                            customerReview={
                              accepted
                                ? {
                                    existing: reviewRow
                                      ? { rating: reviewRow.rating, review_text: reviewRow.review_text }
                                      : null,
                                  }
                                : undefined
                            }
                          />
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>

        <div className="space-y-6">
          <DashboardCard title="Services requested">
            {serviceNames.length === 0 ? (
              <p className="text-sm text-brand-navy-muted">No services selected for this event.</p>
            ) : (
              <ul className="space-y-2">
                {serviceNames.map((serviceName, index) => (
                  <li
                    key={`${serviceName}-${index}`}
                    className="rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm font-medium text-brand-navy"
                  >
                    {serviceName}
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
