export type ReviewRow = {
  id: string;
  vendor_id: string;
  customer_id: string;
  event_id: string;
  quote_id: string;
  rating: number;
  review_text: string;
  is_public: boolean;
  created_at: string;
};

export type PublicVendorReview = Pick<ReviewRow, "id" | "rating" | "review_text" | "created_at">;

export type PublicVendorReviewsSummary = {
  average: number | null;
  total: number;
  items: PublicVendorReview[];
};

export type VendorDashboardReview = Pick<
  ReviewRow,
  "id" | "rating" | "review_text" | "is_public" | "created_at" | "event_id"
> & {
  event_title: string | null;
};
