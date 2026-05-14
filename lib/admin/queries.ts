import { serverWarn } from "@/lib/logging/serverLog";
import { createClient } from "@/lib/supabase/server";
import { auditSinceIso, startOfTodayUtcIso } from "@/lib/admin/auditLogDateRange";
import {
  parseAdminCustomerSort,
  parseAdminEventSort,
  parseAdminVendorSort,
  rpcOptionalText,
  rpcStatusFilter,
} from "@/lib/filters/phase30Search";
import type {
  AdminAnalyticsSnapshot,
  AdminAuditLogDateRange,
  AdminAuditLogRow,
  AdminAuditLogSummary,
  AdminCreditAdjustmentListRow,
  AdminCustomerRow,
  AdminLowCreditVendorRow,
  AdminMarketplaceVendorRow,
  AdminMostActiveVendorRow,
  AdminPlatformHealth,
  AdminPlatformHealthAlerts,
  AdminPlatformHealthCreditPurchaseIssueRow,
  AdminPlatformHealthEventNoQuotesRow,
  AdminPlatformHealthIncompleteVendorRow,
  AdminPlatformHealthPendingApprovalRow,
  AdminProfilesSummary,
  AdminRecentEventRow,
  AdminRecentQuoteRow,
  AdminReviewRow,
  AdminTopEventCategoryRow,
  AdminMarketplaceCategorySupplyRow,
  AdminMarketplaceNeighborhoodDemandRow,
  AdminMarketplaceOpsAlerts,
  AdminMarketplaceQuoteFunnelSnapshot,
} from "@/lib/admin/types";

function toInt(value: number | string | null | undefined | unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export type AdminMarketplaceVendorListFilters = {
  query?: string;
  status?: string;
  visibility?: string;
  profile?: string;
  category?: string;
  area?: string;
  sort?: string;
};

function adminVisibilityRpc(value: string | undefined): string | null {
  const v = (value || "").trim().toLowerCase();
  if (v === "public" || v === "hidden") {
    return v;
  }
  return null;
}

function adminProfileRpc(value: string | undefined): string | null {
  const v = (value || "").trim().toLowerCase();
  if (v === "complete" || v === "incomplete") {
    return v;
  }
  return null;
}

export async function fetchAdminMarketplaceVendors(
  filters: AdminMarketplaceVendorListFilters = {},
): Promise<AdminMarketplaceVendorRow[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    serverWarn("ADMIN", "fetchAdminMarketplaceVendors: not authorized");
    return [];
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (adminProfile?.role !== "admin") {
    serverWarn("ADMIN", "fetchAdminMarketplaceVendors: not authorized");
    return [];
  }

  const { data, error } = await supabase.rpc("admin_fetch_marketplace_vendors", {
    p_query: rpcOptionalText(filters.query),
    p_status: rpcStatusFilter(filters.status),
    p_visibility: adminVisibilityRpc(filters.visibility),
    p_profile: adminProfileRpc(filters.profile),
    p_category: rpcOptionalText(filters.category),
    p_area: rpcOptionalText(filters.area),
    p_sort: parseAdminVendorSort(filters.sort),
  });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminMarketplaceVendors failed", { message: error.message });
    }
    return [];
  }

  return (data as AdminMarketplaceVendorRow[]).map((row) => ({
    ...row,
    bio: row.bio ?? null,
    business_phone: row.business_phone ?? null,
    service_areas: row.service_areas ?? null,
    logo_url: row.logo_url ?? null,
    cover_image_url: row.cover_image_url ?? null,
    website: row.website ?? null,
    instagram: row.instagram ?? null,
    facebook: row.facebook ?? null,
    tiktok: row.tiktok ?? null,
    is_public: row.is_public !== false,
    is_featured: Boolean(row.is_featured),
    admin_notes: row.admin_notes ?? null,
    credits_balance: toInt(row.credits_balance),
    status: typeof row.status === "string" ? row.status : "active",
    suspended_at: row.suspended_at ?? null,
    suspended_reason: row.suspended_reason ?? null,
  }));
}

