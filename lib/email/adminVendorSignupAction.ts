"use server";

import { fetchProfileByUserId } from "@/lib/auth/ensureProfile";
import { getUserEmailById } from "@/lib/email/getUserEmailById";
import { notifyAdminNewVendorEmail } from "@/lib/email/notifyMarketplace";
import { serverWarn } from "@/lib/logging/serverLog";
import { createClient } from "@/lib/supabase/server";

/**
 * Optional admin alert when a vendor account is ready (profile row exists).
 * Call from the client after signup or first sign-in once `profiles.role === 'vendor'`.
 */
export async function notifyAdminNewVendorAfterClientSignup(): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    const profile = await fetchProfileByUserId(supabase, user.id);
    if (!profile || profile.role !== "vendor") {
      return;
    }

    const vendorEmail = await getUserEmailById(user.id);

    await notifyAdminNewVendorEmail({
      vendorUserId: user.id,
      vendorEmail,
      fullName: profile.full_name,
    });
  } catch (err) {
    serverWarn("EMAIL", "notifyAdminNewVendorAfterClientSignup failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
