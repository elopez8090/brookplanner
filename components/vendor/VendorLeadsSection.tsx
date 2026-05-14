import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ActiveFilterChips } from "@/components/filters/ActiveFilterChips";
import { CopyFilteredViewLink } from "@/components/filters/CopyFilteredViewLink";
import { DebouncedUrlKeywordInput } from "@/components/filters/DebouncedUrlKeywordInput";
import { FilterListEmptyState } from "@/components/filters/FilterListEmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { eventStatusPresentation, formatEventDateLabel, serviceNamesFromEvent } from "@/lib/events/presentation";
import type { VendorQuotedServiceMap } from "@/lib/events/queries";
import type { EventWithServices } from "@/lib/events/types";
import {
  aggregateEventQuotePressure,
  formatPostedRelative,
  isEventNewlyPosted,
  quoteSlotLineForService,
} from "@/lib/events/vendorLeadPresentation";
import { labelVendorLeadSort } from "@/lib/filters/filterChipLabels";
import { vendorLeadsResultLabel } from "@/lib/filters/filterResultLabels";
import type { VendorLeadSort } from "@/lib/filters/phase30Search";

function creditsRequiredToQuoteText(creditsRequired: number | null | undefined): string {
  const credits = Number.isFinite(creditsRequired) && Number(creditsRequired) > 0 ? Number(creditsRequired) : 1;
  return `Requires ${credits} ${credits === 1 ? "credit" : "credits"} to quote`;
}

export type VendorLeadsSectionProps = {
  actionPath: "/vendor/dashboard" | "/vendor/leads";
  leadQ: string;
  leadNeighborhood: string;
  leadCategory: string;
  leadSort: VendorLeadSort;
  events: EventWithServices[];
  categoryNames: string[];
  quotedMap: VendorQuotedServiceMap;
  /** When true, show concise guidance for vendors who have not submitted a quote yet. */
  showFirstQuoteGuidance?: boolean;
};

function buildVendorLeadFilterChips(input: {
  leadQ: string;
  leadNeighborhood: string;
  leadCategory: string;
  leadSort: VendorLeadSort;
}): { key: string; text: string }[] {
  const chips: { key: string; text: string }[] = [];
  const q = input.leadQ.trim();
  if (q) {
    chips.push({ key: "q", text: `Keyword: ${q}` });
  }
  const nb = input.leadNeighborhood.trim();
  if (nb) {
    chips.push({ key: "neighborhood", text: `Neighborhood contains: ${nb}` });
  }
  const cat = input.leadCategory.trim();
  if (cat) {
    chips.push({ key: "category", text: `Requested category: ${cat}` });
  }
  if (input.leadSort !== "event_date") {
    chips.push({ key: "sort", text: `Sort: ${labelVendorLeadSort(input.leadSort)}` });
  }
  return chips;
}

function vendorLeadHasActiveFilters(input: {
  leadQ: string;
  leadNeighborhood: string;
  leadCategory: string;
  leadSort: VendorLeadSort;
}): boolean {
  return (
    Boolean(input.leadQ.trim()) ||
    Boolean(input.leadNeighborhood.trim()) ||
    Boolean(input.leadCategory.trim()) ||
    input.leadSort !== "event_date"
  );
}

