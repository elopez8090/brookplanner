"use client";

import type { ReactNode } from "react";
import { DashboardShell } from "./DashboardShell";
import type { DashboardNavItem } from "./DashboardSidebar";

const customerNav: DashboardNavItem[] = [
  { id: "dash", label: "Dashboard", href: "/customer/dashboard" },
  { id: "events", label: "My Events", href: "/customer/dashboard#my-events" },
  { id: "quotes", label: "Quotes", href: "/customer/dashboard#quotes" },
  { id: "notifications", label: "Notifications", href: "/customer/settings/notifications" },
  { id: "profile", label: "Profile", href: "/customer/dashboard#profile" },
];

const vendorNav: DashboardNavItem[] = [
  { id: "dash", label: "Dashboard", href: "/vendor/dashboard" },
  { id: "events", label: "Available Events", href: "/vendor/leads" },
  { id: "quotes", label: "My Quotes", href: "/vendor/dashboard#quotes" },
  { id: "notifications", label: "Notifications", href: "/vendor/settings/notifications" },
  { id: "credits", label: "Credits", href: "/vendor/dashboard#wallet" },
  { id: "buy-credits", label: "Buy Credits", href: "/vendor/credits" },
  { id: "profile", label: "Business Profile", href: "/vendor/profile" },
];

const workspaceConfig = {
  customer: {
    workspaceLabel: "Customer workspace",
    navItems: customerNav,
    activeNavId: "dash",
    title: "Dashboard",
    subtitle: "Welcome back — track quote progress, compare vendors, and accept when you are ready.",
    topBadge: "Your events",
  },
  vendor: {
    workspaceLabel: "Vendor workspace",
    navItems: vendorNav,
    activeNavId: "dash",
    title: "Dashboard",
    subtitle: "Welcome back — review fresh Brooklyn leads and manage your quote pipeline.",
    topBadge: "Preview data",
  },
} as const;

type Workspace = keyof typeof workspaceConfig;

type DashboardWorkspaceLayoutProps = {
  workspace: Workspace;
  children: ReactNode;
};

export function DashboardWorkspaceLayout({ workspace, children }: DashboardWorkspaceLayoutProps) {
  const c = workspaceConfig[workspace];
  return (
    <DashboardShell
      workspaceLabel={c.workspaceLabel}
      navItems={c.navItems}
      activeNavId={c.activeNavId}
      title={c.title}
      subtitle={c.subtitle}
      topBadge={c.topBadge}
    >
      {children}
    </DashboardShell>
  );
}
