export type EventStatus = "active" | "draft" | "closed";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  credits_required: number;
};

export type EventRow = {
  id: string;
  customer_id: string;
  title: string;
  event_type: string;
  neighborhood: string;
  event_date: string;
  guest_count: number;
  budget_range: string;
  details: string;
  status: EventStatus;
  created_at: string;
};

export type EventServiceWithCategory = {
  id: string;
  event_id: string;
  category_id: string;
  current_quote_count?: number;
  categories:
    | Pick<CategoryRow, "id" | "name" | "slug" | "credits_required">
    | Pick<CategoryRow, "id" | "name" | "slug" | "credits_required">[]
    | null;
};

export type EventWithServices = EventRow & {
  event_services: EventServiceWithCategory[] | null;
};

export type QuoteStatus = "pending" | "accepted" | "declined";

export type QuoteRow = {
  id: string;
  event_service_id: string;
  vendor_id: string;
  quote_amount: number;
  message: string;
  what_is_included: string | null;
  availability_note: string | null;
  estimated_timeframe: string | null;
  business_phone: string | null;
  business_email: string | null;
  status: QuoteStatus | string;
  created_at: string;
};

export type QuoteWithVendorProfile = QuoteRow & {
  profiles: { full_name: string | null } | null;
};

export type CreditTransactionRow = {
  id: string;
  vendor_id: string;
  amount: number;
  type: string;
  description: string | null;
  quote_id: string | null;
  created_at: string;
};
