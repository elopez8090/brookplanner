import type { StatusTone } from "@/components/dashboard/StatusBadge";
import type { QuoteStatus } from "@/lib/events/types";

export function formatQuoteAmountUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function normalizeQuoteStatus(raw: string): QuoteStatus {
  if (raw === "accepted" || raw === "declined") {
    return raw;
  }
  return "pending";
}

export function formatEventDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function eventStatusPresentation(status: string): {
  label: string;
  tone: StatusTone;
} {
  switch (status) {
    case "active":
      return { label: "Collecting quotes", tone: "info" };
    case "draft":
      return { label: "Draft", tone: "neutral" };
    case "closed":
      return { label: "Closed", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

function categoryFromEmbed(embed: { name: string } | { name: string }[] | null | undefined): {
  name: string;
} | null {
  if (!embed) {
    return null;
  }
  if (Array.isArray(embed)) {
    const first = embed[0];
    return first && typeof first.name === "string" ? first : null;
  }
  return typeof embed.name === "string" ? embed : null;
}

export function serviceNamesFromEvent(
  services: { categories: { name: string } | { name: string }[] | null }[] | null | undefined,
): string[] {
  if (!services?.length) {
    return [];
  }
  return services
    .map((s) => categoryFromEmbed(s.categories)?.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0);
}

/** Max vendor quotes per service category shown to customers (UI copy; backend unchanged). */
export const CUSTOMER_QUOTE_CAP = 4;

export type CustomerQuoteProgressCopy = {
  headline: string;
  detail?: string;
};

/** Customer-facing quote progress lines (no vendor credit/cost language). */
export function customerQuoteProgress(received: number): CustomerQuoteProgressCopy {
  const n = Math.min(Math.max(0, Math.floor(received)), CUSTOMER_QUOTE_CAP);
  if (n === 0) {
    return {
      headline: "Waiting for vendor quotes",
      detail: "Up to 4 vendors can submit quotes.",
    };
  }
  return {
    headline: `${n} of ${CUSTOMER_QUOTE_CAP} quotes received`,
  };
}

/** Short label for public marketplace reviews (customer-safe). */
export function customerVendorPublicRatingLabel(avgRating: number | null, reviewCount: number): string | null {
  if (reviewCount <= 0 || avgRating === null || !Number.isFinite(avgRating)) {
    return null;
  }
  const rounded = Math.round(avgRating * 10) / 10;
  return `★ ${rounded.toFixed(1)} (${reviewCount})`;
}

export function quoteStatusPresentation(status: QuoteStatus | string): { label: string; tone: StatusTone } {
  switch (status) {
    case "pending":
      return { label: "Pending", tone: "info" };
    case "accepted":
      return { label: "Accepted", tone: "success" };
    case "declined":
      return { label: "Declined", tone: "neutral" };
    default:
      return { label: "Pending", tone: "info" };
  }
}

export type CustomerJourneyStepState = "done" | "current" | "upcoming";

export type CustomerEventJourneyStep = {
  id: "posted" | "quotes" | "compare" | "booked";
  label: string;
  hint: string;
  state: CustomerJourneyStepState;
};

/** Linear host journey for dashboards and event detail (no vendor-side pricing language). */
export function customerEventJourneySteps(input: {
  eventStatus: string;
  totalQuotes: number;
  hasAcceptedQuote: boolean;
}): CustomerEventJourneyStep[] {
  const isDraft = input.eventStatus === "draft";
  const isActive = input.eventStatus === "active";
  const isClosed = input.eventStatus === "closed";
  const q = input.totalQuotes;
  const booked = input.hasAcceptedQuote;

  const postedDone = !isDraft;
  const quotesDone = q >= 1;
  const compareDone = booked || (isClosed && q >= 1);
  const bookedDone = booked;

  let currentId: CustomerEventJourneyStep["id"] = "posted";
  if (isDraft) {
    currentId = "posted";
  } else if (isActive && q === 0) {
    currentId = "quotes";
  } else if (isActive && q >= 1 && !booked) {
    currentId = "compare";
  } else if (booked) {
    currentId = "booked";
  } else if (isClosed) {
    if (q >= 1) {
      currentId = "compare";
    } else {
      currentId = "quotes";
    }
  }

  const stateFor = (id: CustomerEventJourneyStep["id"], done: boolean): CustomerJourneyStepState => {
    if (done) {
      return "done";
    }
    if (id === currentId) {
      return "current";
    }
    return "upcoming";
  };

  return [
    {
      id: "posted",
      label: "Posted",
      hint: isDraft ? "Finish and publish to reach vendors." : "Your event is on the marketplace.",
      state: stateFor("posted", postedDone),
    },
    {
      id: "quotes",
      label: "Quotes in",
      hint: "Vendors submit proposals — nothing is booked until you accept.",
      state: stateFor("quotes", quotesDone),
    },
    {
      id: "compare",
      label: "Compare",
      hint: q < 2 && !booked ? "Waiting on more quotes? You can still review each offer as it arrives." : "Line up price, scope, and fit side by side.",
      state: stateFor("compare", compareDone),
    },
    {
      id: "booked",
      label: "Vendor chosen",
      hint: booked ? "You accepted a quote for at least one service." : "Accept the proposal you want to move forward with.",
      state: stateFor("booked", bookedDone),
    },
  ];
}

/** Account-level funnel (customer dashboard). Distinct from per-event `customerEventJourneySteps`. */
export type CustomerAccountJourneyPhase =
  | "new_customer"
  | "planning_event"
  | "comparing_quotes"
  | "vendor_selected";

export function customerAccountJourneyPhase(input: {
  events: { status: string }[];
  totalQuotesReceived: number;
  acceptedQuoteCount: number;
}): CustomerAccountJourneyPhase {
  if (input.acceptedQuoteCount > 0) {
    return "vendor_selected";
  }
  const hasPostedEvent = input.events.some((e) => e.status === "active" || e.status === "closed");
  if (!hasPostedEvent) {
    return "new_customer";
  }
  if (input.totalQuotesReceived === 0) {
    return "planning_event";
  }
  return "comparing_quotes";
}

export type CustomerOnboardingStepState = "done" | "current" | "upcoming";

export type CustomerOnboardingAccountStep = {
  id: "post" | "quotes" | "compare" | "choose";
  label: string;
  hint: string;
  state: CustomerOnboardingStepState;
};

/** Four-step host funnel for the customer dashboard onboarding card. */
export function customerOnboardingAccountSteps(phase: CustomerAccountJourneyPhase): CustomerOnboardingAccountStep[] {
  const stateFor = (id: CustomerOnboardingAccountStep["id"], done: boolean, currentId: typeof id): CustomerOnboardingStepState => {
    if (done) {
      return "done";
    }
    if (id === currentId) {
      return "current";
    }
    return "upcoming";
  };

  let currentId: CustomerOnboardingAccountStep["id"] = "post";
  if (phase === "new_customer") {
    currentId = "post";
  } else if (phase === "planning_event") {
    currentId = "quotes";
  } else if (phase === "comparing_quotes") {
    currentId = "compare";
  } else {
    currentId = "choose";
  }

  return [
    {
      id: "post",
      label: "Post your event",
      hint: "Share date, neighborhood, and services — posting is free.",
      state: stateFor("post", phase !== "new_customer", currentId),
    },
    {
      id: "quotes",
      label: "Receive quotes",
      hint: "Up to 4 vendor proposals per service category.",
      state: stateFor("quotes", phase === "comparing_quotes" || phase === "vendor_selected", currentId),
    },
    {
      id: "compare",
      label: "Compare vendors",
      hint: "Review scope, timing, fit, and messages before you decide.",
      state: stateFor("compare", phase === "vendor_selected", currentId),
    },
    {
      id: "choose",
      label: "Message / choose vendor",
      hint: "Accept when ready — then coordinate final details in messages.",
      state: stateFor("choose", phase === "vendor_selected", currentId),
    },
  ];
}

export function customerAccountJourneyTitle(phase: CustomerAccountJourneyPhase): string {
  switch (phase) {
    case "new_customer":
      return "New customer";
    case "planning_event":
      return "Planning event";
    case "comparing_quotes":
      return "Comparing quotes";
    case "vendor_selected":
      return "Vendor selected";
    default:
      return "Your journey";
  }
}

export function customerAccountJourneyDescription(phase: CustomerAccountJourneyPhase): string {
  switch (phase) {
    case "new_customer":
      return "Post a free event to reach Brooklyn vendors — no obligation until you accept a proposal.";
    case "planning_event":
      return "Your event is live. Vendors browse the marketplace and submit quotes when they are a fit.";
    case "comparing_quotes":
      return "You have proposals to review. Compare side by side, then accept only the vendor you want.";
    case "vendor_selected":
      return "You accepted a quote. Message your vendor to lock timing, scope, and any last questions.";
    default:
      return "";
  }
}

/** One-line hint for event cards (dashboard). */
export function customerEventJourneySummaryLine(steps: CustomerEventJourneyStep[]): string {
  const current = steps.find((s) => s.state === "current");
  if (current) {
    return `${current.label}: ${current.hint}`;
  }
  if (steps.every((s) => s.state === "done")) {
    return "Vendor booked — thank you for using Brook Planner.";
  }
  return "Track quotes and accept when you are ready.";
}

export type GroupedCustomerQuote<
  T extends { service_category_name: string | null; created_at: string; quote_amount: number; status: string },
> = {
  serviceLabel: string;
  quotes: T[];
};

export function groupCustomerQuotesByService<
  T extends { service_category_name: string | null; created_at: string; quote_amount: number; status: string },
>(quotes: T[]): GroupedCustomerQuote<T>[] {
  const map = new Map<string, T[]>();
  for (const row of quotes) {
    const label = row.service_category_name?.trim() || "Services";
    if (!map.has(label)) {
      map.set(label, []);
    }
    map.get(label)!.push(row);
  }
  return Array.from(map.entries())
    .map(([serviceLabel, group]) => ({
      serviceLabel,
      quotes: [...group].sort((a, b) => {
        const pendingBoost = (s: string) => (normalizeQuoteStatus(s) === "pending" ? 0 : 1);
        const pa = pendingBoost(a.status);
        const pb = pendingBoost(b.status);
        if (pa !== pb) {
          return pa - pb;
        }
        const amt = Number(a.quote_amount) - Number(b.quote_amount);
        if (amt !== 0) {
          return amt;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    }))
    .sort((a, b) => a.serviceLabel.localeCompare(b.serviceLabel));
}
