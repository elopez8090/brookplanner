"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutAndRedirect } from "@/components/auth/clientSignOut";

export type DashboardNavItem = {
  id: string;
  label: string;
  href: string;
};

type DashboardSidebarProps = {
  workspaceLabel: string;
  items: DashboardNavItem[];
  activeId: string;
  open: boolean;
  onClose: () => void;
};

export function DashboardSidebar({
  workspaceLabel,
  items,
  activeId,
  open,
  onClose,
}: DashboardSidebarProps) {
  const router = useRouter();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-brand-navy/25 backdrop-blur-sm transition-opacity duration-200 ease-out lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-white/10 bg-brand-navy text-white shadow-lg transition-transform duration-200 ease-out sm:w-72 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:z-auto lg:h-screen lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-5">
          <div>
            <Link href="/" className="text-sm font-bold tracking-tight text-white" onClick={onClose}>
              Brook Planner
            </Link>
            <p className="text-xs text-white/60">{workspaceLabel}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-white/80 transition-colors duration-200 ease-out hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out ${
                  isActive
                    ? "bg-dashboard-sidebar-active font-semibold text-white shadow-md ring-1 ring-inset ring-white/25"
                    : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 space-y-1 border-t border-white/10 p-4">
          <Link
            href="/"
            onClick={onClose}
            className="block rounded-xl px-3 py-2 text-sm font-medium text-white/75 transition-colors duration-200 ease-out hover:bg-white/[0.08] hover:text-white"
          >
            ← Back to Brook Planner
          </Link>
          <button
            type="button"
            onClick={() => void signOutAndRedirect(router, "/")}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-white/75 transition-colors duration-200 ease-out hover:bg-white/[0.08] hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
