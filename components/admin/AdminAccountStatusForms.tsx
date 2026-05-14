"use client";

import { useActionState } from "react";
import { adminSetProfileStatus } from "@/lib/admin/actions";
import { adminProfileStatusInitialState } from "@/lib/admin/form-state";

type AdminAccountStatusFormsProps = {
  profileId: string;
  status: string;
};

export function AdminAccountStatusForms({ profileId, status }: AdminAccountStatusFormsProps) {
  const [state, formAction] = useActionState(adminSetProfileStatus, adminProfileStatusInitialState);
  const active = status === "active";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-brand-navy/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Account access</p>
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start">
        {!active ? (
          <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="profile_id" value={profileId} />
            <input type="hidden" name="intent" value="restore" />
            <input type="hidden" name="reason" value="" />
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              Restore access
            </button>
            <p className="text-xs text-brand-navy-muted">Sets status to active and clears suspension timestamps.</p>
          </form>
        ) : null}

        {active ? (
          <form action={formAction} className="flex max-w-md flex-col gap-2">
            <input type="hidden" name="profile_id" value={profileId} />
            <input type="hidden" name="intent" value="suspend" />
            <label className="text-sm font-medium text-brand-navy">Suspend</label>
            <textarea
              name="reason"
              rows={2}
              placeholder="Reason (optional internal note)"
              className="resize-y rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
            />
            <button
              type="submit"
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              Suspend account
            </button>
          </form>
        ) : null}

        {status !== "deactivated" ? (
          <form action={formAction} className="flex max-w-md flex-col gap-2">
            <input type="hidden" name="profile_id" value={profileId} />
            <input type="hidden" name="intent" value="deactivate" />
            <label className="text-sm font-medium text-brand-navy">Deactivate</label>
            <textarea
              name="reason"
              rows={2}
              placeholder="Reason (optional)"
              className="resize-y rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              Deactivate (soft)
            </button>
            <p className="text-xs text-brand-navy-muted">Keeps data; blocks dashboards like suspend.</p>
          </form>
        ) : null}
      </div>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
    </div>
  );
}
