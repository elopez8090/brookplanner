import { ButtonLink } from "@/components/ui/ButtonLink";

type CustomerVendorSelectedSuccessPanelProps = {
  messagesHref: string | null;
};

export function CustomerVendorSelectedSuccessPanel({ messagesHref }: CustomerVendorSelectedSuccessPanelProps) {
  return (
    <div
      className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-white px-5 py-5 shadow-sm ring-1 ring-emerald-900/[0.04] sm:px-6 sm:py-6"
      role="status"
    >
      <h2 className="text-lg font-semibold text-emerald-950">Vendor selected</h2>
      <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
        You accepted a quote for this event. Message your vendor to confirm final details — timing, scope, contacts, and
        day-of logistics — before you consider things locked in.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {messagesHref ? (
          <ButtonLink href={messagesHref} className="text-sm">
            Open conversation
          </ButtonLink>
        ) : (
          <ButtonLink href="/customer/messages" variant="secondary" className="text-sm">
            Go to messages
          </ButtonLink>
        )}
      </div>
      {!messagesHref ? (
        <p className="mt-3 text-xs text-emerald-900/75">
          Your thread may take a moment to appear after you accept — check messages shortly if you do not see it yet.
        </p>
      ) : null}
    </div>
  );
}
