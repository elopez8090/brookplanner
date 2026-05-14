"use client";

import { useActionState } from "react";
import { sendConversationMessage } from "@/lib/messages/actions";
import { initialSendMessageFormState } from "@/lib/messages/state";

type MessageComposerProps = {
  conversationId: string;
  returnPath: string;
};

export function MessageComposer({ conversationId, returnPath }: MessageComposerProps) {
  const [state, action, pending] = useActionState(sendConversationMessage, initialSendMessageFormState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="conversation_id" value={conversationId} />
      <input type="hidden" name="return_path" value={returnPath} />
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Message</span>
        <textarea
          name="body"
          required
          minLength={1}
          maxLength={2000}
          rows={4}
          className="mt-1 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-brand-navy shadow-sm outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20"
          placeholder="Write your message..."
        />
      </label>
      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent-coral px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ease-out hover:bg-accent-coral-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
