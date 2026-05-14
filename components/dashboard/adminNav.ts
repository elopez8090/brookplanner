import type { DashboardNavItem } from "./DashboardSidebar";

export const adminWorkspaceNav: DashboardNavItem[] = [
  { id: "overview", label: "Overview", href: "/admin/dashboard" },
  { id: "analytics", label: "Analytics", href: "/admin/analytics" },
  { id: "marketplace-ops", label: "Marketplace Ops", href: "/admin/marketplace-ops" },
  { id: "revenue", label: "Revenue / Financials", href: "/admin/revenue" },
  { id: "vendors", label: "Vendors", href: "/admin/vendors" },
  { id: "customers", label: "Customers", href: "/admin/customers" },
  { id: "events", label: "Events", href: "/admin/events" },
  { id: "quotes", label: "Quotes", href: "/admin/quotes" },
  { id: "reviews", label: "Reviews", href: "/admin/reviews" },
  { id: "audit-logs", label: "Audit logs", href: "/admin/audit-logs" },
  { id: "platform-health", label: "Platform health", href: "/admin/platform-health" },
  { id: "system-status", label: "System status", href: "/admin/system-status" },
  { id: "launch-checklist", label: "Launch checklist", href: "/admin/launch-checklist" },
  { id: "categories", label: "Categories", href: "/categories" },
  { id: "credits", label: "Credits", href: "/admin/credits" },
];
