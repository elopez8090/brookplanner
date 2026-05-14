import { createClient } from "@/lib/supabase/server";

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  linkUrl = null,
}: CreateNotificationInput) {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link_url: linkUrl,
  });

  if (error) {
    console.error("Notification create error:", error.message);
  }
}