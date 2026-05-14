"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAccountRestrictedStatus } from "@/lib/auth/accountStatus";
import { fetchProfileByUserId } from "@/lib/auth/ensureProfile";
import { createClient } from "@/lib/supabase/server";
import {
  notifyCustomerNewQuoteEmail,
  notifyVendorQuoteAcceptedEmail,
  notifyVendorQuoteDeclinedEmail,
} from "@/lib/email/notifyMarketplace";
import { createNotification } from "@/lib/notifications";
import { ensureConversationForAcceptedQuote } from "@/lib/messages/actions";

export type CreateEventFormState = {
  error: string | null;
};

export type UpdateEventFormState = {
  error: string | null;
};

export type SubmitQuoteFormState = {
  error: string | null;
  success: string | null;
};

export type CustomerQuoteDecisionFormState = {
  error: string | null;
};

type CustomerQuoteDecisionContext =
  | { ok: true; quoteId: string; eventServiceId: string; status: string }
  | { ok: false; error: string };

async function resolveCustomerQuoteDecisionContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quoteId: string,
  eventId: string
): Promise<CustomerQuoteDecisionContext> {
  const { data: quoteRow, error: quoteErr } = await supabase
    .from("quotes")
    .select("id, event_service_id, status")
    .eq("id", quoteId)
    .maybeSingle();

  if (quoteErr) {
    return { ok: false, error: quoteErr.message };
  }
  if (!quoteRow) {
    return { ok: false, error: "Quote not found." };
  }

  const { data: esRow, error: esErr } = await supabase
    .from("event_services")
    .select("event_id")
    .eq("id", quoteRow.event_service_id)
    .maybeSingle();

  if (esErr) {
    return { ok: false, error: esErr.message };
  }
  if (!esRow || esRow.event_id !== eventId) {
    return { ok: false, error: "Invalid input." };
  }

  return {
    ok: true,
    quoteId: quoteRow.id,
    eventServiceId: quoteRow.event_service_id,
    status: quoteRow.status,
  };
}

function isEventStatus(value: string): value is "active" | "draft" | "closed" {
  return value === "active" || value === "draft" || value === "closed";
}

export async function createCustomerEvent(
  prevState: CreateEventFormState,
  formData: FormData
): Promise<CreateEventFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "customer") {
    return { error: "Only customers can post events." };
  }
  if (isAccountRestrictedStatus(profile.status)) {
    return { error: "Your account cannot post events right now. Contact support if you need help." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const eventType = String(formData.get("event_type") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const guestCount = Number(String(formData.get("guest_count") ?? "").trim());
  const budgetRange = String(formData.get("budget_range") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const categoryIds = formData
    .getAll("category_ids")
    .map((v) => String(v).trim())
    .filter(Boolean);

  if (!title || !eventType || !eventDate || !neighborhood || !Number.isFinite(guestCount) || guestCount <= 0 || !details) {
    return { error: "Please fill out all required fields." };
  }

  if (categoryIds.length === 0) {
    return { error: "Select at least one service category." };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      customer_id: user.id,
      title,
      event_type: eventType,
      event_date: eventDate,
      neighborhood,
      guest_count: guestCount,
      budget_range: budgetRange,
      details,
      status: "active",
    })
    .select("id")
    .single();

  if (eventError || !event) {
    return { error: eventError?.message ?? "Could not create event." };
  }

  const eventServices = categoryIds.map((categoryId) => ({
    event_id: event.id,
    category_id: categoryId,
  }));

  const { error: servicesError } = await supabase.from("event_services").insert(eventServices);
  if (servicesError) {
    return { error: servicesError.message };
  }

  revalidatePath("/customer/dashboard");
  revalidatePath(`/customer/events/${event.id}`);
  revalidatePath(`/events/${event.id}`);
  redirect("/customer/dashboard");
}

export async function updateCustomerEvent(
  prevState: UpdateEventFormState,
  formData: FormData
): Promise<UpdateEventFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "customer") {
    return { error: "Only customers can edit events." };
  }
  if (isAccountRestrictedStatus(profile.status)) {
    return { error: "Your account cannot edit events right now. Contact support if you need help." };
  }

  const eventId = String(formData.get("event_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const budgetRange = String(formData.get("budget_range") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "").trim();
  const status = isEventStatus(rawStatus) ? rawStatus : null;

  if (!eventId || !title || !eventDate || !neighborhood || !status) {
    return { error: "Invalid input." };
  }

  const { data: ownedEvent } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!ownedEvent) {
    return { error: "You cannot edit this event." };
  }

  const { error } = await supabase
    .from("events")
    .update({
      title,
      event_date: eventDate,
      neighborhood,
      budget_range: budgetRange,
      status,
    })
    .eq("id", eventId)
    .eq("customer_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/customer/events/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/customer/events/${eventId}/edit`);
  revalidatePath("/customer/dashboard");
  redirect(`/customer/events/${eventId}`);
}

export async function deleteCustomerEvent(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (profile && isAccountRestrictedStatus(profile.status)) {
    redirect("/account-suspended");
  }

  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) {
    redirect("/customer/dashboard");
  }

  const { data: ownedEvent } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!ownedEvent) {
    redirect("/customer/dashboard");
  }

  const { data: serviceRows } = await supabase.from("event_services").select("id").eq("event_id", eventId);
  const serviceIds = (serviceRows ?? []).map((row) => row.id).filter((id): id is string => typeof id === "string");

  if (serviceIds.length > 0) {
    await supabase.from("quotes").delete().in("event_service_id", serviceIds);
  }
  await supabase.from("event_services").delete().eq("event_id", eventId);
  await supabase.from("events").delete().eq("id", eventId).eq("customer_id", user.id);

  revalidatePath("/customer/dashboard");
  revalidatePath(`/events/${eventId}`);
  redirect("/customer/dashboard");
}

