"use client";

import { useActionState } from "react";
import { adminSaveCustomerAdminNotes } from "@/lib/admin/actions";
import { adminCustomerNotesInitialState } from "@/lib/admin/form-state";

type AdminCustomerNotesFormProps = {
  customerId: string;
  adminNotes: string | null;
};

export function AdminCustomerNotesForm({ customerId, adminNotes }: AdminCustomerNotesFormProps) {
  const [state, formAction] = useActionState(adminSaveCustomerAdminNotes, adminCustomerNotesInitialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 border-t border-border-subtle pt-4">
      <input type="hidden" name="customer_id" value={customerId} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-brand-navy">Admin notes</span>
        <textarea
          name="admin_notes"
          rows={2}
          defaultValue={adminNotes ?? ""}
          placeholder="Internal notes only"
          className="resize-y rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
        />
      </label>
      <button
        type="submit"
        className="self-start rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
      >
        Save notes
      </button>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
