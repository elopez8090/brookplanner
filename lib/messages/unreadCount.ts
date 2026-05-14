import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchUnreadMessageCountForUser(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .neq("sender_id", userId);

  if (error) {
    console.error("fetchUnreadMessageCountForUser", error.message);
    return 0;
  }

  return count ?? 0;
}
