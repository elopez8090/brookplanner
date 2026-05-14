"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to messages table changes visible to the user (RLS-scoped) and
 * refreshes the current route so conversation previews and unread counts stay live.
 */
export function MessagesRealtimeRouterRefresh() {
  const router = useRouter();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const refreshSoon = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => router.refresh(), 120);
    };

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user?.id) {
        return;
      }

      const channel = supabase
        .channel(`messages-router:${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          () => refreshSoon(),
        )
        .subscribe();

      if (cancelled) {
        void supabase.removeChannel(channel);
      } else {
        channelRef.current = channel;
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(debounce);
      const ch = channelRef.current;
      channelRef.current = null;
      if (ch) {
        void supabase.removeChannel(ch);
      }
    };
  }, [router]);

  return null;
}
