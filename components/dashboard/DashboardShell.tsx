"use client";

import { useState, type ReactNode } from "react";
import { DashboardSidebar, type DashboardNavItem } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";

type DashboardShellProps = {
  workspaceLabel: string;
  navItems: DashboardNavItem[];
  activeNavId: string;
  title: string;
  subtitle?: string;
  topBadge?: string;
  children: ReactNode;
};

export function DashboardShell({
  workspaceLabel,
  navItems,
  activeNavId,
  title,
  subtitle,
  topBadge,
  children,
}: DashboardShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar
        workspaceLabel={workspaceLabel}
        items={navItems}
        activeId={activeNavId}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DashboardTopbar
          title={title}
          subtitle={subtitle}
          badge={topBadge}
          onMenu={() => setOpen(true)}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
