"use client";

import { useActionState } from "react";
import { adminGrantVendorPromotionalCredits } from "@/lib/admin/actions";
import { adminVendorCreditsInitialState } from "@/lib/admin/form-state";

type AdminVendorCreditGrantFormProps = {
  vendorId: string;
  vendorSlug: string | null;
};

export function AdminVendorCreditGrantForm({ vendorId, vendorSlug }: AdminVendorCreditGrantFormProps) {
  const [state, formAction] = useActionState(adminGrantVendorPromotionalCredits, adminVendorCreditsInitialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-brand-navy/[0.03] p-4">
      <input type="hidden" name="vendor_id" value={vendorId} />
      <input type="hidden" name="vendor_slug" value={vendorSlug ?? ""} />
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Promotional credits</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[6rem] flex-col gap-1 text-sm">
          <span className="font-medium text-brand-navy">Credits</span>
          <input
            name="credits_added"
            type="number"
            min={1}
            step={1}
            required
            placeholder="e.g. 10"
            className="rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
          />
        </label>
        <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-brand-navy">Reason</span>
          <input
            name="reason"
            type="text"
            list="admin-promo-credit-reasons"
            placeholder="Promotional launch credits"
            className="rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
          />
        </label>
        <datalist id="admin-promo-credit-reasons">
          <option value="Promotional launch credits" />
          <option value="Manual adjustment" />
          <option value="Support credit" />
        </datalist>
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 sm:self-end"
        >
          Add credits
        </button>
      </div>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
