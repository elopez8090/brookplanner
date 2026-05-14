"use client";

import { useRouter } from "next/navigation";
import { signOutAndRedirect } from "@/components/auth/clientSignOut";
import { ButtonLink } from "@/components/ui/ButtonLink";

type SuspendedAccountPanelProps = {
  statusLabel: string;
};

export function SuspendedAccountPanel({ statusLabel }: SuspendedAccountPanelProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-border-subtle bg-card p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-blue">{statusLabel}</p>
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy">Account access restricted</h1>
        <p className="text-sm leading-relaxed text-brand-navy-muted">
          Your Brook Planner account is not active, so dashboards and marketplace actions are paused. If you believe this is a
          mistake, please reach out to support. Your event and quote data has not been deleted.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
          onClick={() => void signOutAndRedirect(router, "/")}
        >
          Sign out
        </button>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
