import type { Metadata } from "next";
import { StatCard } from "@/components/dashboard/StatCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EventLeadCard } from "@/components/dashboard/EventLeadCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getUserProfile } from "@/lib/auth/getUserProfile";
import {
  fetchCustomerAcceptedQuoteCount,
  fetchCustomerEventIdsWithAcceptedQuote,
  fetchCustomerEvents,
  fetchCustomerQuoteCounts,
} from "@/lib/events/queries";
import {
  customerAccountJourneyDescription,
  customerAccountJourneyPhase,
  customerAccountJourneyTitle,
  customerEventJourneySteps,
  customerEventJourneySummaryLine,
  customerOnboardingAccountSteps,
  customerQuoteProgress,
  eventStatusPresentation,
  formatEventDateLabel,
  serviceNamesFromEvent,
} from "@/lib/events/presentation";
import { CustomerOnboardingCard } from "@/components/customer/CustomerOnboardingCard";

export const metadata: Metadata = {
  title: "Customer Dashboard",
};

export default async function CustomerDashboardPage() {
  const { user } = await getUserProfile();
  const customerId = user?.id ?? "";
  const [events, quoteCounts, acceptedEventIds, acceptedQuoteCount] = customerId
    ? await Promise.all([
        fetchCustomerEvents(customerId),
        fetchCustomerQuoteCounts(customerId),
        fetchCustomerEventIdsWithAcceptedQuote(customerId),
        fetchCustomerAcceptedQuoteCount(customerId),
      ])
    : [[], { totalQuotesReceived: 0, quotesByEventServiceId: {} }, new Set<string>(), 0];

  const activeCount = events.filter((e) => e.status === "active").length;
  const draftCount = events.filter((e) => e.status === "draft").length;
  const totalQuotesReceived = quoteCounts.totalQuotesReceived;
  const serviceSlotTotal = events.reduce((sum, ev) => sum + (ev.event_services?.length ?? 0), 0);

  const accountPhase = customerAccountJourneyPhase({
    events,
    totalQuotesReceived,
    acceptedQuoteCount,
  });
  const onboardingSteps = customerOnboardingAccountSteps(accountPhase);
  const onboardingTitle = customerAccountJourneyTitle(accountPhase);
  const onboardingDescription = customerAccountJourneyDescription(accountPhase);

  let firstEventIdWithQuotes: string | null = null;
  let maxQuotesOnEvent = 0;
  for (const ev of events) {
    const n = (ev.event_services ?? []).reduce(
      (sum, s) => sum + (quoteCounts.quotesByEventServiceId[s.id] ?? 0),
      0,
    );
    if (n > maxQuotesOnEvent) {
      maxQuotesOnEvent = n;
      firstEventIdWithQuotes = ev.id;
    }
  }
  const firstDraft = events.find((e) => e.status === "draft");

  let onboardingPrimary: { href: string; label: string };
  let onboardingSecondary: { href: string; label: string } | undefined;
  if (accountPhase === "new_customer") {
    onboardingPrimary = { href: "/post-event", label: "Post your event" };
    if (firstDraft) {
      onboardingSecondary = {
        href: `/customer/events/${firstDraft.id}/edit`,
        label: "Continue draft",
      };
    }
  } else if (accountPhase === "planning_event") {
    onboardingPrimary = { href: "/customer/dashboard#my-events", label: "View my events" };
  } else if (accountPhase === "comparing_quotes") {
    if (firstEventIdWithQuotes) {
      onboardingPrimary = {
        href: `/events/${firstEventIdWithQuotes}`,
        label: "Open compare layout",
      };
      onboardingSecondary = { href: "/customer/dashboard#my-events", label: "Manage events" };
    } else {
      onboardingPrimary = { href: "/customer/dashboard#my-events", label: "Review quotes" };
    }
  } else {
    onboardingPrimary = { href: "/customer/messages", label: "Open messages" };
    onboardingSecondary = { href: "/customer/dashboard#my-events", label: "View my events" };
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Overview</p>
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Welcome back</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
              Vendors submit quotes in response to your event — you compare proposals in one place and accept only who
              you want. Free to post; no obligation until you choose a vendor.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <ButtonLink href="/post-event" className="w-full justify-center px-6 py-3 text-base sm:w-auto">
              Post your event
            </ButtonLink>
            <ButtonLink href="/vendors" variant="secondary" className="w-full justify-center sm:w-auto">
              Browse vendors
            </ButtonLink>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-brand-navy-muted">
          Tip: use <span className="font-medium text-brand-navy">Compare layout</span> when you have multiple quotes to
          scan side by side; use <span className="font-medium text-brand-navy">Manage event</span> for edits and
          decisions.
        </p>
      </header>

      {customerId ? (
        <CustomerOnboardingCard
          phase={accountPhase}
          steps={onboardingSteps}
          journeyTitle={onboardingTitle}
          journeyDescription={onboardingDescription}
          primaryCta={onboardingPrimary}
          secondaryCta={onboardingSecondary}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Events collecting quotes"
          value={String(activeCount)}
          hint="Live on the marketplace — vendors can respond."
        />
        <StatCard
          label="Quotes received"
          value={String(totalQuotesReceived)}
          hint="Proposals submitted across all of your events."
        />
        <StatCard
          label="Accepted vendors"
          value={String(acceptedQuoteCount)}
          hint="Quotes you accepted — one per service category."
        />
        <StatCard
          label="Service categories"
          value={String(serviceSlotTotal)}
          hint="Slots you are sourcing quotes for (up to 4 quotes each)."
        />
      </div>

      {draftCount > 0 ? (
        <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          You have <span className="font-semibold">{draftCount}</span> draft event{draftCount === 1 ? "" : "s"}. Open
          each event in your workspace to finish details and publish when you are ready for quotes.
        </p>
      ) : null}

      <DashboardCard
        id="my-events"
        title="My recent events"
        description="Posted → quotes in → compare → accept. Track each event below; your choice is always optional until you accept."
      >
        <div className="space-y-4">
          {events.length === 0 ? (
            <EmptyState
              title="Post your first Brooklyn event"
              description="It is free. Share your date, neighborhood, budget, and services — vendors submit quotes and you compare without pressure."
              action={<ButtonLink href="/post-event">Post your event</ButtonLink>}
            />
          ) : (
            events.map((ev) => {
              const event = ev;
              const status = eventStatusPresentation(event.status);
              const services = serviceNamesFromEvent(event.event_services);
              const quotesReceived = (event.event_services ?? []).reduce(
                (sum, service) => sum + (quoteCounts.quotesByEventServiceId[service.id] ?? 0),
                0,
              );
              const quotes = customerQuoteProgress(quotesReceived);
              const perServiceSummary = (event.event_services ?? [])
                .map((service) => {
                  const category = Array.isArray(service.categories) ? service.categories[0] : service.categories;
                  const categoryName = category?.name ?? "Service";
                  return `${categoryName}: ${quoteCounts.quotesByEventServiceId[service.id] ?? 0}/4`;
                })
                .join(" | ");
              const journey = customerEventJourneySteps({
                eventStatus: event.status,
                totalQuotes: quotesReceived,
                hasAcceptedQuote: acceptedEventIds.has(event.id),
              });
              return (
                <EventLeadCard
                  key={event.id}
                  variant="customer"
                  title={event.title}
                  eventDate={formatEventDateLabel(event.event_date)}
                  neighborhood={event.neighborhood}
                  budgetRange={event.budget_range}
                  services={services.length ? services : ["—"]}
                  quoteHeadline={quotes.headline}
                  quoteDetail={perServiceSummary || quotes.detail}
                  statusLabel={status.label}
                  statusTone={status.tone}
                  ctaHref={`/customer/events/${event.id}`}
                  ctaLabel="Manage event"
                  secondaryCtaHref={quotesReceived > 0 ? `/events/${event.id}` : undefined}
                  secondaryCtaLabel={quotesReceived > 0 ? "Compare layout" : undefined}
                  progressHint={customerEventJourneySummaryLine(journey)}
                />
              );
            })
          )}
        </div>
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2" id="quotes">
        <DashboardCard
          title="Quotes inbox"
          description="Quotes are organized on each event. Open an event to compare, accept, or decline — you are never charged as a host."
        >
          {totalQuotesReceived === 0 && events.length === 0 ? (
            <EmptyState
              title="No quotes yet (no events posted)"
              description="Post an event to start receiving structured proposals from Brooklyn vendors. Most events see the first quotes within a few days."
              action={<ButtonLink href="/post-event">Post your event</ButtonLink>}
            />
          ) : totalQuotesReceived === 0 ? (
            <EmptyState
              title="No quotes yet — that is normal early on"
              description="Vendors browse active events and respond when they are a fit. While you wait, tighten your event details or browse vendor profiles to shortlist styles you like."
              action={
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <ButtonLink href="/customer/dashboard#my-events">View my events</ButtonLink>
                  <ButtonLink href="/vendors" variant="secondary">
                    Browse vendors
                  </ButtonLink>
                </div>
              }
            />
          ) : (
            <div className="space-y-3 rounded-2xl border border-border-subtle bg-brand-navy/[0.03] px-5 py-6 text-left">
              <p className="text-sm font-semibold text-brand-navy">
                {totalQuotesReceived} quote{totalQuotesReceived === 1 ? "" : "s"} across your events
              </p>
              <p className="text-sm leading-relaxed text-brand-navy-muted">
                Open any event below, then use <span className="font-medium text-brand-navy">Compare layout</span> for
                a wide view of every proposal. Accepting a vendor is optional until you are ready.
              </p>
              <ButtonLink href="/customer/dashboard#my-events" variant="secondary" className="mt-2">
                Go to my events
              </ButtonLink>
            </div>
          )}
        </DashboardCard>

        <div
          id="profile"
          className="rounded-2xl border border-border-subtle bg-card bg-gradient-to-br from-accent-coral/10 via-white to-accent-blue/5 p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] sm:p-8"
        >
          <h2 className="text-lg font-semibold text-brand-navy">Ready for your next gathering?</h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-navy-muted">
            Post another event in minutes — same simple flow, up to four quotes per service, and you choose whether to
            book.
          </p>
          <ButtonLink href="/post-event" className="mt-6">
            Post another event
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
