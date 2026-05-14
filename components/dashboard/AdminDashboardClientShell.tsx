"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShell } from "./DashboardShell";
import { adminWorkspaceNav } from "./adminNav";

type AdminDashboardClientShellProps = {
  children: ReactNode;
};

const shellCopy: Record<string, { title: string; subtitle: string; activeId: string }> = {
  "/admin/credits": {
    title: "Credit adjustments",
    subtitle: "Promotional, bonus, correction, and refund rows with audit history.",
    activeId: "credits",
  },
  "/admin/dashboard": {
    title: "Overview",
    subtitle: "Marketplace snapshot and credit ledger.",
    activeId: "overview",
  },
  "/admin/analytics": {
    title: "Analytics",
    subtitle: "Snapshot metrics for customers, vendors, events, and quotes.",
    activeId: "analytics",
  },
  "/admin/marketplace-ops": {
    title: "Marketplace operations",
    subtitle: "Liquidity by category, funnel conversion, neighborhood demand, and operational alerts.",
    activeId: "marketplace-ops",
  },
  "/admin/revenue": {
    title: "Revenue / Financials",
    subtitle: "Credit sales, liability, and vendor spend analytics.",
    activeId: "revenue",
  },
  "/admin/vendors": {
    title: "Vendors",
    subtitle: "Visibility, credits, suspension, and internal notes.",
    activeId: "vendors",
  },
  "/admin/customers": {
    title: "Customers",
    subtitle: "Host accounts, event counts, and access controls.",
    activeId: "customers",
  },
  "/admin/events": {
    title: "Events",
    subtitle: "Recently submitted host events.",
    activeId: "events",
  },
  "/admin/quotes": {
    title: "Quotes",
    subtitle: "Recent quote submissions.",
    activeId: "quotes",
  },
  "/admin/reviews": {
    title: "Reviews",
    subtitle: "Customer feedback visibility.",
    activeId: "reviews",
  },
  "/admin/audit-logs": {
    title: "Audit logs",
    subtitle: "Platform activity timeline with optional filters.",
    activeId: "audit-logs",
  },
  "/admin/platform-health": {
    title: "Platform health",
    subtitle: "Population and volume snapshot for operations.",
    activeId: "platform-health",
  },
  "/admin/system-status": {
    title: "System status",
    subtitle: "Environment readiness, integrations, and webhook checklist (no secrets).",
    activeId: "system-status",
  },
  "/admin/launch-checklist": {
    title: "Launch checklist",
    subtitle: "Environment, webhooks, smoke tests, and security checks before production traffic.",
    activeId: "launch-checklist",
  },
};

export function AdminDashboardClientShell({ children }: AdminDashboardClientShellProps) {
  const pathname = usePathname() ?? "/admin/dashboard";
  const match = shellCopy[pathname] ?? shellCopy["/admin/dashboard"];

  return (
    <DashboardShell
      workspaceLabel="Admin console"
      navItems={adminWorkspaceNav}
      activeNavId={match.activeId}
      title={match.title}
      subtitle={match.subtitle}
      topBadge="Internal"
    >
      {children}
    </DashboardShell>
  );
}