export type AdminCustomerListFilters = {
  limit?: number;
  query?: string;
  status?: string;
  sort?: string;
};

export async function fetchAdminCustomers(filters: AdminCustomerListFilters = {}): Promise<AdminCustomerRow[]> {
  const supabase = await createClient();
  const limit = filters.limit ?? 200;
  const { data, error } = await supabase.rpc("admin_list_customers", {
    p_limit: limit,
    p_query: rpcOptionalText(filters.query),
    p_status: rpcStatusFilter(filters.status),
    p_sort: parseAdminCustomerSort(filters.sort),
  });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminCustomers failed", { message: error.message });
    }
    return [];
  }

  return (data as AdminCustomerRow[]).map((row) => ({
    ...row,
    status: typeof row.status === "string" ? row.status : "active",
    suspended_at: row.suspended_at ?? null,
    suspended_reason: row.suspended_reason ?? null,
    admin_notes: row.admin_notes ?? null,
    events_posted_count: toInt(row.events_posted_count),
  }));
}

export async function fetchAdminProfilesSummary(): Promise<AdminProfilesSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_profiles_summary");

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      serverWarn("RPC", "fetchAdminProfilesSummary failed", { message: error.message });
    }
    return null;
  }

  const row = data[0] as Record<string, number | string | null>;
  return {
    vendorTotal: toInt(row.vendor_total),
    vendorPublicListed: toInt(row.vendor_public_listed),
    vendorIncomplete: toInt(row.vendor_incomplete),
    vendorHidden: toInt(row.vendor_hidden),
    vendorFeaturedFlags: toInt(row.vendor_featured_flags),
    customerTotal: toInt(row.customer_total),
  };
}

export type AdminRecentEventsFilters = {
  limit?: number;
  query?: string;
  status?: string;
  neighborhood?: string;
  category?: string;
  sort?: string;
};

export async function fetchAdminRecentEvents(filters: AdminRecentEventsFilters = {}): Promise<AdminRecentEventRow[]> {
  const supabase = await createClient();
  const limit = filters.limit ?? 50;
  const { data, error } = await supabase.rpc("admin_list_recent_events", {
    p_limit: limit,
    p_query: rpcOptionalText(filters.query),
    p_status: rpcStatusFilter(filters.status),
    p_neighborhood: rpcOptionalText(filters.neighborhood),
    p_category: rpcOptionalText(filters.category),
    p_sort: parseAdminEventSort(filters.sort),
  });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminRecentEvents failed", { message: error.message });
    }
    return [];
  }

  return data as AdminRecentEventRow[];
}

export async function fetchAdminReviews(limit = 120): Promise<AdminReviewRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_reviews", { p_limit: limit });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminReviews failed", { message: error.message });
    }
    return [];
  }

  return data as AdminReviewRow[];
}

export async function fetchAdminRecentQuotes(limit = 80): Promise<AdminRecentQuoteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_recent_quotes", { p_limit: limit });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminRecentQuotes failed", { message: error.message });
    }
    return [];
  }

  return data as AdminRecentQuoteRow[];
}

export async function fetchAdminAnalyticsSnapshot(): Promise<AdminAnalyticsSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_analytics_snapshot");

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      serverWarn("RPC", "fetchAdminAnalyticsSnapshot failed", { message: error.message });
    }
    return null;
  }

  const row = data[0] as Record<string, number | string | null>;
  return {
    customerTotal: toInt(row.customer_total),
    vendorTotal: toInt(row.vendor_total),
    vendorActive: toInt(row.vendor_active),
    usersSuspended: toInt(row.users_suspended),
    eventsTotal: toInt(row.events_total),
    eventsOpen: toInt(row.events_open),
    eventsCompleted: toInt(row.events_completed),
    quotesTotal: toInt(row.quotes_total),
    quotesAccepted: toInt(row.quotes_accepted),
    quotesDeclined: toInt(row.quotes_declined),
    creditsPurchasedTotal: toInt(row.credits_purchased_total),
    creditsPromotionalGrantedTotal: toInt(row.credits_promotional_granted_total),
    vendorCreditsBalanceTotal: toInt(row.vendor_credits_balance_total),
    vendorsFeaturedCount: toInt(row.vendors_featured_count),
    vendorsPublicListedCount: toInt(row.vendors_public_listed_count),
    reviewsPendingCount: toInt(row.reviews_pending_count),
    reviewsApprovedCount: toInt(row.reviews_approved_count),
  };
}

