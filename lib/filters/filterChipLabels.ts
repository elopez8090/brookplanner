import type {
  AdminCustomerSort,
  AdminEventSort,
  AdminVendorSort,
  VendorDirectorySort,
  VendorLeadSort,
} from "@/lib/filters/phase30Search";

const ADMIN_EVENT_SORT: Record<AdminEventSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  quotes: "Most quotes",
  event_date: "Soonest event first",
};

const ADMIN_VENDOR_SORT: Record<AdminVendorSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  active: "Most active",
  credits: "Highest credits",
  rated: "Highest rated",
  name: "Alphabetical (A–Z)",
};

const ADMIN_CUSTOMER_SORT: Record<AdminCustomerSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  active: "Most active",
  name: "Alphabetical (A–Z)",
};

const VENDOR_DIRECTORY_SORT: Record<VendorDirectorySort, string> = {
  name: "Alphabetical (A–Z)",
  newest: "Newest first",
  oldest: "Oldest first",
  active: "Most active",
  rated: "Highest rated",
};

const VENDOR_LEAD_SORT: Record<VendorLeadSort, string> = {
  event_date: "Soonest event first",
  newest: "Newest first",
  oldest: "Oldest first",
  quotes: "Most quotes",
};

export function labelAdminEventSort(sort: AdminEventSort): string {
  return ADMIN_EVENT_SORT[sort];
}

export function labelAdminVendorSort(sort: AdminVendorSort): string {
  return ADMIN_VENDOR_SORT[sort];
}

export function labelAdminCustomerSort(sort: AdminCustomerSort): string {
  return ADMIN_CUSTOMER_SORT[sort];
}

export function labelVendorDirectorySort(sort: VendorDirectorySort): string {
  return VENDOR_DIRECTORY_SORT[sort];
}

export function labelVendorLeadSort(sort: VendorLeadSort): string {
  return VENDOR_LEAD_SORT[sort];
}