export function VendorLeadsSection({
  actionPath,
  leadQ,
  leadNeighborhood,
  leadCategory,
  leadSort,
  events,
  categoryNames,
  quotedMap,
  showFirstQuoteGuidance = false,
}: VendorLeadsSectionProps) {
  const filterChips = buildVendorLeadFilterChips({ leadQ, leadNeighborhood, leadCategory, leadSort });
  const hasActiveFilters = vendorLeadHasActiveFilters({ leadQ, leadNeighborhood, leadCategory, leadSort });
  // eslint-disable-next-line react-hooks/purity -- relative “posted … ago” labels for this server-rendered list
  const nowMs = Date.now();

  return (
    <DashboardCard
      id="leads"
      className="lg:col-span-2"
      title="Active Event Opportunities"
      description="Events from all customers with active status. Filters use the URL so you can save a view."
    >
      {showFirstQuoteGuidance ? (
        <div className="mb-6 rounded-xl border border-accent-blue/20 bg-accent-blue/[0.06] px-4 py-3 text-sm leading-relaxed text-brand-navy sm:px-5">
          <p className="font-semibold text-brand-navy">How quoting works</p>
          <p className="mt-1 text-brand-navy-muted">
            Open an opportunity, pick a requested service, and send one quote per service. Only four vendors can quote each service — when
            slots fill, the lead closes for new quotes. Credits are deducted as soon as your quote is recorded (per category rules).
          </p>
          <p className="mt-2 text-brand-navy-muted">
            Hosts often compare vendors quickly. Vendors who respond while a lead is fresh tend to win more events — check back for newly
            posted events and move fast when a fit looks right.
          </p>
        </div>
      ) : null}

      <form action={actionPath} method="get" className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="min-w-0">
          <label htmlFor="lead-q" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
            Keyword
          </label>
          <DebouncedUrlKeywordInput
            key={leadQ}
            id="lead-q"
            name="q"
            initialValue={leadQ}
            placeholder="Title, type, neighborhood"
            className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="lead-neighborhood" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
            Neighborhood contains
          </label>
          <input
            id="lead-neighborhood"
            name="neighborhood"
            defaultValue={leadNeighborhood}
            placeholder="e.g. Williamsburg"
            className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="lead-category" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
            Requested category
          </label>
          <select
            id="lead-category"
            name="category"
            defaultValue={leadCategory}
            className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          >
            <option value="">Any category</option>
            {categoryNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor="lead-sort" className="block text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
            Sort
          </label>
          <select
            id="lead-sort"
            name="sort"
            defaultValue={leadSort}
            className="mt-1.5 w-full min-w-0 rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy"
          >
            <option value="event_date">Soonest event first</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="quotes">Most quotes</option>
          </select>
        </div>
        <div className="flex min-w-0 w-full flex-col gap-2 md:col-span-2 lg:col-span-4 sm:flex-row sm:flex-wrap sm:items-stretch">
          <button
            type="submit"
            className="inline-flex w-full min-w-0 items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f] sm:w-auto"
          >
            Apply filters
          </button>
          <Link
            href={actionPath}
            className="inline-flex w-full min-w-0 items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition-colors hover:bg-slate-50 sm:w-auto"
          >
            Reset filters
          </Link>
          <CopyFilteredViewLink />
        </div>
      </form>

      <div className="mb-6 space-y-3">
        <ActiveFilterChips items={filterChips} />
        <p className="text-sm text-brand-navy-muted">{vendorLeadsResultLabel(events.length, hasActiveFilters)}</p>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <FilterListEmptyState
            variant={hasActiveFilters ? "no-results" : "no-records"}
            resourceNoun="active opportunities"
            resetHref={actionPath}
          />
        ) : (
          events.map((event) => {
            const status = eventStatusPresentation(event.status);
            const services = serviceNamesFromEvent(event.event_services);
            const serviceCreditLines = (event.event_services ?? [])
              .map((service) => {
                const category = Array.isArray(service.categories) ? service.categories[0] : service.categories;
                if (!category) {
                  return null;
                }
                return `${category.name}: ${creditsRequiredToQuoteText(category.credits_required)}`;
              })
              .filter((line): line is string => Boolean(line));
            const quotedServiceIds = new Set(quotedMap[event.id] ?? []);
            const totalServices = event.event_services?.length ?? 0;
            const totalQuotedOnEvent = quotedServiceIds.size;
            const pressure = aggregateEventQuotePressure(event.event_services);
            const postedLabel = formatPostedRelative(event.created_at, nowMs);
            const showNew = isEventNewlyPosted(event.created_at, nowMs);
            const cardRing =
              pressure.isLowCompetition && totalServices > 0
                ? "ring-2 ring-emerald-400/35 border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-card to-card"
                : pressure.isHot
                  ? "ring-1 ring-amber-300/50 border-amber-200/90 bg-gradient-to-br from-amber-50/30 to-card"
                  : "ring-1 ring-black/[0.03] border-border-subtle bg-card";
            return (
              <article
                key={event.id}
                className={`rounded-2xl border p-6 shadow-[var(--shadow-card)] ${cardRing}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-brand-navy">{event.title}</h3>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    {showNew ? (
                      <span className="inline-flex shrink-0 rounded-full bg-accent-blue/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-blue ring-1 ring-accent-blue/25">
                        New
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium text-brand-navy-muted">{postedLabel}</p>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
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
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Quote competition</dt>
                    <dd className="mt-1 text-sm font-medium text-brand-navy">
                      {totalServices > 0
                        ? `${pressure.totalQuotes} quote${pressure.totalQuotes === 1 ? "" : "s"} across ${totalServices} requested service${totalServices === 1 ? "" : "s"}`
                        : "No services"}
                    </dd>
                    {pressure.isLowCompetition && totalServices > 0 ? (
                      <p className="mt-1 text-xs font-semibold text-emerald-800">Lower competition on this lead right now</p>
                    ) : null}
                  </div>
                </dl>
                <div className="mt-4 rounded-xl border border-border-subtle bg-white/80 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Quote slots (per service)</p>
                  {event.event_services?.length ? (
                    <ul className="mt-2 space-y-2">
                      {event.event_services.map((svc) => {
                        const category = Array.isArray(svc.categories) ? svc.categories[0] : svc.categories;
                        const name = category?.name ?? "Service";
                        const qc = Number(svc.current_quote_count ?? 0);
                        const slot = quoteSlotLineForService(qc);
                        return (
                          <li key={svc.id} className="text-sm text-brand-navy">
                            <span className="font-semibold">{name}</span>
                            <span className="text-brand-navy-muted"> — </span>
                            <span className="tabular-nums">{slot.submitted}</span>
                            <span className="text-brand-navy-muted"> · </span>
                            <span className={slot.tone === "full" ? "font-medium text-amber-800" : slot.tone === "tight" ? "font-medium text-amber-800" : "text-brand-navy-muted"}>
                              {slot.remaining}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-brand-navy-muted">No services</p>
                  )}
                </div>
                <div className="mt-4 border-t border-border-subtle pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Services requested</p>
                  <p className="mt-1 text-sm text-brand-navy">
                    {services.length ? services.join(", ") : "No services selected"}
                  </p>
                  {serviceCreditLines.length ? (
                    <p className="mt-2 text-xs text-brand-navy-muted">{serviceCreditLines.join(" · ")}</p>
                  ) : null}
                </div>
                <p className="mt-3 text-xs font-medium text-brand-navy-muted">
                  You have quoted {totalQuotedOnEvent} of {totalServices} services for this event.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ButtonLink href={`/vendor/events/${event.id}`}>View Opportunity</ButtonLink>
                  {totalQuotedOnEvent > 0 ? (
                    <ButtonLink href={`/events/${event.id}`} variant="secondary">
                      Event hub
                    </ButtonLink>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </DashboardCard>
  );
}