export async function fetchAdminHealthLowCreditVendors(
  limit = 12,
  maxBalance = 10,
): Promise<AdminLowCreditVendorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_health_vendors_low_credits", {
    p_limit: limit,
    p_max_balance: maxBalance,
  });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminHealthLowCreditVendors failed", { message: error.message });
    }
    return [];
  }

  return (data as AdminLowCreditVendorRow[]).map((row) => ({
    ...row,
    credits_balance: toInt(row.credits_balance),
  }));
}

export async function fetchAdminHealthMostActiveVendors(limit = 10): Promise<AdminMostActiveVendorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_health_most_active_vendors", { p_limit: limit });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminHealthMostActiveVendors failed", { message: error.message });
    }
    return [];
  }

  return (data as AdminMostActiveVendorRow[]).map((row) => ({
    ...row,
    quote_count: toInt(row.quote_count),
    credits_balance: toInt(row.credits_balance),
  }));
}

export async function fetchAdminHealthTopEventCategories(limit = 10): Promise<AdminTopEventCategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_health_top_event_categories", { p_limit: limit });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminHealthTopEventCategories failed", { message: error.message });
    }
    return [];
  }

  return (data as AdminTopEventCategoryRow[]).map((row) => ({
    ...row,
    event_request_count: toInt(row.event_request_count),
  }));
}

export async function fetchAdminMarketplaceOpsSupplyDemandByCategory(): Promise<AdminMarketplaceCategorySupplyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_marketplace_ops_supply_demand_by_category");

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminMarketplaceOpsSupplyDemandByCategory failed", { message: error.message });
    }
    return [];
  }

  return (data as AdminMarketplaceCategorySupplyRow[]).map((row) => ({
    category_id: String(row.category_id ?? ""),
    category_name: typeof row.category_name === "string" ? row.category_name : "",
    category_slug: typeof row.category_slug === "string" ? row.category_slug : "",
    active_events: toInt(row.active_events),
    quote_volume: toInt(row.quote_volume),
    marketplace_vendor_supply: toInt(row.marketplace_vendor_supply),
  }));
}

export async function fetchAdminMarketplaceOpsQuoteFunnel(): Promise<AdminMarketplaceQuoteFunnelSnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_marketplace_ops_quote_funnel_snapshot");

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      serverWarn("RPC", "fetchAdminMarketplaceOpsQuoteFunnel failed", { message: error.message });
    }
    return null;
  }

  const row = data[0] as Record<string, number | string | null>;
  return {
    quotesTotal: toInt(row.quotes_total),
    quotesPending: toInt(row.quotes_pending),
    quotesAccepted: toInt(row.quotes_accepted),
    quotesDeclined: toInt(row.quotes_declined),
    acceptedRatePct: typeof row.accepted_rate_pct === "number" ? row.accepted_rate_pct : Number(row.accepted_rate_pct) || 0,
    activeEventsTotal: toInt(row.active_events_total),
    activeEventsWithQuotes: toInt(row.active_events_with_quotes),
    avgQuotesPerActiveEvent:
      typeof row.avg_quotes_per_active_event === "number"
        ? row.avg_quotes_per_active_event
        : Number(row.avg_quotes_per_active_event) || 0,
    quotesSubmittedLast7Days: toInt(row.quotes_submitted_last_7_days),
    distinctVendorsQuotingLast7Days: toInt(row.distinct_vendors_quoting_last_7_days),
    quotesSubmittedLast30Days: toInt(row.quotes_submitted_last_30_days),
  };
}