export async function submitVendorQuote(
  prevState: SubmitQuoteFormState,
  formData: FormData
): Promise<SubmitQuoteFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated.", success: null };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);

  if (!profile) {
    return { error: "Not authenticated.", success: null };
  }

  if (profile.role !== "vendor") {
    return { error: "Only vendors can submit quotes.", success: null };
  }
  if (isAccountRestrictedStatus(profile.status)) {
    return {
      error: "Your account cannot submit quotes right now. Contact support if you need help.",
      success: null,
    };
  }

  const eventId = String(formData.get("event_id") ?? "").trim();
  const eventServiceId = String(formData.get("event_service_id") ?? "").trim();
  const quoteAmountRaw = String(formData.get("quote_amount") ?? "").trim();
  const quoteAmount = Number(quoteAmountRaw);

  const message = String(formData.get("message") ?? "").trim();
  const whatIsIncluded = String(formData.get("what_is_included") ?? "").trim();
  const availabilityNote = String(formData.get("availability_note") ?? "").trim();
  const estimatedTimeframe = String(formData.get("estimated_timeframe") ?? "").trim();
  const businessPhone = String(formData.get("business_phone") ?? "").trim();
  const businessEmail = String(formData.get("business_email") ?? "").trim();

  if (
    !eventId ||
    !eventServiceId ||
    !Number.isFinite(quoteAmount) ||
    quoteAmount <= 0
  ) {
    return { error: "Invalid input.", success: null };
  }

  const { error: submitErr } = await supabase.rpc("submit_vendor_quote", {
    p_event_id: eventId,
    p_event_service_id: eventServiceId,
    p_quote_amount: quoteAmount,
    p_message: message,
    p_what_is_included: whatIsIncluded,
    p_availability_note: availabilityNote,
    p_estimated_timeframe: estimatedTimeframe,
    p_business_phone: businessPhone,
    p_business_email: businessEmail,
  });

  if (submitErr) {
    const msg = submitErr.message.toLowerCase();

    if (msg.includes("maximum number of quotes") || msg.includes("already has 4")) {
      return {
        error: "This service already has the maximum number of quotes.",
        success: null,
      };
    }

    if (msg.includes("already submitted")) {
      return {
        error: "You already submitted a quote for this service.",
        success: null,
      };
    }

    if (msg.includes("not enough credits") || msg.includes("need more credits")) {
      return {
        error: "You don’t have enough credits.",
        success: null,
      };
    }

    if (msg.includes("cannot submit quotes")) {
      return {
        error: "Your account cannot submit quotes right now. Contact support if you need help.",
        success: null,
      };
    }

    return { error: submitErr.message, success: null };
  }

  const { data: eventForNotification } = await supabase
    .from("events")
    .select("id, customer_id, title")
    .eq("id", eventId)
    .maybeSingle();

  if (eventForNotification?.customer_id) {
    await createNotification({
      userId: eventForNotification.customer_id,
      type: "quote_submitted",
      title: "New quote received",
      message: "A vendor submitted a quote for your event.",
      linkUrl: `/events/${eventForNotification.id}`,
    });

    const eventTitle = eventForNotification.title?.trim() || "your event";
    void notifyCustomerNewQuoteEmail({
      customerUserId: eventForNotification.customer_id,
      eventId: eventForNotification.id,
      eventTitle,
    });
  }

  revalidatePath("/vendor/dashboard");
  revalidatePath(`/vendor/events/${eventId}`);
  revalidatePath(`/events/${eventId}`);

  return {
    error: null,
    success:
      "Your quote is in. The host compares up to four vendors per service — move fast if they message you.",
  };
}

