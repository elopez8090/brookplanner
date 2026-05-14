"use client";

import { createClient } from "@/lib/supabase/client";

type AppRouterLike = { push: (path: string) => void; refresh: () => void };

/**
 * Ends the Supabase session (all tabs when supported) and sends the user home.
 */
export async function signOutAndRedirect(router: AppRouterLike, destination: "/" | "/login" = "/") {
  const supabase = createClient();
  await supabase.auth.signOut({ scope: "global" });
  router.refresh();
  router.push(destination);
}