export async function fetchAdminMarketplaceOpsNeighborhoodDemand(
  limit = 35,
): Promise<AdminMarketplaceNeighborhoodDemandRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_marketplace_ops_neighborhood_demand", { p_limit: limit });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminMarketplaceOpsNeighborhoodDemand failed", { message: error.message });
    }
    return [];
  }

  return (data as AdminMarketplaceNeighborhoodDemandRow[]).map((row) => ({
    borough: typeof row.borough === "string" ? row.borough : "",
    neighborhood: typeof row.neighborhood === "string" ? row.neighborhood : "",
    active_events: toInt(row.active_events),
    quote_volume: toInt(row.quote_volume),
    avg_quotes_per_active_event:
      typeof row.avg_quotes_per_active_event === "number"
        ? row.avg_quotes_per_active_event
        : Number(row.avg_quotes_per_active_event) || 0,
  }));
}

function parseMarketplaceOpsAlertsRow(row: Record<string, unknown>): AdminMarketplaceOpsAlerts {
  const parseJsonArray = (raw: unknown): unknown[] => {
    if (Array.isArray(raw)) {
      return raw;
    }
    if (typeof raw === "string" && raw.trim()) {
      try {
        const v = JSON.parse(raw) as unknown;
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const zeroRaw = parseJsonArray(row.zero_quote_active_events);
  const zeroQuoteActiveEvents: AdminMarketplaceOpsAlerts["zeroQuoteActiveEvents"] = [];
  if (Array.isArray(zeroRaw)) {
    for (const item of zeroRaw) {
      const o = item as Record<string, unknown>;
      zeroQuoteActiveEvents.push({
        event_id: String(o.event_id ?? ""),
        title: typeof o.title === "string" ? o.title : "",
        neighborhood: typeof o.neighborhood === "string" ? o.neighborhood : "",
        status: typeof o.status === "string" ? o.status : "",
        customer_name: typeof o.customer_name === "string" ? o.customer_name : "",
        created_at: typeof o.created_at === "string" ? o.created_at : String(o.created_at ?? ""),
      });
    }
  }

  const gapRaw = parseJsonArray(row.category_supply_gaps);
  const categorySupplyGaps: AdminMarketplaceOpsAlerts["categorySupplyGaps"] = [];
  if (Array.isArray(gapRaw)) {
    for (const item of gapRaw) {
      const o = item as Record<string, unknown>;
      categorySupplyGaps.push({
        category_id: String(o.category_id ?? ""),
        category_name: typeof o.category_name === "string" ? o.category_name : "",
        category_slug: typeof o.category_slug === "string" ? o.category_slug : "",
        active_events: toInt(o.active_events),
        marketplace_vendor_supply: toInt(o.marketplace_vendor_supply),
      });
    }
  }

  const vRaw = parseJsonArray(row.marketplace_ready_vendors_no_quotes);
  const marketplaceReadyVendorsNoQuotes: AdminMarketplaceOpsAlerts["marketplaceReadyVendorsNoQuotes"] = [];
  if (Array.isArray(vRaw)) {
    for (const item of vRaw) {
      const o = item as Record<string, unknown>;
      marketplaceReadyVendorsNoQuotes.push({
        vendor_id: String(o.vendor_id ?? ""),
        full_name: typeof o.full_name === "string" ? o.full_name : "",
        business_name: o.business_name === null || typeof o.business_name === "string" ? o.business_name : null,
        slug: o.slug === null || typeof o.slug === "string" ? o.slug : null,
        created_at: typeof o.created_at === "string" ? o.created_at : String(o.created_at ?? ""),
      });
    }
  }

  const hotRaw = parseJsonArray(row.hot_neighborhoods);
  const hotNeighborhoods: AdminMarketplaceOpsAlerts["hotNeighborhoods"] = [];
  if (Array.isArray(hotRaw)) {
    for (const item of hotRaw) {
      const o = item as Record<string, unknown>;
      hotNeighborhoods.push({
        borough: typeof o.borough === "string" ? o.borough : "",
        neighborhood: typeof o.neighborhood === "string" ? o.neighborhood : "",
        active_events: toInt(o.active_events),
        quote_volume: toInt(o.quote_volume),
      });
    }
  }

  const capRaw = parseJsonArray(row.event_services_near_quote_cap);
  const eventServicesNearQuoteCap: AdminMarketplaceOpsAlerts["eventServicesNearQuoteCap"] = [];
  if (Array.isArray(capRaw)) {
    for (const item of capRaw) {
      const o = item as Record<string, unknown>;
      eventServicesNearQuoteCap.push({
        event_id: String(o.event_id ?? ""),
        event_title: typeof o.event_title === "string" ? o.event_title : "",
        neighborhood: typeof o.neighborhood === "string" ? o.neighborhood : "",
        category_name: typeof o.category_name === "string" ? o.category_name : "",
        slots_filled: toInt(o.slots_filled),
      });
    }
  }

  return {
    zeroQuoteActiveEvents: zeroQuoteActiveEvents.filter((r) => r.event_id.length > 0),
    categorySupplyGaps: categorySupplyGaps.filter((r) => r.category_id.length > 0),
    marketplaceReadyVendorsNoQuotes: marketplaceReadyVendorsNoQuotes.filter((r) => r.vendor_id.length > 0),
    hotNeighborhoods: hotNeighborhoods.filter((r) => r.neighborhood.length > 0),
    eventServicesNearQuoteCap: eventServicesNearQuoteCap.filter((r) => r.event_id.length > 0),
  };
}

export async function fetchAdminMarketplaceOpsAlerts(limit = 25): Promise<AdminMarketplaceOpsAlerts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_marketplace_ops_alerts", { p_limit: limit });

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      serverWarn("RPC", "fetchAdminMarketplaceOpsAlerts failed", { message: error.message });
    }
    return null;
  }

  return parseMarketplaceOpsAlertsRow(data[0] as Record<string, unknown>);
}

