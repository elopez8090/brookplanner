"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminSubmitCreditAdjustment } from "@/lib/admin/actions";
import { adminCreditAdjustmentInitialState } from "@/lib/admin/form-state";
import type { AdminMarketplaceVendorRow } from "@/lib/admin/types";

type AdminCreditAdjustmentConsoleProps = {
  vendors: AdminMarketplaceVendorRow[];
};

function vendorLabel(v: AdminMarketplaceVendorRow): string {
  const b = v.business_name?.trim();
  if (b) {
    return b;
  }
  return v.full_name?.trim() || "Vendor";
}

const ADJUSTMENT_TYPE_HELP: Record<string, string> = {
  promotional:
    "Adds credits to the vendor wallet and ledger as a marketing grant. Counts toward promo / bonus totals in revenue reporting, not paid credit sales.",
  bonus:
    "Adds credits to the wallet and ledger as a discretionary bonus. Tracked like promotional credits for reporting (separate from paid purchases).",
  correction:
    "Records a non-cash ledger movement for audits and financial reports. Does not change the vendor wallet balance in the current system.",
  refund:
    "Records a refund-style ledger entry for reporting. Does not change the vendor wallet balance in the current system.",
};

export function AdminCreditAdjustmentConsole({ vendors }: AdminCreditAdjustmentConsoleProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(adminSubmitCreditAdjustment, adminCreditAdjustmentInitialState);
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [adjustmentType, setAdjustmentType] = useState("promotional");

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return vendors.slice(0, 30);
    }
    return vendors
      .filter((v) => {
        const blob = `${vendorLabel(v)} ${v.full_name} ${v.slug ?? ""}`.toLowerCase();
        return blob.includes(q);
      })
      .slice(0, 30);
  }, [vendors, search]);

  const selected = vendorId ? vendors.find((v) => v.id === vendorId) : null;
  const isLedgerOnly = adjustmentType === "correction" || adjustmentType === "refund";

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-border-subtle bg-brand-navy/[0.02] p-5">
      <input type="hidden" name="vendor_id" value={vendorId ?? ""} />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-brand-navy" htmlFor="admin-credit-vendor-search">
          Vendor
        </label>
        <p className="text-xs text-brand-navy-muted">Search by business name, contact name, or slug, then pick a row.</p>
        <input
          id="admin-credit-vendor-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type to filter vendors…"
          autoComplete="off"
          className="w-full rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
        />
        {selected ? (
          <p className="text-sm text-brand-navy">
            Selected: <span className="font-semibold">{vendorLabel(selected)}</span>
            {selected.slug ? (
              <span className="text-brand-navy-muted">
                {" "}
                · /vendors/{selected.slug} · {selected.credits_balance} credits
              </span>
            ) : (
              <span className="text-brand-navy-muted"> · {selected.credits_balance} credits</span>
            )}
          </p>
        ) : (
          <p className="text-xs text-brand-navy-muted">No vendor selected yet.</p>
        )}
        <ul className="max-h-48 overflow-y-auto rounded-lg border border-border-subtle bg-card text-sm">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-brand-navy-muted">No matches.</li>
          ) : (
            filtered.map((v) => (
              <li key={v.id} className="border-b border-border-subtle last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    setVendorId(v.id);
                    setSearch(vendorLabel(v));
                  }}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-brand-navy/[0.04]"
                >
                  <span className="font-medium text-brand-navy">{vendorLabel(v)}</span>
                  <span className="text-xs text-brand-navy-muted">
                    {v.slug ? `Slug ${v.slug}` : "No slug"} · Balance {v.credits_balance}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-brand-navy">Adjustment type</span>
          <select
            name="adjustment_type"
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value)}
            className="rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
            aria-describedby="admin-credit-adjustment-type-help"
          >
            <option value="promotional">Promotional</option>
            <option value="bonus">Bonus</option>
            <option value="correction">Correction (ledger only)</option>
            <option value="refund">Refund (ledger only)</option>
          </select>
          <p id="admin-credit-adjustment-type-help" className="text-xs leading-relaxed text-brand-navy-muted">
            {ADJUSTMENT_TYPE_HELP[adjustmentType] ?? ADJUSTMENT_TYPE_HELP.promotional}
          </p>
          {isLedgerOnly ? (
            <p
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950"
              role="note"
            >
              <span className="font-semibold">Reporting only:</span> correction and refund entries do not update vendor
              wallet balances today; they exist so reports and audits stay complete. If a future safe-balance workflow
              applies these rows automatically, behavior may change; until then use promotional or bonus when the wallet must
              move immediately.
            </p>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-brand-navy">Credit amount</span>
          <input
            name="credit_amount"
            type="number"
            step={1}
            required
            min={isLedgerOnly ? undefined : 1}
            placeholder={isLedgerOnly ? "e.g. -3 or 5" : "e.g. 10"}
            className="rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
          />
          {isLedgerOnly ? (
            <span className="text-xs text-brand-navy-muted">
              Non-zero integer. Does not change the vendor wallet until a future balance workflow applies this row.
            </span>
          ) : (
            <span className="text-xs text-brand-navy-muted">Positive whole number. Updates wallet and credit ledger.</span>
          )}
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-brand-navy">Reason</span>
        <input
          name="reason"
          type="text"
          required
          placeholder="Shown on internal records and vendor credit history where applicable"
          className="rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-brand-navy"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          Submit adjustment
        </button>
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
    </form>
  );
}
