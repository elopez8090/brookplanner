import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/types";
import type {
  CategoryRow,
  CreditTransactionRow,
  EventServiceWithCategory,
  EventWithServices,
  QuoteStatus,
  QuoteWithVendorProfile,
} from "@/lib/events/types";

const EVENT_WITH_SERVICES_SELECT = `
  id,
  customer_id,
  title,
  event_type,
  neighborhood,
  event_date,
  guest_count,
  budget_range,
  details,
  status,
  created_at,
  event_services (
    id,
    event_id,
    category_id,
    current_quote_count,
    categories ( id, name, slug, credits_required )
  )
`;

const EVENT_WITH_SERVICES_SELECT_LEGACY = `
  id,
  customer_id,
  title,
  event_type,
  neighborhood,
  event_date,
  guest_count,
  budget_range,
  details,
  status,
  created_at,
  event_services (
    id,
    event_id,
    category_id,
    categories ( id, name, slug, credits_required )
  )
`;

const CUSTOMER_EVENT_WITH_QUOTES_SELECT = `
  id,
  customer_id,
  title,
  event_type,
  neighborhood,
  event_date,
  guest_count,
  budget_range,
  details,
  status,
  created_at,
  event_services (
    id,
    event_id,
    category_id,
    current_quote_count,
    categories ( id, name, slug, credits_required ),
    quotes (
      id,
      event_service_id,
      vendor_id,
      quote_amount,
      message,
      what_is_included,
      availability_note,
      estimated_timeframe,
      business_phone,
      business_email,
      status,
      created_at,
      profiles ( full_name )
    )
  )
`;

const CUSTOMER_EVENT_WITH_QUOTES_SELECT_LEGACY = `
  id,
  customer_id,
  title,
  event_type,
  neighborhood,
  event_date,
  guest_count,
  budget_range,
  details,
  status,
  created_at,
  event_services (
    id,
    event_id,
    category_id,
    categories ( id, name, slug, credits_required ),
    quotes (
      id,
      event_service_id,
      vendor_id,
      quote_amount,
      message,
      what_is_included,
      availability_note,
      estimated_timeframe,
      business_phone,
      business_email,
      status,
      created_at,
      profiles ( full_name )
    )
  )
`;

function missingQuoteCountColumn(error: { message?: string } | null): boolean {
  const msg = error?.message?.toLowerCase() ?? "";
  return msg.includes("current_quote_count") && msg.includes("does not exist");
}

export async function fetchCategoriesForPosting(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, credits_required")
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchCategoriesForPosting", error.message);
    return [];
  }

  return (data ?? []) as CategoryRow[];
}

export async function fetchCustomerEvents(customerId: string): Promise<EventWithServices[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_WITH_SERVICES_SELECT)
    .eq("customer_id", customerId)
    .order("event_date", { ascending: true });

  if (missingQuoteCountColumn(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("events")
      .select(EVENT_WITH_SERVICES_SELECT_LEGACY)
      .eq("customer_id", customerId)
      .order("event_date", { ascending: true });
    if (legacyError) {
      console.error("fetchCustomerEvents", legacyError.message);
      return [];
    }
    return (legacyData ?? []) as unknown as EventWithServices[];
  }

  if (error) {
    console.error("fetchCustomerEvents", error.message);
    return [];
  }

  return (data ?? []) as unknown as EventWithServices[];
}

export type CustomerQuoteCounts = {
  totalQuotesReceived: number;
  quotesByEventServiceId: Record<string, number>;
};