const CREDIT_AUDIT_ACTIONS = ["credits_granted", "credits_adjustment_recorded"] as const;

function normalizeAuditMetadata(meta: unknown): Record<string, unknown> {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return {};
}

export async function fetchAdminAuditLogs(options: {
  action?: string | null;
  entityType?: string | null;
  dateRange?: AdminAuditLogDateRange | null;
  limit?: number;
}): Promise<AdminAuditLogRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (adminProfile?.role !== "admin") {
    return [];
  }

  const action = options.action?.trim() ? options.action.trim() : null;
  const entityType = options.entityType?.trim() ? options.entityType.trim() : null;
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);
  const sinceIso = auditSinceIso(options.dateRange ?? null);

  let q = supabase
    .from("admin_audit_logs")
    .select("id, actor_id, actor_role, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action) {
    q = q.eq("action", action);
  }
  if (entityType) {
    q = q.eq("entity_type", entityType);
  }
  if (sinceIso) {
    q = q.gte("created_at", sinceIso);
  }

  const { data, error } = await q;

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminAuditLogs failed", { message: error.message });
    }
    return [];
  }

  return (data as AdminAuditLogRow[]).map((row) => ({
    ...row,
    metadata: normalizeAuditMetadata(row.metadata),
  }));
}

export async function fetchAdminAuditLogSummary(options: {
  action?: string | null;
  entityType?: string | null;
  dateRange?: AdminAuditLogDateRange | null;
}): Promise<AdminAuditLogSummary> {
  const empty: AdminAuditLogSummary = {
    totalMatching: 0,
    logsTodayUtc: 0,
    adminActionsInRange: 0,
    creditActionsInRange: 0,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return empty;
  }

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (adminProfile?.role !== "admin") {
    return empty;
  }

  const action = options.action?.trim() ? options.action.trim() : null;
  const entityType = options.entityType?.trim() ? options.entityType.trim() : null;
  const sinceIso = auditSinceIso(options.dateRange ?? null);
  const todayStart = startOfTodayUtcIso();

  let matchingQ = supabase.from("admin_audit_logs").select("*", { count: "exact", head: true });
  if (action) {
    matchingQ = matchingQ.eq("action", action);
  }
  if (entityType) {
    matchingQ = matchingQ.eq("entity_type", entityType);
  }
  if (sinceIso) {
    matchingQ = matchingQ.gte("created_at", sinceIso);
  }

  const todayQ = supabase.from("admin_audit_logs").select("*", { count: "exact", head: true }).gte("created_at", todayStart);

  let adminQ = supabase.from("admin_audit_logs").select("*", { count: "exact", head: true }).eq("actor_role", "admin");
  if (sinceIso) {
    adminQ = adminQ.gte("created_at", sinceIso);
  }

  let creditQ = supabase
    .from("admin_audit_logs")
    .select("*", { count: "exact", head: true })
    .in("action", [...CREDIT_AUDIT_ACTIONS]);
  if (sinceIso) {
    creditQ = creditQ.gte("created_at", sinceIso);
  }

  const [matchingRes, todayRes, adminRes, creditRes] = await Promise.all([
    matchingQ,
    todayQ,
    adminQ,
    creditQ,
  ]);

  if (matchingRes.error) {
    serverWarn("RPC", "fetchAdminAuditLogSummary total failed", { message: matchingRes.error.message });
  }
  if (todayRes.error) {
    serverWarn("RPC", "fetchAdminAuditLogSummary today failed", { message: todayRes.error.message });
  }
  if (adminRes.error) {
    serverWarn("RPC", "fetchAdminAuditLogSummary admin failed", { message: adminRes.error.message });
  }
  if (creditRes.error) {
    serverWarn("RPC", "fetchAdminAuditLogSummary credit failed", { message: creditRes.error.message });
  }

  return {
    totalMatching: matchingRes.count ?? 0,
    logsTodayUtc: todayRes.count ?? 0,
    adminActionsInRange: adminRes.count ?? 0,
    creditActionsInRange: creditRes.count ?? 0,
  };
}

