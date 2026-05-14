"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ConversationMessage } from "@/lib/messages/queries";
import { markConversationAsRead } from "@/lib/messages/actions";
import { createClient } from "@/lib/supabase/client";

type ConversationThreadLiveProps = {
  conversationId: string;
  userId: string;
  role: "customer" | "vendor";
  peerDisplayName: string;
  syncKey: string;
  initialMessages: ConversationMessage[];
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type MessageState = {
  syncKey: string;
  initialMessages: ConversationMessage[];
  messages: ConversationMessage[];
};

function sortByCreatedAt(messages: ConversationMessage[]): ConversationMessage[] {
  return [...messages].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function mergeServerAndLocal(server: ConversationMessage[], prev: ConversationMessage[]): ConversationMessage[] {
  const map = new Map<string, ConversationMessage>();
  for (const message of server) {
    map.set(message.id, message);
  }
  for (const message of prev) {
    if (!map.has(message.id)) {
      map.set(message.id, message);
    }
  }
  return sortByCreatedAt(Array.from(map.values()));
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ConversationThreadLive({
  conversationId,
  userId,
  role,
  peerDisplayName,
  syncKey,
  initialMessages,
}: ConversationThreadLiveProps) {
  const [messageState, setMessageState] = useState<MessageState>(() => ({
    syncKey,
    initialMessages,
    messages: sortByCreatedAt(initialMessages),
  }));
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const peerLabel = useMemo(() => peerDisplayName.trim() || (role === "customer" ? "Vendor" : "Customer"), [peerDisplayName, role]);

  let messages = messageState.messages;
  if (messageState.syncKey !== syncKey || messageState.initialMessages !== initialMessages) {
    messages = mergeServerAndLocal(initialMessages, messageState.messages);
    setMessageState({ syncKey, initialMessages, messages });
  }

  useEffect(() => {
    void markConversationAsRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread-messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          if (!row?.id) {
            return;
          }
          const sender_name = row.sender_id === userId ? null : peerLabel;
          setMessageState((prev) => {
            if (prev.messages.some((m) => m.id === row.id)) {
              return prev;
            }
            const next: ConversationMessage = {
              id: row.id,
              conversation_id: row.conversation_id,
              sender_id: row.sender_id,
              body: row.body,
              read_at: row.read_at,
              created_at: row.created_at,
              sender_name,
            };
            return { ...prev, messages: sortByCreatedAt([...prev.messages, next]) };
          });
          if (row.sender_id !== userId) {
            void markConversationAsRead(conversationId);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          if (!row?.id) {
            return;
          }
          setMessageState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === row.id
                ? {
                    ...m,
                    read_at: row.read_at,
                    body: row.body,
                  }
                : m,
            ),
          }));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, userId, peerLabel]);

  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, lastMessageId]);

  if (messages.length === 0) {
    return <p className="text-sm text-brand-navy-muted">No messages yet. Send the first message below.</p>;
  }

  return (
    <div className="max-h-[min(28rem,70vh)] overflow-y-auto pr-1">
      <ul className="space-y-3">
        {messages.map((message) => {
          const fromCurrentUser = message.sender_id === userId;
          return (
            <li
              key={message.id}
              className={`rounded-xl border p-3 text-sm ${
                fromCurrentUser
                  ? "border-accent-coral/40 bg-accent-coral/10 text-brand-navy"
                  : "border-border-subtle bg-white text-brand-navy"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">
                {fromCurrentUser ? "You" : message.sender_name || peerLabel}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
              <p className="mt-2 text-xs text-brand-navy-muted">{formatDateTime(message.created_at)}</p>
            </li>
          );
        })}
      </ul>
      <div ref={bottomRef} aria-hidden className="h-px w-full shrink-0" />
    </div>
  );
}
