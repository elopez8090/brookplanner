import "server-only";
import { serverWarn } from "@/lib/logging/serverLog";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

/**
 * Reads `auth.users.email` via the Supabase Admin API (service role).
 * Never call from the browser — keep imports limited to server-only modules.
 */
export async function getUserEmailById(userId: string): Promise<string | null> {
  const id = userId.trim();
  if (!id) {
    return null;
  }

  const admin = createServiceRoleSupabase();
  if (!admin) {
    if (process.env.NODE_ENV === "development") {
      serverWarn("EMAIL", "getUserEmailById: missing service role client (SUPABASE_SERVICE_ROLE_KEY unset)");
    }
    return null;
  }

  try {
    const { data, error } = await admin.auth.admin.getUserById(id);
    if (error) {
      serverWarn("EMAIL", "getUserEmailById: admin API error", { message: error.message });
      return null;
    }
    const email = data.user?.email?.trim();
    return email && email.length > 0 ? email : null;
  } catch (err) {
    serverWarn("EMAIL", "getUserEmailById: unexpected error", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}
