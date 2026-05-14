"use client";

import { useActionState } from "react";
import { adminUpdateVendorMarketplaceFlags } from "@/lib/admin/actions";
import { adminVendorFlagsInitialState } from "@/lib/admin/form-state";
import type { AdminMarketplaceVendorRow } from "@/lib/admin/types";

type AdminVendorSaveFormProps = {
  vendor: AdminMarketplaceVendorRow;
};

export function AdminVendorSaveForm({ vendor }: AdminVendorSaveFormProps) {
  const [state, formAction] = useActionState(adminUpdateVendorMarketplaceFlags, adminVendorFlagsInitialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-border-subtle pt-4 first:border-t-0 first:pt-0 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <input type="hidden" name="vendor_id" value={vendor.id} />
      <input type="hidden" name="vendor_slug" value={vendor.slug ?? ""} />

      <label className="flex min-w-[10rem] flex-col gap-1 text-sm">
        <span className="font-medium text-brand-navy">Public listing</span>
        <select
          name="is_public"
          defaultValue={vendor.is_public ? "true" : "false"}
          className="rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
        >
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
      </label>

      <label className="flex min-w-[10rem] flex-col gap-1 text-sm">
        <span className="font-medium text-brand-navy">Featured</span>
        <select
          name="is_featured"
          defaultValue={vendor.is_featured ? "true" : "false"}
          className="rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
        >
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </label>

      <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
        <span className="font-medium text-brand-navy">Admin notes</span>
        <textarea
          name="admin_notes"
          rows={2}
          defaultValue={vendor.admin_notes ?? ""}
          placeholder="Internal notes only"
          className="resize-y rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
        />
      </label>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <button
          type="submit"
          className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          Save
        </button>
        {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
        {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
      </div>
    </form>
  );
}
