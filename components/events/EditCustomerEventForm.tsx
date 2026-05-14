"use client";

import { useActionState } from "react";
import { LabeledField } from "@/components/ui/LabeledField";
import { inputClassName, selectClassName } from "@/components/ui/fieldStyles";
import { updateCustomerEvent, type UpdateEventFormState } from "@/lib/events/actions";

const initialState: UpdateEventFormState = { error: null };

type EditableEvent = {
  id: string;
  title: string;
  event_date: string;
  neighborhood: string;
  budget_range: string | null;
  status: "active" | "draft" | "closed";
};

type EditCustomerEventFormProps = {
  event: EditableEvent;
};

export function EditCustomerEventForm({ event }: EditCustomerEventFormProps) {
  const [state, formAction, pending] = useActionState(updateCustomerEvent, initialState);

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="event_id" value={event.id} />

      {state.error ? (
        <div className="sm:col-span-2" role="alert">
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <LabeledField id="title" label="Event title">
          <input
            id="title"
            name="title"
            required
            disabled={pending}
            className={inputClassName}
            defaultValue={event.title}
          />
        </LabeledField>
      </div>

      <LabeledField id="event_date" label="Event date">
        <input
          id="event_date"
          name="event_date"
          type="date"
          required
          disabled={pending}
          className={inputClassName}
          defaultValue={event.event_date}
        />
      </LabeledField>

      <LabeledField id="neighborhood" label="Location">
        <input
          id="neighborhood"
          name="neighborhood"
          required
          disabled={pending}
          className={inputClassName}
          defaultValue={event.neighborhood}
        />
      </LabeledField>

      <div className="sm:col-span-2">
        <LabeledField id="budget_range" label="Budget">
          <input
            id="budget_range"
            name="budget_range"
            disabled={pending}
            className={inputClassName}
            defaultValue={event.budget_range ?? ""}
          />
        </LabeledField>
      </div>

      <LabeledField id="status" label="Status">
        <select id="status" name="status" required disabled={pending} className={selectClassName} defaultValue={event.status}>
          <option value="active">Collecting quotes</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
      </LabeledField>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent-coral px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ease-out hover:bg-accent-coral-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
