import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/auth/types";
import { ensureConversationForAcceptedQuote } from "@/lib/messages/actions";

export type ConversationListItem = {
  id: string;
  customer_id: string;
  vendor_id: string;
  event_id: string;
  quote_id: string | null;
  created_at: string;
  updated_at: string;
  event_title: string | null;
  customer_name: string | null;
  vendor_name: string | null;
  last_message_body: string | null;
  last_message_created_at: string | null;
  unread_count: number;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender_name: string | null;
};

export type ConversationThread = {
  id: string;
  customer_id: string;
  vendor_id: string;
  event_id: string;
  quote_id: string | null;
  created_at: string;
  updated_at: string;
  event_title: string | null;
  customer_name: string | null;
  vendor_name: string | null;
  messages: ConversationMessage[];
};

function profileDisplayName(profile: { full_name: string | null; business_name?: string | null } | null): string | null {
  if (!profile) {
    return null;
  }
  const businessName = profile.business_name?.trim();
  if (businessName) {
    return businessName;
  }
  const fullName = profile.full_name?.trim();
  return fullName || null;
}

export async function fetchConversationsForRole(role: UserRole, userId: string): Promise<ConversationListItem[]> {
  const supabase = await createClient();
  if (role !== "customer" && role !== "vendor") {
    return [];
  }

  let query = supabase
    .from("conversations")
    .select(
      `
      id,
      customer_id,
      vendor_id,
      event_id,
      quote_id,
      created_at,
      updated_at,
      events(title),
      customer:profiles!conversations_customer_id_fkey(full_name, business_name),
      vendor:profiles!conversations_vendor_id_fkey(full_name, business_name)
    `,
    )
    .order("updated_at", { ascending: false });

  query = role === "customer" ? query.eq("customer_id", userId) : query.eq("vendor_id", userId);

  const { data, error } = await query;
  if (error) {
    console.error("fetchConversationsForRole", error.message);
    return [];
  }

  const rows = (data ?? []) as Array<{
    id: string;
    customer_id: string;
    vendor_id: string;
    event_id: string;
    quote_id: string | null;
    created_at: string;
    updated_at: string;
    events: { title: string | null } | { title: string | null }[] | null;
    customer: { full_name: string | null; business_name: string | null } | { full_name: string | null; business_name: string | null }[] | null;
    vendor: { full_name: string | null; business_name: string | null } | { full_name: string | null; business_name: string | null }[] | null;
  }>;

  const conversationIds = rows.map((row) => row.id);
  const [lastMessagesResult, unreadMessagesResult] = await Promise.all([
    conversationIds.length
      ? supabase
          .from("messages")
          .select("id, conversation_id, body, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    conversationIds.length
      ? supabase
          .from("messages")
          .select("id, conversation_id")
          .in("conversation_id", conversationIds)
          .neq("sender_id", userId)
          .is("read_at", null)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const lastMessageByConversation = new Map<string, { body: string; created_at: string }>();
  if (!lastMessagesResult.error) {
    for (const message of (lastMessagesResult.data ?? []) as Array<{
      conversation_id: string;
      body: string;
      created_at: string;
    }>) {
      if (!lastMessageByConversation.has(message.conversation_id)) {
        lastMessageByConversation.set(message.conversation_id, {
          body: message.body,
          created_at: message.created_at,
        });
      }
    }
  }

  const unreadCountByConversation = new Map<string, number>();
  if (!unreadMessagesResult.error) {
    for (const message of (unreadMessagesResult.data ?? []) as Array<{ conversation_id: string }>) {
      unreadCountByConversation.set(
        message.conversation_id,
        (unreadCountByConversation.get(message.conversation_id) ?? 0) + 1,
      );
    }
  }

  return rows.map((row) => {
    const eventEmbed = Array.isArray(row.events) ? row.events[0] : row.events;
    const customerEmbed = Array.isArray(row.customer) ? row.customer[0] : row.customer;
    const vendorEmbed = Array.isArray(row.vendor) ? row.vendor[0] : row.vendor;
    const lastMessage = lastMessageByConversation.get(row.id);
    return {
      id: row.id,
      customer_id: row.customer_id,
      vendor_id: row.vendor_id,
      event_id: row.event_id,
      quote_id: row.quote_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      event_title: eventEmbed?.title ?? null,
      customer_name: profileDisplayName(customerEmbed),
      vendor_name: profileDisplayName(vendorEmbed),
      last_message_body: lastMessage?.body ?? null,
      last_message_created_at: lastMessage?.created_at ?? null,
      unread_count: unreadCountByConversation.get(row.id) ?? 0,
    };
  });
}

export async function fetchConversationThreadForRole(
  role: UserRole,
  userId: string,
  conversationId: string,
): Promise<ConversationThread | null> {
  const supabase = await createClient();
  if (role !== "customer" && role !== "vendor") {
    return null;
  }

  let query = supabase
    .from("conversations")
    .select(
      `
      id,
      customer_id,
      vendor_id,
      event_id,
      quote_id,
      created_at,
      updated_at,
      events(title),
      customer:profiles!conversations_customer_id_fkey(full_name, business_name),
      vendor:profiles!conversations_vendor_id_fkey(full_name, business_name)
    `,
    )
    .eq("id", conversationId);

  query = role === "customer" ? query.eq("customer_id", userId) : query.eq("vendor_id", userId);

  const { data: conversation, error } = await query.maybeSingle();
  if (error || !conversation) {
    return null;
  }

  const { data: messageRows, error: messageError } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, read_at, created_at, sender:profiles!messages_sender_id_fkey(full_name, business_name)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (messageError) {
    console.error("fetchConversationThreadForRole.messages", messageError.message);
  }

  const conversationEvent = Array.isArray(conversation.events) ? conversation.events[0] : conversation.events;
  const customer = Array.isArray(conversation.customer) ? conversation.customer[0] : conversation.customer;
  const vendor = Array.isArray(conversation.vendor) ? conversation.vendor[0] : conversation.vendor;

  return {
    id: conversation.id,
    customer_id: conversation.customer_id,
    vendor_id: conversation.vendor_id,
    event_id: conversation.event_id,
    quote_id: conversation.quote_id,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    event_title: conversationEvent?.title ?? null,
    customer_name: profileDisplayName(customer),
    vendor_name: profileDisplayName(vendor),
    messages: ((messageRows ?? []) as Array<{
      id: string;
      conversation_id: string;
      sender_id: string;
      body: string;
      read_at: string | null;
      created_at: string;
      sender:
        | { full_name: string | null; business_name: string | null }
        | { full_name: string | null; business_name: string | null }[]
        | null;
    }>).map((message) => {
      const sender = Array.isArray(message.sender) ? message.sender[0] : message.sender;
      return {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        body: message.body,
        read_at: message.read_at,
        created_at: message.created_at,
        sender_name: profileDisplayName(sender),
      };
    }),
  };
}

export async function fetchConversationByQuoteIdsForRole(
  role: UserRole,
  userId: string,
  quoteIds: string[],
): Promise<Map<string, string>> {
  const supabase = await createClient();
  if (!quoteIds.length || (role !== "customer" && role !== "vendor")) {
    return new Map<string, string>();
  }

  let query = supabase.from("conversations").select("id, quote_id").in("quote_id", quoteIds);
  query = role === "customer" ? query.eq("customer_id", userId) : query.eq("vendor_id", userId);

  const { data, error } = await query;
  if (error) {
    console.error("fetchConversationByQuoteIdsForRole", error.message);
    return new Map<string, string>();
  }

  const map = new Map<string, string>();
  for (const row of (data ?? []) as Array<{ id: string; quote_id: string | null }>) {
    if (row.quote_id) {
      map.set(row.quote_id, row.id);
    }
  }
  return map;
}

type ConversationSeedRow = {
  id: string;
  vendor_id: string;
  event_services:
    | {
        event_id: string;
        events: { customer_id: string } | { customer_id: string }[] | null;
      }
    | {
        event_id: string;
        events: { customer_id: string } | { customer_id: string }[] | null;
      }[]
    | null;
};

function customerIdFromQuoteSeed(
  row: ConversationSeedRow,
): { customerId: string | null; eventId: string | null } {
  const eventService = Array.isArray(row.event_services) ? row.event_services[0] : row.event_services;
  const event = Array.isArray(eventService?.events) ? eventService.events[0] : eventService?.events;
  return {
    customerId: event?.customer_id ?? null,
    eventId: eventService?.event_id ?? null,
  };
}

export async function ensureConversationsByQuoteIdsForRole(
  role: UserRole,
  userId: string,
  acceptedQuoteIds: string[],
): Promise<Map<string, string>> {
  const existingMap = await fetchConversationByQuoteIdsForRole(role, userId, acceptedQuoteIds);
  const missingQuoteIds = acceptedQuoteIds.filter((quoteId) => !existingMap.has(quoteId));

  if (!missingQuoteIds.length || (role !== "customer" && role !== "vendor")) {
    return existingMap;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      vendor_id,
      event_services!inner(
        event_id,
        events!inner(customer_id)
      )
    `,
    )
    .in("id", missingQuoteIds)
    .eq("status", "accepted");

  if (error) {
    console.error("ensureConversationsByQuoteIdsForRole.seed", error.message);
    return existingMap;
  }

  for (const row of (data ?? []) as ConversationSeedRow[]) {
    const { customerId, eventId } = customerIdFromQuoteSeed(row);
    if (!customerId || !eventId || !row.vendor_id) {
      continue;
    }
    const isViewerParticipant = role === "customer" ? customerId === userId : row.vendor_id === userId;
    if (!isViewerParticipant) {
      continue;
    }
    const result = await ensureConversationForAcceptedQuote({
      customerId,
      vendorId: row.vendor_id,
      eventId,
      quoteId: row.id,
    });
    if (result.conversationId) {
      existingMap.set(row.id, result.conversationId);
    }
  }

  return existingMap;
}
