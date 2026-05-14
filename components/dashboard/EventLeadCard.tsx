import { ButtonLink } from "@/components/ui/ButtonLink";
import { StatusBadge } from "./StatusBadge";

type CustomerEvent = {
  variant: "customer";
  title: string;
  eventDate: string;
  neighborhood: string;
  budgetRange?: string;
  services: string[];
  quoteHeadline: string;
  quoteDetail?: string;
  statusLabel: string;
  statusTone: "success" | "warning" | "info" | "neutral" | "coral";
  ctaHref: string;
  ctaLabel: string;
  /** Optional second action (e.g. wide comparison layout). */
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  /** Short journey / next-step line */
  progressHint?: string;
};

type VendorLead = {
  variant: "vendor";
  title: string;
  category: string;
  eventDate: string;
  budgetRange: string;
  creditsRequired: number;
  spotsRemaining: number;
  ctaHref: string;
  ctaLabel: string;
};

export type EventLeadCardProps = CustomerEvent | VendorLead;

export function EventLeadCard(props: EventLeadCardProps) {
  if (props.variant === "customer") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-card p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-brand-navy">{props.title}</h3>
            <StatusBadge tone={props.statusTone}>{props.statusLabel}</StatusBadge>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-brand-navy">{props.eventDate}</span>
            <span className="text-slate-300"> · </span>
            {props.neighborhood}
          </p>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-brand-navy">Budget:</span>{" "}
            {props.budgetRange?.trim() ? props.budgetRange : "Not specified"}
          </p>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-brand-navy">Services:</span>{" "}
            {props.services.join(", ")}
          </p>
          <div className="text-sm text-accent-blue">
            <p className="font-medium">{props.quoteHeadline}</p>
            {props.quoteDetail ? (
              <p className="mt-0.5 text-xs font-normal text-brand-navy-muted">{props.quoteDetail}</p>
            ) : null}
          </div>
          {props.progressHint ? (
            <p className="text-xs leading-relaxed text-brand-navy-muted">{props.progressHint}</p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[9rem]">
          <ButtonLink href={props.ctaHref} className="w-full justify-center sm:w-auto">
            {props.ctaLabel}
          </ButtonLink>
          {props.secondaryCtaHref && props.secondaryCtaLabel ? (
            <ButtonLink href={props.secondaryCtaHref} variant="secondary" className="w-full justify-center sm:w-auto">
              {props.secondaryCtaLabel}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-card p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-brand-navy">{props.title}</h3>
          <StatusBadge tone="info">{props.category}</StatusBadge>
        </div>
        <p className="text-sm text-slate-600">
          <span className="font-medium text-brand-navy">{props.eventDate}</span>
          <span className="text-slate-300"> · </span>
          Budget {props.budgetRange}
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
          <span>
            <span className="font-medium text-brand-navy">Credits:</span>{" "}
            <span className="font-semibold text-accent-coral">{props.creditsRequired}</span>
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span>
            <span className="font-medium text-brand-navy">Quote spots left:</span>{" "}
            {props.spotsRemaining}
          </span>
        </div>
      </div>
      <ButtonLink href={props.ctaHref} className="w-full shrink-0 sm:w-auto">
        {props.ctaLabel}
      </ButtonLink>
    </div>
  );
}
