/** Values emitted by Phase 29 audit logging (SQL triggers + admin RPCs). */

export const AUDIT_ACTION_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All actions" },
  { value: "vendor_approved", label: "Vendor approved (listed)" },
  { value: "vendor_rejected", label: "Vendor rejected (delisted)" },
  { value: "vendor_marketplace_updated", label: "Vendor marketplace updated" },
  { value: "credits_granted", label: "Credits granted" },
  { value: "credits_adjustment_recorded", label: "Credits adjustment recorded" },
  { value: "quote_accepted", label: "Quote accepted" },
  { value: "quote_declined", label: "Quote declined" },
  { value: "event_created", label: "Event created" },
  { value: "vendor_profile_completed", label: "Vendor profile completed" },
  { value: "review_submitted", label: "Review submitted" },
  { value: "message_thread_created", label: "Message thread created" },
  { value: "vendor_account_status_changed", label: "Vendor account suspended / restored / deactivated" },
  { value: "customer_account_status_changed", label: "Customer account suspended / restored / deactivated" },
  { value: "admin_user_status_changed", label: "User status changed (legacy)" },
];

export const AUDIT_ENTITY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All entities" },
  { value: "vendor", label: "Vendor" },
  { value: "profile", label: "Profile" },
  { value: "quote", label: "Quote" },
  { value: "event", label: "Event" },
  { value: "review", label: "Review" },
  { value: "conversation", label: "Conversation" },
];
