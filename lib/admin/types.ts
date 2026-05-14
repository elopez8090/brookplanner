export type AdminCreditAdjustmentListRow = {
  id: string;
  vendor_id: string;
  admin_id: string;
  credits_added: number;
  reason: string;
  adjustment_type: string;
  created_at: string;
  vendor_label: string;
  admin_label: string;
};

export type AdminMarketplaceVendorRow = {
  id: string;
  full_name: string;
  business_name: string | null;
  slug: string | null;
  bio: string | null;
  business_phone: string | null;
  service_areas: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  is_profile_complete: boolean;
  is_public: boolean;
  is_featured: boolean;
  admin_notes: string | null;
  created_at: string;
  credits_balance: number;
  status: string;
  suspended_at: string | null;
  suspended_reason: string | null;
};

export type AdminCustomerRow = {
  id: string;
  full_name: string;
  status: string;
  suspended_at: string | null;
  suspended_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  events_posted_count: number;
};

export type AdminProfilesSummary = {
  vendorTotal: number;
  vendorPublicListed: number;
  vendorIncomplete: number;
  vendorHidden: number;
  vendorFeaturedFlags: number;
  customerTotal: number;
};

export type AdminRecentEventRow = {
  id: string;
  title: string;
  neighborhood: string;
  status: string;
  created_at: string;
  customer_name: string;
};

export type AdminRecentQuoteRow = {
  id: string;
  quote_amount: number | string;
  quote_status: string;
  created_at: string;
  vendor_business_name: string | null;
  vendor_full_name: string;
  event_title: string;
  event_neighborhood: string;
  event_status: string;
};

export type AdminReviewRow = {
  id: string;
  vendor_id: string;
  vendor_label: string;
  vendor_slug: string | null;
  customer_id: string;
  customer_label: string;
  event_id: string;
  event_title: string;
  quote_id: string;
  rating: number;
  review_text: string;
  is_public: boolean;
  created_at: string;
};

export type AdminAnalyticsSnapshot = {
  customerTotal: number;
  vendorTotal: number;
  vendorActive: number;
  usersSuspended: number;
  eventsTotal: number;
  eventsOpen: number;
  eventsCompleted: number;
  quotesTotal: number;
  quotesAccepted: number;
  quotesDeclined: number;
  creditsPurchasedTotal: number;
  creditsPromotionalGrantedTotal: number;
  vendorCreditsBalanceTotal: number;
  vendorsFeaturedCount: number;
  vendorsPublicListedCount: number;
  reviewsPendingCount: number;
  reviewsApprovedCount: number;
};

export type AdminLowCreditVendorRow = {
  vendor_id: string;
  full_name: string;
  business_name: string | null;
  slug: string | null;
  credits_balance: number;
  status: string;
};

export type AdminMostActiveVendorRow = {
  vendor_id: string;
  full_name: string;
  business_name: string | null;
  slug: string | null;
  quote_count: number;
  credits_balance: number;
};

export type AdminTopEventCategoryRow = {
  category_id: string;
  category_name: string;
  category_slug: string;
  event_request_count: number;
};

export type AdminRevenueOverview = {
  totalRevenueCents: number;
  totalCreditPurchases: number;
  totalCreditsSold: number;
  totalPromotionalCredits: number;
  totalCreditsSpent: number;
  totalCreditsRemaining: number;
  estimatedCreditLiabilityCents: number;
  activePayingVendors: number;
  averagePurchaseValueCents: number;
};

export type AdminMonthlyRevenueRow = {
  month: string;
  revenueCents: number;
  purchasesCount: number;
  creditsSold: number;
};

export type AdminTopSpendingVendorRow = {
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  totalSpentCents: number;
  creditsPurchased: number;
  /** Admin grants with adjustment_type promotional or bonus (not Stripe purchases). */
  promotionalCreditsGranted: number;
  creditsSpent: number;
  creditsRemaining: number;
  purchaseCount: number;
};

export type AdminCreditActivityBreakdown = {
  purchasedCredits: number;
  promotionalCredits: number;
  spentCredits: number;
  remainingCredits: number;
  liabilityCents: number;
};

export type AdminAuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

/** URL param values for `/admin/audit-logs` date presets (UTC-relative). */
export type AdminAuditLogDateRange = "today" | "7d" | "30d";

