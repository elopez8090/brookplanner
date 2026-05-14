"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adminUpdateReviewVisibility } from "@/lib/admin/actions";
import { adminReviewVisibilityInitialState } from "@/lib/admin/form-state";
import type { AdminReviewRow } from "@/lib/admin/types";

type AdminReviewVisibilityFormProps = {
  review: AdminReviewRow;
};

function ToggleButton({ isPublic }: { isPublic: boolean }) {
  const { pending } = useFormStatus();
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed";
  const variantClasses = isPublic
    ? "bg-brand-navy text-white hover:bg-brand-navy/90"
    : "bg-emerald-600 text-white hover:bg-emerald-500";

  const idleLabel = isPublic ? "Hide review" : "Show review";
  const pendingLabel = isPublic ? "Hiding…" : "Showing…";

  return (
    <button type="submit" disabled={pending} className={`${baseClasses} ${variantClasses}`}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function AdminReviewVisibilityForm({ review }: AdminReviewVisibilityFormProps) {
  const [state, formAction] = useActionState(adminUpdateReviewVisibility, adminReviewVisibilityInitialState);
  const nextIsPublic = !review.is_public;

  return (
    <form action={formAction} className="flex flex-col items-end gap-2 text-right">
      <input type="hidden" name="review_id" value={review.id} />
      <input type="hidden" name="is_public" value={nextIsPublic ? "true" : "false"} />
      {review.vendor_slug?.trim() ? <input type="hidden" name="vendor_slug" value={review.vendor_slug.trim()} /> : null}

      <ToggleButton isPublic={review.is_public} />

      {state.error ? (
        <p className="text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-xs text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