export async function fetchAdminPlatformHealth(): Promise<AdminPlatformHealth | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_platform_health_snapshot");

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      serverWarn("RPC", "fetchAdminPlatformHealth failed", { message: error.message });
    }
    return null;
  }

  const row = data[0] as Record<string, number | string | null>;
  return {
    customerTotal: toInt(row.customer_total),
    vendorTotal: toInt(row.vendor_total),
    pendingVendors: toInt(row.pending_vendors),
    completedVendorProfiles: toInt(row.completed_vendor_profiles),
    openEvents: toInt(row.open_events),
    quoteVolume: toInt(row.quote_volume),
    messageVolume: toInt(row.message_volume),
    reviewVolume: toInt(row.review_volume),
    attentionItemsCount: toInt(row.attention_items_count),
  };
}

function jsonbRows(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw;
}

function parseAdminPlatformHealthAlertsRow(row: Record<string, unknown>): AdminPlatformHealthAlerts {
  const pendingApprovals = jsonbRows(row.pending_approvals).map((item) => {
    const o = item as Record<string, unknown>;
    return {
      vendor_id: String(o.vendor_id ?? ""),
      full_name: typeof o.full_name === "string" ? o.full_name : "",
      business_name: o.business_name === null || typeof o.business_name === "string" ? o.business_name : null,
      slug: o.slug === null || typeof o.slug === "string" ? o.slug : null,
      status: typeof o.status === "string" ? o.status : "active",
      created_at: typeof o.created_at === "string" ? o.created_at : String(o.created_at ?? ""),
    } satisfies AdminPlatformHealthPendingApprovalRow;
  });

  const activeEventsNoQuotes = jsonbRows(row.active_events_no_quotes).map((item) => {
    const o = item as Record<string, unknown>;
    return {
      event_id: String(o.event_id ?? ""),
      title: typeof o.title === "string" ? o.title : "",
      neighborhood: typeof o.neighborhood === "string" ? o.neighborhood : "",
      status: typeof o.status === "string" ? o.status : "",
      customer_name: typeof o.customer_name === "string" ? o.customer_name : "",
      created_at: typeof o.created_at === "string" ? o.created_at : String(o.created_at ?? ""),
    } satisfies AdminPlatformHealthEventNoQuotesRow;
  });

  const incompleteVendors = jsonbRows(row.incomplete_vendors).map((item) => {
    const o = item as Record<string, unknown>;
    return {
      vendor_id: String(o.vendor_id ?? ""),
      full_name: typeof o.full_name === "string" ? o.full_name : "",
      business_name: o.business_name === null || typeof o.business_name === "string" ? o.business_name : null,
      slug: o.slug === null || typeof o.slug === "string" ? o.slug : null,
      status: typeof o.status === "string" ? o.status : "active",
      created_at: typeof o.created_at === "string" ? o.created_at : String(o.created_at ?? ""),
    } satisfies AdminPlatformHealthIncompleteVendorRow;
  });

  const creditPurchaseIssues = jsonbRows(row.credit_purchase_issues).map((item) => {
    const o = item as Record<string, unknown>;
    return {
      id: String(o.id ?? ""),
      vendor_id: String(o.vendor_id ?? ""),
      status: typeof o.status === "string" ? o.status : "",
      credits_added: toInt(o.credits_added),
      amount_paid: toInt(o.amount_paid),
      stripe_session_id: typeof o.stripe_session_id === "string" ? o.stripe_session_id : "",
      created_at: typeof o.created_at === "string" ? o.created_at : String(o.created_at ?? ""),
      vendor_full_name: typeof o.vendor_full_name === "string" ? o.vendor_full_name : "",
      vendor_business_name:
        o.vendor_business_name === null || typeof o.vendor_business_name === "string" ? o.vendor_business_name : null,
    } satisfies AdminPlatformHealthCreditPurchaseIssueRow;
  });

  return {
    pendingApprovalCount: toInt(row.pending_approval_count),
    pendingApprovals: pendingApprovals.filter((r) => r.vendor_id.length > 0),
    activeEventsNoQuotesCount: toInt(row.active_events_no_quotes_count),
    activeEventsNoQuotes: activeEventsNoQuotes.filter((r) => r.event_id.length > 0),
    incompleteVendorCount: toInt(row.incomplete_vendor_count),
    incompleteVendors: incompleteVendors.filter((r) => r.vendor_id.length > 0),
    creditIssueCount: toInt(row.credit_issue_count),
    creditPurchaseIssues: creditPurchaseIssues.filter((r) => r.id.length > 0),
  };
}

