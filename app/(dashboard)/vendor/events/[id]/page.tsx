import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { VendorQuoteForm } from "@/components/events/VendorQuoteForm";
import { getUserProfile } from "@/lib/auth/getUserProfile";
import { fetchVendorActiveEventById, fetchVendorCreditSummary, fetchVendorQuotedServiceMap } from "@/lib/events/queries";
import type { EventServiceWithCategory } from "@/lib/events/types";
import { formatEventDateLabel, serviceNamesFromEvent } from "@/lib/events/presentation";

export const metadata: Metadata = {
  title: "Vendor opportunity",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function creditsRequiredToQuoteText(creditsRequired: number | null | undefined): string {
  const credits = Number.isFinite(creditsRequired) && Number(creditsRequired) > 0 ? Number(creditsRequired) : 1;
  return `Requires ${credits} ${credits === 1 ? "credit" : "credits"} to quote`;
}

function serviceCreditsLabel(services: EventServiceWithCategory[] | null): string {
  if (!services?.length) {
    return "No requested services";
  }

  const lines = services
    .map((s) => {
      const category = Array.isArray(s.categories) ? s.categories[0] : s.categories;
      if (!category) {
        return null;
      }
      return `${category.name}: ${creditsRequiredToQuoteText(category.credits_required)}`;
    })
    .filter((line): line is string => Boolean(line));

  return lines.length ? lines.join(" | ") : "No requested services";
}

function categoryNameFromService(service: EventServiceWithCategory): string {
  const category = Array.isArray(service.categories) ? service.categories[0] : service.categories;
  return category?.name ?? "Unknown category";
}

export default async function VendorEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { user, profile } = await getUserProfile();
  const event = await fetchVendorActiveEventById(id);

  if (!event || !user || !profile) {
    notFound();
  }

  const [quotedMap, creditSummary] = await Promise.all([
    fetchVendorQuotedServiceMap(user.id),
    fetchVendorCreditSummary(user.id),
  ]);
  const quotedServiceIds = new Set(quotedMap[id] ?? []);

  const services = serviceNamesFromEvent(event.event_services);
  const creditsPlaceholder = serviceCreditsLabel(event.event_services);
  const serviceRows = (event.event_services ?? []).map((service) => {
    const quoteCount = service.current_quote_count ?? 0;
    const spotsRemaining = Math.max(0, 4 - quoteCount);
    const category = Array.isArray(service.categories) ? service.categories[0] : service.categories;
    return {
      id: service.id,
      categoryName: categoryNameFromService(service),
      creditsRequired: category?.credits_required ?? 1,
      quoteCount,
      spotsRemaining,
      alreadyQuoted: quotedServiceIds.has(service.id),
    };
  });
  const availableToQuote = serviceRows.filter((row) => !row.alreadyQuoted && row.spotsRemaining > 0);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Opportunity details</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">{event.title}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Active event opportunity from the vendor lead board. Customer contact details stay private in this phase.
        </p>
        <ButtonLink href="/vendor/leads" variant="secondary">
          ← Back to opportunities
        </ButtonLink>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardCard title="Event overview">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Event type</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">{event.event_type}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Neighborhood</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">{event.neighborhood}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Event date</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">{formatEventDateLabel(event.event_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Guest count</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">{event.guest_count}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Budget range</dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">
                  {event.budget_range?.trim() ? event.budget_range : "Not specified"}
                </dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-border-subtle pt-6">
              <h3 className="text-sm font-semibold text-brand-navy">Event details</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-navy-muted">
                {event.details?.trim() ? event.details : "No additional event details provided."}
              </p>
            </div>
          </DashboardCard>
        </div>

        <div className="space-y-6">
          <DashboardCard title="Services requested">
            <p className="text-sm text-brand-navy">
              {services.length ? services.join(", ") : "No services selected"}
            </p>
          </DashboardCard>

          <DashboardCard title="Credits required per service">
            <p className="text-sm text-brand-navy-muted">{creditsPlaceholder}</p>
            <p className="mt-2 text-sm font-medium text-brand-navy">Your credit balance: {profile.credits_balance}</p>
          </DashboardCard>

          <DashboardCard title="Quote spots">
            {serviceRows.length ? (
              <ul className="space-y-2">
                {serviceRows.map((service) => (
                  <li key={service.id} className="rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm">
                    <p className="font-semibold text-brand-navy">{service.categoryName}</p>
                    <p className="mt-1 text-brand-navy-muted">
                      {service.quoteCount} of 4 quotes received ({service.spotsRemaining} spots remaining)
                    </p>
                    <p className="mt-1 text-brand-navy-muted">{creditsRequiredToQuoteText(service.creditsRequired)}</p>
                    {service.alreadyQuoted ? (
                      <p className="mt-1 text-xs font-medium text-accent-blue">
                        You already submitted a quote for this service.
                      </p>
                    ) : null}
                    {!service.alreadyQuoted && service.spotsRemaining === 0 ? (
                      <p className="mt-1 text-xs font-medium text-amber-700">This service already has 4 vendor quotes.</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-navy-muted">No requested services found for this event.</p>
            )}
          </DashboardCard>

          <DashboardCard title="Submit quote">
            <VendorQuoteForm
              eventId={event.id}
              services={availableToQuote.map((service) => ({
                id: service.id,
                categoryName: service.categoryName,
                creditsRequired: service.creditsRequired,
                quoteCount: service.quoteCount,
                spotsRemaining: service.spotsRemaining,
                alreadyQuoted: service.alreadyQuoted,
              }))}
              creditsBalance={Number(profile.credits_balance ?? 0)}
              emphasizeFirstQuote={creditSummary.quotesSubmitted === 0}
            />
          </DashboardCard>

          <ButtonLink href="/vendor/leads" variant="secondary" className="w-full justify-center">
            Back to opportunities
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
