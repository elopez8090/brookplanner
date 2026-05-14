import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CustomerEventJourney } from "@/components/customer/CustomerEventJourney";
import { CustomerTrustCallout } from "@/components/customer/CustomerTrustCallout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { EventQuoteCard } from "@/components/events/EventQuoteCard";
import { PageIntro } from "@/components/layout/PageIntro";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { postAuthRedirectPath } from "@/lib/auth/roleRedirect";
import { getUserProfile } from "@/lib/auth/getUserProfile";
import type { UserRole } from "@/lib/auth/types";
import {
  fetchCustomerEventById,
  fetchEventByIdForViewer,
  fetchQuotesForEventDetail,
  fetchQuoteVendorProfilesForCustomerEvent,
  fetchVendorQuotedServiceMap,
} from "@/lib/events/queries";
import type { EventWithServices } from "@/lib/events/types";
import {
  customerEventJourneySteps,
  eventStatusPresentation,
  formatEventDateLabel,
  groupCustomerQuotesByService,
  normalizeQuoteStatus,
  serviceNamesFromEvent,
} from "@/lib/events/presentation";
import { eventQuoteVendorFromProfileRpc } from "@/lib/events/vendorQuoteCard";
import { fetchVendorProfileByUserId } from "@/lib/vendor-profile/queries";
import { fetchCustomerReviewsByQuoteIds } from "@/lib/reviews/queries";
import { ensureConversationsByQuoteIdsForRole } from "@/lib/messages/queries";

export const metadata: Metadata = {
  title: "Event details",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ notice?: string | string[] }>;
};