export async function fetchAdminPlatformHealthAlerts(limit = 20): Promise<AdminPlatformHealthAlerts | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_platform_health_alerts", { p_limit: limit });

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      serverWarn("RPC", "fetchAdminPlatformHealthAlerts failed", { message: error.message });
    }
    return null;
  }

  return parseAdminPlatformHealthAlertsRow(data[0] as Record<string, unknown>);
}

export async function fetchAdminRecentCreditAdjustments(limit = 50): Promise<AdminCreditAdjustmentListRow[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

  if (adminProfile?.role !== "admin") {
    return [];
  }

  const { data, error } = await supabase.rpc("admin_fetch_recent_credit_adjustments", { p_limit: limit });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminRecentCreditAdjustments failed", { message: error.message });
    }
    return [];
  }

  return (data as AdminCreditAdjustmentListRow[]).map((row) => ({
    ...row,
    credits_added: toInt(row.credits_added),
    reason: typeof row.reason === "string" ? row.reason : "",
    adjustment_type: typeof row.adjustment_type === "string" ? row.adjustment_type : "",
    vendor_label: typeof row.vendor_label === "string" ? row.vendor_label : "Vendor",
    admin_label: typeof row.admin_label === "string" ? row.admin_label : "Admin",
  }));
}

export {
  fetchAdminCreditActivityBreakdown,
  fetchAdminMonthlyRevenue,
  fetchAdminRevenueOverview,
  fetchAdminTopSpendingVendors,
} from "@/lib/admin/revenue/queries";
