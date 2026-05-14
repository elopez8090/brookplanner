"use client";

import { useFormStatus } from "react-dom";
import { deleteCustomerEvent } from "@/lib/events/actions";

type DeleteCustomerEventFormProps = {
  eventId: string;
};

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition-colors duration-200 ease-out hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Deleting..." : "Delete event"}
    </button>
  );
}

export function DeleteCustomerEventForm({ eventId }: DeleteCustomerEventFormProps) {
  return (
    <form
      action={deleteCustomerEvent}
      onSubmit={(event) => {
        const approved = window.confirm("Delete this event permanently? This also removes related services and quotes.");
        if (!approved) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="event_id" value={eventId} />
      <DeleteButton />
    </form>
  );
}