export async function fetchCustomerQuoteCounts(customerId: string): Promise<CustomerQuoteCounts> {
  const supabase = await createClient();
  const { data: eventRows, error: eventError } = await supabase.from("events").select("id").eq("customer_id", customerId);

  if (eventError) {
    console.error("fetchCustomerQuoteCounts.events", eventError.message);
    return { totalQuotesReceived: 0, quotesByEventServiceId: {} };
  }

  const eventIds = (eventRows ?? []).map((row) => row.id).filter((id): id is string => typeof id === "string");
  if (eventIds.length === 0) {
    return { totalQuotesReceived: 0, quotesByEventServiceId: {} };
  }

  const { data: serviceRows, error: serviceError } = await supabase
    .from("event_services")
    .select("id, event_id")
    .in("event_id", eventIds);

  if (serviceError || !serviceRows?.length) {
    if (serviceError) {
      console.error("fetchCustomerQuoteCounts.event_services", serviceError.message);
    }
    return { totalQuotesReceived: 0, quotesByEventServiceId: {} };
  }

  const serviceIds = serviceRows.map((row) => row.id).filter((id): id is string => typeof id === "string");

  const { data: quoteRows, error: quoteError } = await supabase
    .from("quotes")
    .select("event_service_id")
    .in("event_service_id", serviceIds);

  if (quoteError) {
    console.error("fetchCustomerQuoteCounts.quotes", quoteError.message);
    return { totalQuotesReceived: 0, quotesByEventServiceId: {} };
  }

  const quotesByEventServiceId: Record<string, number> = {};
  let totalQuotesReceived = 0;
  for (const row of (quoteRows ?? []) as Array<{ event_service_id: string }>) {
    if (!row.event_service_id) {
      continue;
    }
    totalQuotesReceived += 1;
    quotesByEventServiceId[row.event_service_id] = (quotesByEventServiceId[row.event_service_id] ?? 0) + 1;
  }

  return { totalQuotesReceived, quotesByEventServiceId };
}

/** Event IDs where the customer has accepted at least one quote (for journey / dashboard). */
export async function fetchCustomerEventIdsWithAcceptedQuote(customerId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data: eventRows, error: eventError } = await supabase.from("events").select("id").eq("customer_id", customerId);

  if (eventError || !eventRows?.length) {
    if (eventError) {
      console.error("fetchCustomerEventIdsWithAcceptedQuote.events", eventError.message);
    }
    return new Set();
  }

  const eventIds = eventRows.map((r) => r.id).filter((id): id is string => typeof id === "string");
  const { data: serviceRows, error: serviceError } = await supabase
    .from("event_services")
    .select("id, event_id")
    .in("event_id", eventIds);

  if (serviceError || !serviceRows?.length) {
    if (serviceError) {
      console.error("fetchCustomerEventIdsWithAcceptedQuote.event_services", serviceError.message);
    }
    return new Set();
  }

  const serviceToEvent = new Map<string, string>();
  const serviceIds: string[] = [];
  for (const row of serviceRows as Array<{ id: string; event_id: string }>) {
    serviceToEvent.set(row.id, row.event_id);
    serviceIds.push(row.id);
  }

  const { data: quoteRows, error: quoteError } = await supabase
    .from("quotes")
    .select("event_service_id")
    .in("event_service_id", serviceIds)
    .eq("status", "accepted");

  if (quoteError || !quoteRows?.length) {
    if (quoteError) {
      console.error("fetchCustomerEventIdsWithAcceptedQuote.quotes", quoteError.message);
    }
    return new Set();
  }

  const out = new Set<string>();
  for (const row of quoteRows as Array<{ event_service_id: string }>) {
    const eid = serviceToEvent.get(row.event_service_id);
    if (eid) {
      out.add(eid);
    }
  }
  return out;
}

