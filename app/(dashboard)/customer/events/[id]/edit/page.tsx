import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EditCustomerEventForm } from "@/components/events/EditCustomerEventForm";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit event",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

type EditableEvent = {
  id: string;
  customer_id: string;
  title: string;
  event_date: string;
  neighborhood: string;
  budget_range: string | null;
  status: "active" | "draft" | "closed";
};

export default async function EditCustomerEventPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: eventData } = await supabase
    .schema("public")
    .from("events")
    .select("id, customer_id, title, event_date, neighborhood, budget_range, status")
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!eventData) {
    notFound();
  }

  const event = eventData as EditableEvent;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Event details</p>
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Edit event</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-brand-navy-muted sm:text-base">
          Update your event details. Service selection stays unchanged for now.
        </p>
        <ButtonLink href={`/customer/events/${event.id}`} variant="secondary">
          ← Back to event
        </ButtonLink>
      </header>

      <DashboardCard title="Event settings">
        <EditCustomerEventForm event={event} />
      </DashboardCard>
    </div>
  );
}
