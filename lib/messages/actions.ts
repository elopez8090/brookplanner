"use server";

import { revalidatePath } from "next/cache";
import { fetchProfileByUserId } from "@/lib/auth/ensureProfile";
import type { SendMessageFormState } from "@/lib/messages/state";
import { notifyRecipientNewMessageEmail } from "@/lib/email/notifyMarketplace";
import { createNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export async function ensureConversationForAcceptedQuote(params: {
  customerId: string;
  vendorId: string;
  eventId: string;
  quoteId: string | null;
}): Promise<{ conversationId: string | null; error: string | null }> {
  const supabase = await createClient();
  const quoteId = params.quoteId ?? null;

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", params.customerId)
    .eq("vendor_id", params.vendorId)
    .eq("event_id", params.eventId)
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (existingError) {
    return { conversationId: null, error: existingError.message };
  }
  if (existing?.id) {
    return { conversationId: existing.id, error: null };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("conversations")
    .insert({
      customer_id: params.customerId,
      vendor_id: params.vendorId,
      event_id: params.eventId,
      quote_id: quoteId,
    })
    .select("id")
    .maybeSingle();

  if (!insertError && inserted?.id) {
    return { conversationId: inserted.id, error: null };
  }

  const { data: raceExisting, error: raceError } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", params.customerId)
    .eq("vendor_id", params.vendorId)
    .eq("event_id", params.eventId)
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (raceError || !raceExisting?.id) {
    return { conversationId: null, error: insertError?.message ?? raceError?.message ?? "Could not create conversation." };
  }

  return { conversationId: raceExisting.id, error: null };
}

export async function sendConversationMessage(
  prevState: SendMessageFormState,
  formData: FormData,
): Promise<SendMessageFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || (profile.role !== "customer" && profile.role !== "vendor")) {
    return { error: "Only customers and vendors can send messages." };
  }

  const conversationId = String(formData.get("conversation_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const returnPath = String(formData.get("return_path") ?? "").trim();

  if (!conversationId || !body) {
    return { error: "Message cannot be empty." };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select(
      `
      id,
      customer_id,
      vendor_id,
      event_id,
      events(title)
    `,
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return { error: conversationError?.message ?? "Conversation not found." };
  }

  const senderId = user.id;
  const isParticipant = conversation.customer_id === senderId || conversation.vendor_id === senderId;
  if (!isParticipant) {
    return { error: "You cannot send messages in this conversation." };
  }

  const recipientId = conversation.customer_id === senderId ? conversation.vendor_id : conversation.customer_id;
  const recipientPath =
    conversation.customer_id === senderId
      ? `/vendor/messages/${conversation.id}`
      : `/customer/messages/${conversation.id}`;

  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: senderId,
    body,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  const eventEmbed = Array.isArray(conversation.events) ? conversation.events[0] : conversation.events;
  const eventTitle = eventEmbed?.title?.trim() || "your event";

  await createNotification({
    userId: recipientId,
    type: "message_received",
    title: "New message",
    message: `You have a new message about ${eventTitle}.`,
    linkUrl: recipientPath,
  });

  const recipientRole = conversation.customer_id === recipientId ? "customer" : "vendor";
  void notifyRecipientNewMessageEmail({
    recipientUserId: recipientId,
    recipientRole,
    eventTitle,
    conversationId: conversation.id,
  });

  const fallbackPath = profile.role === "customer" ? `/customer/messages/${conversation.id}` : `/vendor/messages/${conversation.id}`;
  const destination = returnPath || fallbackPath;
  revalidatePath(destination);
  revalidatePath("/customer/messages");
  revalidatePath("/vendor/messages");
  return prevState;
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  const id = conversationId.trim();
  if (!id) {
    return;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .is("read_at", null)
    .neq("sender_id", user.id);
}
