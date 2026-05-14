/** URL / RPC-safe sort and filter parsing for Phase 30 directory + admin + vendor lead lists. */

/** Coerce Next.js `searchParams` values that may be `string | string[]` to a single string. */
export function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

const VENDOR_DIRECTORY_SORTS = ["name", "newest", "oldest", "active", "rated"] as const;
export type VendorDirectorySort = (typeof VENDOR_DIRECTORY_SORTS)[number];

export function parseVendorDirectorySort(raw: string | undefined): VendorDirectorySort {
  const v = (raw || "").trim().toLowerCase();
  return (VENDOR_DIRECTORY_SORTS as readonly string[]).includes(v) ? (v as VendorDirectorySort) : "name";
}

const ADMIN_VENDOR_SORTS = ["newest", "oldest", "active", "credits", "rated", "name"] as const;
export type AdminVendorSort = (typeof ADMIN_VENDOR_SORTS)[number];

export function parseAdminVendorSort(raw: string | undefined): AdminVendorSort {
  const v = (raw || "").trim().toLowerCase();
  return (ADMIN_VENDOR_SORTS as readonly string[]).includes(v) ? (v as AdminVendorSort) : "newest";
}

const ADMIN_CUSTOMER_SORTS = ["newest", "oldest", "active", "name"] as const;
export type AdminCustomerSort = (typeof ADMIN_CUSTOMER_SORTS)[number];

export function parseAdminCustomerSort(raw: string | undefined): AdminCustomerSort {
  const v = (raw || "").trim().toLowerCase();
  return (ADMIN_CUSTOMER_SORTS as readonly string[]).includes(v) ? (v as AdminCustomerSort) : "newest";
}

const ADMIN_EVENT_SORTS = ["newest", "oldest", "quotes", "event_date"] as const;
export type AdminEventSort = (typeof ADMIN_EVENT_SORTS)[number];

export function parseAdminEventSort(raw: string | undefined): AdminEventSort {
  const v = (raw || "").trim().toLowerCase();
  return (ADMIN_EVENT_SORTS as readonly string[]).includes(v) ? (v as AdminEventSort) : "newest";
}

const VENDOR_LEAD_SORTS = ["event_date", "newest", "oldest", "quotes"] as const;
export type VendorLeadSort = (typeof VENDOR_LEAD_SORTS)[number];

export function parseVendorLeadSort(raw: string | undefined): VendorLeadSort {
  const v = (raw || "").trim().toLowerCase();
  return (VENDOR_LEAD_SORTS as readonly string[]).includes(v) ? (v as VendorLeadSort) : "event_date";
}

const ADMIN_EVENT_STATUSES = ["all", "active", "draft", "closed"] as const;
export type AdminEventStatusFilter = (typeof ADMIN_EVENT_STATUSES)[number];

export function parseAdminEventStatusFilter(raw: string | undefined): AdminEventStatusFilter {
  const v = (raw || "").trim().toLowerCase();
  return (ADMIN_EVENT_STATUSES as readonly string[]).includes(v) ? (v as AdminEventStatusFilter) : "all";
}

const ADMIN_ACCOUNT_STATUSES = ["all", "active", "suspended", "deactivated"] as const;
export type AdminAccountStatusFilter = (typeof ADMIN_ACCOUNT_STATUSES)[number];

export function parseAdminAccountStatusFilter(raw: string | undefined): AdminAccountStatusFilter {
  const v = (raw || "").trim().toLowerCase();
  return (ADMIN_ACCOUNT_STATUSES as readonly string[]).includes(v) ? (v as AdminAccountStatusFilter) : "all";
}

const ADMIN_VENDOR_VISIBILITY = ["all", "public", "hidden"] as const;
export type AdminVendorVisibilityFilter = (typeof ADMIN_VENDOR_VISIBILITY)[number];

export function parseAdminVendorVisibilityFilter(raw: string | undefined): AdminVendorVisibilityFilter {
  const v = (raw || "").trim().toLowerCase();
  return (ADMIN_VENDOR_VISIBILITY as readonly string[]).includes(v) ? (v as AdminVendorVisibilityFilter) : "all";
}

const ADMIN_VENDOR_PROFILE = ["all", "complete", "incomplete"] as const;
export type AdminVendorProfileFilter = (typeof ADMIN_VENDOR_PROFILE)[number];

export function parseAdminVendorProfileFilter(raw: string | undefined): AdminVendorProfileFilter {
  const v = (raw || "").trim().toLowerCase();
  return (ADMIN_VENDOR_PROFILE as readonly string[]).includes(v) ? (v as AdminVendorProfileFilter) : "all";
}

export function rpcOptionalText(value: string | undefined): string | null {
  const t = (value ?? "").trim();
  return t.length ? t : null;
}

export function rpcStatusFilter(value: string | undefined): string | null {
  const v = (value || "").trim().toLowerCase();
  if (!v || v === "all") {
    return null;
  }
  return v;
}
