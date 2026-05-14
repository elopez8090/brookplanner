import { createClient } from "@/lib/supabase/server";
import { SiteHeaderClient, type HeaderNotification } from "@/components/layout/SiteHeaderClient";
import { fetchUnreadMessageCountForUser } from "@/lib/messages/unreadCount";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let notifications: HeaderNotification[] = [];
  let unreadNotifications = 0;
  let messagesHref: string | null = null;
  let unreadMessages = 0;

  if (user) {
    const { data: profileRow } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();

    if (profileRow?.role === "customer") {
      messagesHref = "/customer/messages";
      unreadMessages = await fetchUnreadMessageCountForUser(supabase, user.id);
    } else if (profileRow?.role === "vendor") {
      messagesHref = "/vendor/messages";
      unreadMessages = await fetchUnreadMessageCountForUser(supabase, user.id);
    }

    const [{ data }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, title, message, link_url, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
    ]);

    notifications = data ?? [];
    unreadNotifications = count ?? 0;
  }

  return (
    <SiteHeaderClient
      notifications={notifications}
      unreadNotifications={unreadNotifications}
      messagesHref={messagesHref}
      initialUnreadMessages={unreadMessages}
    />
  );
}
