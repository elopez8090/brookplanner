import { ButtonLink } from "@/components/ui/ButtonLink";

type CustomerQuotesWaitingGuideProps = {
  eventId: string;
};

export function CustomerQuotesWaitingGuide({ eventId }: CustomerQuotesWaitingGuideProps) {
  return (
    <div className="rounded-xl border border-accent-blue/20 bg-accent-blue/[0.05] px-4 py-4 text-sm leading-relaxed text-brand-navy sm:px-5">
      <p className="font-semibold text-brand-navy">Quotes can take a little time</p>
      <p className="mt-1.5 text-brand-navy-muted">
        Vendors read active events and respond when the fit is right — many hosts see the first proposals within a few days.
        You are never obligated to choose anyone.
      </p>
      <p className="mt-3 text-brand-navy-muted">
        Adding specifics (guest flow, must-haves, timing) helps vendors respond with sharper proposals.
      </p>
      <ButtonLink href={`/customer/events/${eventId}/edit`} variant="secondary" className="mt-4 text-sm">
        Refine event details
      </ButtonLink>
    </div>
  );
}
