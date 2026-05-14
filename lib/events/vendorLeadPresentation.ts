import type { EventServiceWithCategory } from "@/lib/events/types";

const QUOTE_CAP = 4;

/** Server-safe relative label for event listing (uses current time at render). */
export function formatPostedRelative(iso: string, nowMs: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) {
    return "Posted recently";
  }
  const diffMs = Math.max(0, nowMs - t);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) {
    return "Posted just now";
  }
  if (mins < 60) {
    return `Posted ${mins}m ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `Posted ${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "Posted yesterday";
  }
  if (days < 7) {
    return `Posted ${days} days ago`;
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function isEventNewlyPosted(iso: string, nowMs: number = Date.now(), maxAgeMs: number = 48 * 60 * 60 * 1000): boolean {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) {
    return false;
  }
  return nowMs - t <= maxAgeMs;
}

export function quoteSlotLineForService(quoteCount: number): { submitted: string; remaining: string; tone: "open" | "tight" | "full" } {
  const qc = Math.min(QUOTE_CAP, Math.max(0, Math.floor(quoteCount)));
  const rem = Math.max(0, QUOTE_CAP - qc);
  let tone: "open" | "tight" | "full" = "open";
  if (rem === 0) {
    tone = "full";
  } else if (rem === 1) {
    tone = "tight";
  }
  return {
    submitted: `${qc}/${QUOTE_CAP} quotes submitted`,
    remaining: rem === 0 ? "No spots left" : rem === 1 ? "Almost full — 1 spot left" : `${rem} spots remaining`,
    tone,
  };
}

export function aggregateEventQuotePressure(services: EventServiceWithCategory[] | null | undefined): {
  totalQuotes: number;
  minSpotsRemaining: number;
  maxQuotesOnAService: number;
  isLowCompetition: boolean;
  isHot: boolean;
} {
  const list = services ?? [];
  if (!list.length) {
    return { totalQuotes: 0, minSpotsRemaining: QUOTE_CAP, maxQuotesOnAService: 0, isLowCompetition: true, isHot: false };
  }
  const counts = list.map((s) => Math.min(QUOTE_CAP, Math.max(0, Number(s.current_quote_count ?? 0))));
  const totalQuotes = counts.reduce((a, b) => a + b, 0);
  const spotsRemaining = counts.map((c) => QUOTE_CAP - c);
  const minSpotsRemaining = Math.min(...spotsRemaining);
  const maxQuotesOnAService = Math.max(...counts, 0);
  const isLowCompetition = totalQuotes <= 3;
  const isHot = minSpotsRemaining <= 1 && minSpotsRemaining > 0;
  return { totalQuotes, minSpotsRemaining, maxQuotesOnAService, isLowCompetition, isHot };
}
