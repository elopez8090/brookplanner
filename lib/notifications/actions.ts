"use server";

import { createClient } from "@/lib/supabase/server";

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const id = notificationId.trim();
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

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Notification read update error:", error.message);
  }
}