export async function fetchCustomerAcceptedQuoteCount(customerId: string): Promise<number> {
  const supabase = await createClient();
  const { data: eventRows, error: eventError } = await supabase.from("events").select("id").eq("customer_id", customerId);

  if (eventError || !eventRows?.length) {
    if (eventError) {
      console.error("fetchCustomerAcceptedQuoteCount.events", eventError.message);
    }
    return 0;
  }

  const eventIds = eventRows.map((r) => r.id).filter((id): id is string => typeof id === "string");
  const { data: serviceRows, error: serviceError } = await supabase
    .from("event_services")
    .select("id")
    .in("event_id", eventIds);

  if (serviceError || !serviceRows?.length) {
    if (serviceError) {
      console.error("fetchCustomerAcceptedQuoteCount.event_services", serviceError.message);
    }
    return 0;
  }

  const serviceIds = (serviceRows as Array<{ id: string }>).map((r) => r.id);
  const { count, error: quoteError } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .in("event_service_id", serviceIds)
    .eq("status", "accepted");

  if (quoteError) {
    console.error("fetchCustomerAcceptedQuoteCount.quotes", quoteError.message);
    return 0;
  }

  return count ?? 0;
}

export async function fetchCustomerEventById(
  customerId: string,
  eventId: string,
): Promise<EventWithServices | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_WITH_SERVICES_SELECT)
    .eq("id", eventId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (missingQuoteCountColumn(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("events")
      .select(EVENT_WITH_SERVICES_SELECT_LEGACY)
      .eq("id", eventId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (legacyError) {
      console.error("fetchCustomerEventById", legacyError.message);
      return null;
    }
    return (legacyData as unknown as EventWithServices | null) ?? null;
  }

  if (error) {
    console.error("fetchCustomerEventById", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return data as unknown as EventWithServices;
}

export type VendorActiveEventsFilters = {
  query?: string;
  neighborhood?: string;
  category?: string;
  sort?: "event_date" | "newest" | "oldest" | "quotes";
};

export async function fetchVendorActiveEvents(filters: VendorActiveEventsFilters = {}): Promise<EventWithServices[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("vendor_list_active_events", {
    p_query: filters.query?.trim() || null,
    p_neighborhood: filters.neighborhood?.trim() || null,
    p_category: filters.category?.trim() || null,
    p_sort: filters.sort ?? "event_date",
  });

  if (error) {
    console.error("fetchVendorActiveEvents", error.message);
    return [];
  }

  return (data ?? []) as unknown as EventWithServices[];
}

export async function fetchVendorActiveEventById(eventId: string): Promise<EventWithServices | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_WITH_SERVICES_SELECT)
    .eq("id", eventId)
    .eq("status", "active")
    .maybeSingle();

  if (missingQuoteCountColumn(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("events")
      .select(EVENT_WITH_SERVICES_SELECT_LEGACY)
      .eq("id", eventId)
      .eq("status", "active")
      .maybeSingle();
    if (legacyError) {
      console.error("fetchVendorActiveEventById", legacyError.message);
      return null;
    }
    return (legacyData as unknown as EventWithServices | null) ?? null;
  }

  if (error) {
    console.error("fetchVendorActiveEventById", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return data as unknown as EventWithServices;
}

/** Event row when allowed by RLS (customer owner, admin, or vendor who quoted). */
export async function fetchEventByIdForViewer(eventId: string): Promise<EventWithServices | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select(EVENT_WITH_SERVICES_SELECT).eq("id", eventId).maybeSingle();

  if (missingQuoteCountColumn(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("events")
      .select(EVENT_WITH_SERVICES_SELECT_LEGACY)
      .eq("id", eventId)
      .maybeSingle();
    if (legacyError) {
      console.error("fetchEventByIdForViewer", legacyError.message);
      return null;
    }
    return (legacyData as unknown as EventWithServices | null) ?? null;
  }

  if (error) {
    console.error("fetchEventByIdForViewer", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return data as unknown as EventWithServices;
}

export type QuoteVendorCardProfile = {
  vendor_id: string;
  full_name: string | null;
  business_name: string | null;
  slug: string | null;
  service_areas: string | null;
  logo_url: string | null;
  /** Public reviews only; null/0 when none (RPC phase 32). */
  public_review_count?: number | string | null;
  public_avg_rating?: number | string | null;
};

export async function fetchQuoteVendorProfilesForCustomerEvent(eventId: string): Promise<QuoteVendorCardProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("customer_quote_vendor_profiles", { p_event_id: eventId });

  if (error) {
    console.error("fetchQuoteVendorProfilesForCustomerEvent", error.message);
    return [];
  }

  return (data ?? []) as QuoteVendorCardProfile[];
}

export type EventDetailQuoteRow = {
  id: string;
  event_service_id: string;
  vendor_id: string;
  quote_amount: number;
  message: string;
  what_is_included: string | null;
  availability_note: string | null;
  estimated_timeframe: string | null;
  status: QuoteStatus | string;
  created_at: string;
  service_category_name: string | null;
};

function categoryNameFromQuoteEmbed(
  embed:
    | {
        categories: { name: string } | { name: string }[] | null;
      }
    | {
        categories: { name: string } | { name: string }[] | null;
      }[]
    | null,
): string | null {
  const row = Array.isArray(embed) ? embed[0] : embed;
  const cat = row?.categories;
  const name = Array.isArray(cat) ? cat[0]?.name : cat?.name;
  return typeof name === "string" && name.length > 0 ? name : null;
}

export async function fetchQuotesForEventDetail(params: {
  eventId: string;
  viewerRole: UserRole;
  viewerId: string;
}): Promise<EventDetailQuoteRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("quotes")
    .select(
      `
      id,
      event_service_id,
      vendor_id,
      quote_amount,
      message,
      what_is_included,
      availability_note,
      estimated_timeframe,
      status,
      created_at,
      event_services!inner(
        event_id,
        categories(name)
      )
    `,
    )
    .eq("event_services.event_id", params.eventId)
    .order("created_at", { ascending: false });

  if (params.viewerRole === "vendor") {
    query = query.eq("vendor_id", params.viewerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchQuotesForEventDetail", error.message);
    return [];
  }

  type RawRow = {
    id: string;
    event_service_id: string;
    vendor_id: string;
    quote_amount: number;
    message: string;
    what_is_included: string | null;
    availability_note: string | null;
    estimated_timeframe: string | null;
    status: QuoteStatus | string;
    created_at: string;
    event_services:
      | {
          event_id: string;
          categories: { name: string } | { name: string }[] | null;
        }
      | {
          event_id: string;
          categories: { name: string } | { name: string }[] | null;
        }[]
      | null;
  };

  return ((data ?? []) as RawRow[]).map((row) => {
    const es = row.event_services;
    const esRow = Array.isArray(es) ? es[0] : es;
    return {
      id: row.id,
      event_service_id: row.event_service_id,
      vendor_id: row.vendor_id,
      quote_amount: Number(row.quote_amount),
      message: row.message,
      what_is_included: row.what_is_included,
      availability_note: row.availability_note,
      estimated_timeframe: row.estimated_timeframe,
      status: row.status,
      created_at: row.created_at,
      service_category_name: categoryNameFromQuoteEmbed(esRow ?? null),
    };
  });
}

export type VendorQuotedServiceMap = Record<string, string[]>;

export async function fetchVendorQuotedServiceMap(vendorId: string): Promise<VendorQuotedServiceMap> {
  const supabase = await createClient();
  void vendorId;
  const { data, error } = await supabase.rpc("vendor_list_quoted_service_ids");

  if (error || !data) {
    if (error) {
      console.error("fetchVendorQuotedServiceMap", error.message);
    }
    return {};
  }

  const map: VendorQuotedServiceMap = {};
  for (const row of data as Array<{
    event_id: string;
    event_service_id: string;
  }>) {
    const eventId = row.event_id;
    if (!eventId) {
      continue;
    }
    if (!map[eventId]) {
      map[eventId] = [];
    }
    map[eventId].push(row.event_service_id);
  }
  return map;
}

export type CustomerEventWithQuotes = EventWithServices & {
  event_services: (EventServiceWithCategory & { quotes: QuoteWithVendorProfile[] | null })[] | null;
};

export async function fetchCustomerEventByIdWithQuotes(
  customerId: string,
  eventId: string,
): Promise<CustomerEventWithQuotes | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(CUSTOMER_EVENT_WITH_QUOTES_SELECT)
    .eq("id", eventId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (missingQuoteCountColumn(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("events")
      .select(CUSTOMER_EVENT_WITH_QUOTES_SELECT_LEGACY)
      .eq("id", eventId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (legacyError) {
      console.error("fetchCustomerEventByIdWithQuotes", legacyError.message);
      return null;
    }
    return (legacyData as unknown as CustomerEventWithQuotes | null) ?? null;
  }

  if (error) {
    console.error("fetchCustomerEventByIdWithQuotes", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return data as unknown as CustomerEventWithQuotes;
}

export type VendorCreditSummary = {
  creditsBalance: number;
  creditsUsed: number;
  quotesSubmitted: number;
};

/** True when the vendor has at least one ledger row for a paid credit purchase (Stripe webhook). */
export async function fetchVendorHasCompletedCreditPurchase(vendorId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("credit_transactions")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .eq("type", "purchase")
    .gt("amount", 0);

  if (error) {
    console.error("fetchVendorHasCompletedCreditPurchase", error.message);
    return false;
  }

  return (count ?? 0) > 0;
}

export async function fetchVendorCreditSummary(vendorId: string): Promise<VendorCreditSummary> {
  const supabase = await createClient();
  const [{ data: profile }, { data: quoteTxRows }, { count: quotesSubmitted }] = await Promise.all([
    supabase.from("profiles").select("credits_balance").eq("id", vendorId).maybeSingle(),
    supabase.from("credit_transactions").select("amount").eq("vendor_id", vendorId).eq("type", "quote_spend"),
    supabase.from("quotes").select("id", { head: true, count: "exact" }).eq("vendor_id", vendorId),
  ]);

  const creditsBalance = profile?.credits_balance ?? 0;
  const creditsUsed = Math.abs(
    (quoteTxRows ?? []).reduce((sum, row) => sum + (Number(row.amount) < 0 ? Number(row.amount) : 0), 0),
  );

  return {
    creditsBalance,
    creditsUsed,
    quotesSubmitted: quotesSubmitted ?? 0,
  };
}

export async function fetchVendorCreditTransactions(
  vendorId: string,
  limit = 20,
): Promise<CreditTransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("id, vendor_id, amount, type, description, quote_id, created_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) {
      console.error("fetchVendorCreditTransactions", error.message);
    }
    return [];
  }

  return data as CreditTransactionRow[];
}

export async function fetchRecentCreditTransactions(limit = 20): Promise<CreditTransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("id, vendor_id, amount, type, description, quote_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) {
      console.error("fetchRecentCreditTransactions", error.message);
    }
    return [];
  }

  return data as CreditTransactionRow[];
}

export type VendorSubmittedQuote = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  neighborhood: string;
  serviceName: string | null;
  quoteAmount: number;
  message: string;
  status: QuoteStatus | string;
  createdAt: string;
};

export async function fetchVendorSubmittedQuotes(vendorId: string): Promise<VendorSubmittedQuote[]> {
  const supabase = await createClient();
  void vendorId;
  const { data, error } = await supabase.rpc("vendor_list_submitted_quotes");

  if (error || !data) {
    if (error) {
      console.error("fetchVendorSubmittedQuotes", error.message);
    }
    return [];
  }

  type VendorSubmittedQuoteRpcRow = {
    id: string;
    event_id: string;
    event_title: string;
    event_date: string;
    neighborhood: string;
    service_name: string | null;
    quote_amount: number;
    message: string;
    status: QuoteStatus | string;
    created_at: string;
  };

  return (data as VendorSubmittedQuoteRpcRow[]).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event_title,
    eventDate: row.event_date,
    neighborhood: row.neighborhood,
    serviceName: row.service_name,
    quoteAmount: Number(row.quote_amount),
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  }));
}