export type AdminAuditLogSummary = {
  /** Rows matching list filters (action, entity, date range). */
  totalMatching: number;
  /** All rows since UTC midnight today (ignores action/entity filters). */
  logsTodayUtc: number;
  /** Rows with `actor_role = admin` within the selected date range (ignores action/entity filters). */
  adminActionsInRange: number;
  /** Credit grant/adjustment actions within the selected date range (ignores action/entity filters). */
  creditActionsInRange: number;
};

export type AdminPlatformHealth = {
  customerTotal: number;
  vendorTotal: number;
  pendingVendors: number;
  completedVendorProfiles: number;
  openEvents: number;
  quoteVolume: number;
  messageVolume: number;
  reviewVolume: number;
  attentionItemsCount: number;
};

export type AdminPlatformHealthPendingApprovalRow = {
  vendor_id: string;
  full_name: string;
  business_name: string | null;
  slug: string | null;
  status: string;
  created_at: string;
};

export type AdminPlatformHealthEventNoQuotesRow = {
  event_id: string;
  title: string;
  neighborhood: string;
  status: string;
  customer_name: string;
  created_at: string;
};

export type AdminPlatformHealthIncompleteVendorRow = {
  vendor_id: string;
  full_name: string;
  business_name: string | null;
  slug: string | null;
  status: string;
  created_at: string;
};

export type AdminPlatformHealthCreditPurchaseIssueRow = {
  id: string;
  vendor_id: string;
  status: string;
  credits_added: number;
  amount_paid: number;
  stripe_session_id: string;
  created_at: string;
  vendor_full_name: string;
  vendor_business_name: string | null;
};

export type AdminPlatformHealthAlerts = {
  pendingApprovalCount: number;
  pendingApprovals: AdminPlatformHealthPendingApprovalRow[];
  activeEventsNoQuotesCount: number;
  activeEventsNoQuotes: AdminPlatformHealthEventNoQuotesRow[];
  incompleteVendorCount: number;
  incompleteVendors: AdminPlatformHealthIncompleteVendorRow[];
  creditIssueCount: number;
  creditPurchaseIssues: AdminPlatformHealthCreditPurchaseIssueRow[];
};

/** Phase 38: category supply vs active demand (no pricing). */
export type AdminMarketplaceCategorySupplyRow = {
  category_id: string;
  category_name: string;
  category_slug: string;
  active_events: number;
  quote_volume: number;
  marketplace_vendor_supply: number;
};

export type AdminMarketplaceQuoteFunnelSnapshot = {
  quotesTotal: number;
  quotesPending: number;
  quotesAccepted: number;
  quotesDeclined: number;
  acceptedRatePct: number;
  activeEventsTotal: number;
  activeEventsWithQuotes: number;
  avgQuotesPerActiveEvent: number;
  quotesSubmittedLast7Days: number;
  distinctVendorsQuotingLast7Days: number;
  quotesSubmittedLast30Days: number;
};

export type AdminMarketplaceNeighborhoodDemandRow = {
  borough: string;
  neighborhood: string;
  active_events: number;
  quote_volume: number;
  avg_quotes_per_active_event: number;
};

export type AdminMarketplaceOpsZeroQuoteEventRow = {
  event_id: string;
  title: string;
  neighborhood: string;
  status: string;
  customer_name: string;
  created_at: string;
};

export type AdminMarketplaceOpsCategoryGapRow = {
  category_id: string;
  category_name: string;
  category_slug: string;
  active_events: number;
  marketplace_vendor_supply: number;
};

export type AdminMarketplaceOpsVendorNoQuotesRow = {
  vendor_id: string;
  full_name: string;
  business_name: string | null;
  slug: string | null;
  created_at: string;
};

export type AdminMarketplaceOpsHotNeighborhoodRow = {
  borough: string;
  neighborhood: string;
  active_events: number;
  quote_volume: number;
};

export type AdminMarketplaceOpsNearCapRow = {
  event_id: string;
  event_title: string;
  neighborhood: string;
  category_name: string;
  slots_filled: number;
};

export type AdminMarketplaceOpsAlerts = {
  zeroQuoteActiveEvents: AdminMarketplaceOpsZeroQuoteEventRow[];
  categorySupplyGaps: AdminMarketplaceOpsCategoryGapRow[];
  marketplaceReadyVendorsNoQuotes: AdminMarketplaceOpsVendorNoQuotesRow[];
  hotNeighborhoods: AdminMarketplaceOpsHotNeighborhoodRow[];
  eventServicesNearQuoteCap: AdminMarketplaceOpsNearCapRow[];
};