export async function acceptCustomerQuote(
  prevState: CustomerQuoteDecisionFormState,
  formData: FormData
): Promise<CustomerQuoteDecisionFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "customer") {
    return { error: "Only customers can manage quotes." };
  }
  if (isAccountRestrictedStatus(profile.status)) {
    return { error: "Your account cannot manage quotes right now. Contact support if you need help." };
  }

  const quoteId = String(formData.get("quote_id") ?? "").trim();
  const eventId = String(formData.get("event_id") ?? "").trim();

  if (!quoteId || !eventId) {
    return { error: "Invalid input." };
  }

  const ctx = await resolveCustomerQuoteDecisionContext(supabase, quoteId, eventId);
  if (!ctx.ok) {
    return { error: ctx.error };
  }

  const { error: declineOthersError } = await supabase
    .from("quotes")
    .update({ status: "declined" })
    .eq("event_service_id", ctx.eventServiceId)
    .neq("id", quoteId);

  if (declineOthersError) {
    return { error: declineOthersError.message };
  }

  const { error: acceptError } = await supabase.from("quotes").update({ status: "accepted" }).eq("id", quoteId);

  if (acceptError) {
    return { error: acceptError.message };
  }

  const { data: acceptedQuoteRow, error: acceptedQuoteError } = await supabase
    .from("quotes")
    .select("vendor_id, event_services!inner(event_id, events!inner(customer_id))")
    .eq("id", quoteId)
    .maybeSingle();

  if (acceptedQuoteError || !acceptedQuoteRow) {
    return { error: acceptedQuoteError?.message ?? "Could not create conversation context." };
  }

  const acceptedEventService = Array.isArray(acceptedQuoteRow.event_services)
    ? acceptedQuoteRow.event_services[0]
    : acceptedQuoteRow.event_services;
  const acceptedEvent = Array.isArray(acceptedEventService?.events)
    ? acceptedEventService.events[0]
    : acceptedEventService?.events;
  const customerId = acceptedEvent?.customer_id;
  const vendorId = acceptedQuoteRow.vendor_id;
  const acceptedEventId = acceptedEventService?.event_id;

  if (!customerId || !vendorId || !acceptedEventId) {
    return { error: "Could not create conversation context." };
  }

  const conversationResult = await ensureConversationForAcceptedQuote({
    customerId,
    vendorId,
    eventId: acceptedEventId,
    quoteId,
  });
  if (conversationResult.error) {
    return { error: conversationResult.error };
  }

  const { data: acceptedEventRow } = await supabase
    .from("events")
    .select("title")
    .eq("id", acceptedEventId)
    .maybeSingle();
  const acceptedTitle = acceptedEventRow?.title?.trim() || "your event";
  void notifyVendorQuoteAcceptedEmail({
    vendorUserId: vendorId,
    eventId: acceptedEventId,
    eventTitle: acceptedTitle,
  });

  revalidatePath(`/customer/events/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/customer/dashboard");
  revalidatePath("/customer/messages");
  revalidatePath("/vendor/messages");

  return { error: null };
}

export async function declineCustomerQuote(
  prevState: CustomerQuoteDecisionFormState,
  formData: FormData
): Promise<CustomerQuoteDecisionFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "customer") {
    return { error: "Only customers can manage quotes." };
  }
  if (isAccountRestrictedStatus(profile.status)) {
    return { error: "Your account cannot manage quotes right now. Contact support if you need help." };
  }

  const quoteId = String(formData.get("quote_id") ?? "").trim();
  const eventId = String(formData.get("event_id") ?? "").trim();

  if (!quoteId || !eventId) {
    return { error: "Invalid input." };
  }

  const ctx = await resolveCustomerQuoteDecisionContext(supabase, quoteId, eventId);
  if (!ctx.ok) {
    return { error: ctx.error };
  }

  if (ctx.status === "declined") {
    revalidatePath(`/customer/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath("/customer/dashboard");
    return { error: null };
  }

  if (ctx.status !== "pending") {
    return { error: "Only pending quotes can be declined." };
  }

  const { data: declineVendorRow } = await supabase.from("quotes").select("vendor_id").eq("id", quoteId).maybeSingle();

  const { error } = await supabase.from("quotes").update({ status: "declined" }).eq("id", quoteId);

  if (error) {
    return { error: error.message };
  }

  const vendorIdForEmail = declineVendorRow?.vendor_id;
  if (vendorIdForEmail) {
    const { data: declineEventRow } = await supabase.from("events").select("title").eq("id", eventId).maybeSingle();
    const declineTitle = declineEventRow?.title?.trim() || "your event";
    void notifyVendorQuoteDeclinedEmail({
      vendorUserId: vendorIdForEmail,
      eventId,
      eventTitle: declineTitle,
    });
  }

  revalidatePath(`/customer/events/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/customer/dashboard");

  return { error: null };
}