export default async function SharedEventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const noticeRaw = sp?.notice;
  const notice = typeof noticeRaw === "string" ? noticeRaw : Array.isArray(noticeRaw) ? noticeRaw[0] : undefined;

  const { user, profile } = await getUserProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect(postAuthRedirectPath(null, { noProfile: "register" }));
  }

  const role = profile.role;

  let event: EventWithServices | null = null;

  if (role === "customer") {
    event = await fetchCustomerEventById(user.id, id);
  } else if (role === "admin") {
    event = await fetchEventByIdForViewer(id);
  } else if (role === "vendor") {
    const quotedMap = await fetchVendorQuotedServiceMap(user.id);
    const quotedServices = quotedMap[id];
    if (!quotedServices?.length) {
      notFound();
    }
    event = await fetchEventByIdForViewer(id);
  } else {
    notFound();
  }

  if (!event) {
    notFound();
  }

  const quotes = await fetchQuotesForEventDetail({
    eventId: event.id,
    viewerRole: role as UserRole,
    viewerId: user.id,
  });

  const vendorCardById = new Map(
    (role === "customer" || role === "admin"
      ? await fetchQuoteVendorProfilesForCustomerEvent(event.id)
      : []
    ).map((r) => [r.vendor_id, r]),
  );

  const vendorSelf = role === "vendor" ? await fetchVendorProfileByUserId(user.id) : null;

  const status = eventStatusPresentation(event.status);
  const serviceNames = serviceNamesFromEvent(event.event_services);
  const showCustomerQuoteActions = role === "customer";

  const acceptedQuoteIdsCustomer = showCustomerQuoteActions
    ? quotes.filter((q) => normalizeQuoteStatus(String(q.status)) === "accepted").map((q) => q.id)
    : [];
  const [reviewsByQuoteId, conversationByQuoteId] = showCustomerQuoteActions
    ? await Promise.all([
        fetchCustomerReviewsByQuoteIds(
          user.id,
          quotes.map((q) => q.id),
        ),
        ensureConversationsByQuoteIdsForRole("customer", user.id, acceptedQuoteIdsCustomer),
      ])
    : [new Map(), new Map()];

  const customerJourney =
    role === "customer"
      ? customerEventJourneySteps({
          eventStatus: event.status,
          totalQuotes: quotes.length,
          hasAcceptedQuote: acceptedQuoteIdsCustomer.length > 0,
        })
      : null;

  const quoteGroups = groupCustomerQuotesByService(quotes);

  const backHref =
    role === "customer"
      ? "/customer/dashboard#my-events"
      : role === "vendor"
        ? "/vendor/dashboard#quotes"
        : "/admin/dashboard#recent-events";

  const backLabel =
    role === "customer" ? "← Back to my events" : role === "vendor" ? "← Back to my quotes" : "← Back to admin";

  const introDescription =
    role === "customer"
      ? "Wide layout to scan every proposal by service — vendors sent these quotes; you choose whether to accept."
      : role === "vendor"
        ? "Review the event context alongside the quotes you have submitted."
        : "Operational view of this event and every submitted quote.";

  return (
    <>
      <PageIntro title={event.title} description={introDescription} />
      <Section dense className="bg-background pb-16 pt-2">
        <Container>
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={backHref} variant="secondary">
                {backLabel}
              </ButtonLink>
              {role === "customer" ? (
                <>
                  <ButtonLink href={`/customer/events/${event.id}/edit`} variant="secondary">
                    Edit event
                  </ButtonLink>
                  <ButtonLink href={`/customer/events/${event.id}`} variant="secondary">
                    Manage & delete
                  </ButtonLink>
                </>
              ) : null}
            </div>

            {notice === "quoteAccepted" ? (
              <p
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
                role="status"
              >
                You accepted this quote. Other proposals for that service were declined automatically.
              </p>
            ) : null}
            {notice === "quoteDeclined" ? (
              <p
                className="rounded-xl border border-border-subtle bg-brand-navy/[0.03] px-4 py-3 text-sm text-brand-navy"
                role="status"
              >
                You declined this quote.
              </p>
            ) : null}

            {role === "customer" && customerJourney ? (
              <div className="space-y-4">
                <CustomerTrustCallout dense />
                <CustomerEventJourney compact steps={customerJourney} />
              </div>
            ) : null}

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

                <DashboardCard
                  title={role === "vendor" ? "Your quotes on this event" : "Compare quotes"}
                  description={
                    role === "vendor"
                      ? "Only your submitted proposals appear here."
                      : role === "admin"
                        ? "All vendor submissions for this event (read-only), grouped by service."
                        : "Grouped by service — pending offers first, then lowest proposed price. Accept only when you are ready."
                  }
                >
                  {quotes.length === 0 ? (
                    role === "customer" ? (
                      <EmptyState
                        title="No quotes yet"
                        description="Vendors browse active events and send proposals when they can deliver your date and scope. Check back soon — you will see each offer here with profile links and public review summaries when available."
                        action={<ButtonLink href={`/customer/events/${event.id}`}>Open manage view</ButtonLink>}
                      />
                    ) : (
                      <p className="text-sm text-brand-navy-muted">
                        {role === "vendor" ? "No quotes found for your account on this event." : "No quotes yet."}
                      </p>
                    )
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
                              const vendorCard =
                                role === "vendor"
                                  ? {
                                      vendor_id: quote.vendor_id,
                                      displayName:
                                        vendorSelf?.business_name?.trim() || profile.full_name.trim() || "Your business",
                                      service_areas: vendorSelf?.service_areas ?? null,
                                      logo_url: vendorSelf?.logo_url ?? null,
                                      slug: vendorSelf?.slug ?? null,
                                    }
                                  : rpcVendor
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
                                  showCustomerActions={showCustomerQuoteActions}
                                  acceptedConversationHref={
                                    showCustomerQuoteActions && accepted
                                      ? (() => {
                                          const conversationId = conversationByQuoteId.get(quote.id);
                                          return conversationId ? `/customer/messages/${conversationId}` : null;
                                        })()
                                      : null
                                  }
                                  customerReview={
                                    showCustomerQuoteActions && accepted
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

                {role === "vendor" ? (
                  <DashboardCard title="Vendor workspace">
                    <p className="text-sm text-brand-navy-muted">
                      Submit or adjust quotes from the full opportunity view when the event is active.
                    </p>
                    <ButtonLink href={`/vendor/events/${event.id}`} className="mt-4 w-full justify-center">
                      Open opportunity
                    </ButtonLink>
                  </DashboardCard>
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
