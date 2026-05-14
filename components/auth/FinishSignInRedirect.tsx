"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { postAuthRedirectPath } from "@/lib/auth/roleRedirect";
import { fetchOrEnsureProfileWithMeta } from "@/lib/auth/ensureProfile";
import { notifyAdminNewVendorAfterClientSignup } from "@/lib/email/adminVendorSignupAction";

type FinishSignInRedirectProps = {
  redirectNext?: string | null;
};

/**
 * Server-side profile reads can race immediately after cookie/session refresh.
 * Re-resolve profile on the client before sending users to `/register`.
 */
export function FinishSignInRedirect({ redirectNext = null }: FinishSignInRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          router.replace("/login");
        }
        return;
      }

      const { profile, profileCreated } = await fetchOrEnsureProfileWithMeta(supabase, user);

      if (cancelled) {
        return;
      }

      if (profileCreated && profile?.role === "vendor") {
        void notifyAdminNewVendorAfterClientSignup();
      }

      const defaultPath = postAuthRedirectPath(profile, { noProfile: "register" });
      const path =
        profile?.role === "customer" && redirectNext ? redirectNext : defaultPath;

      router.replace(path);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [redirectNext, router]);

  return (
    <div className="space-y-3 text-center text-sm text-stone-600">
      <p>Loading your account…</p>
    </div>
  );
}
