"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LabeledField } from "@/components/ui/LabeledField";
import { inputClassName } from "@/components/ui/fieldStyles";
import {
  isAccountRestrictedStatus,
  normalizeProfileStatus,
} from "@/lib/auth/accountStatus";

type LoginFormProps = {
  /** Safe internal path (e.g. from `?next=`) — only applied for customer accounts. */
  redirectNext?: string | null;
};

export function LoginForm({ redirectNext = null }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setPending(true);
    const supabase = createClient();

    const { data, error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signError) {
      setError(signError.message);
      setPending(false);
      return;
    }

    // TEMP DIAGNOSTICS — remove once login redirect is confirmed stable.
    console.log("LOGIN AUTH DATA", data);
    console.log("LOGIN USER ID", data.user?.id);

    const user = data.user;
    if (!user) {
      setError("Could not load your session. Try again.");
      setPending(false);
      return;
    }

    // Direct profile lookup. Do NOT funnel through ensureProfile / FinishSignInRedirect —
    // those paths can mask an RLS denial as a missing profile and bounce the user to /register.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, status, full_name")
      .eq("id", user.id)
      .maybeSingle();

    // TEMP DIAGNOSTICS — remove once login redirect is confirmed stable.
    console.log("LOGIN PROFILE", profile);
    console.log("LOGIN PROFILE ERROR", profileError);

    if (profileError) {
      console.error("LOGIN PROFILE LOOKUP FAILED", profileError);
      setError("Login succeeded, but profile lookup failed.");
      setPending(false);
      return;
    }

    if (!profile) {
      // Truly no row for this auth user — registration is the right destination.
      router.replace("/register");
      return;
    }

    const status = normalizeProfileStatus(
      typeof profile.status === "string" ? profile.status : null,
    );
    if (isAccountRestrictedStatus(status)) {
      router.replace("/account-suspended");
      return;
    }

    const role =
      typeof profile.role === "string" ? profile.role.trim().toLowerCase() : "";

    if (role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }

    if (role === "vendor") {
      router.replace("/vendor/dashboard");
      return;
    }

    if (role === "customer") {
      router.replace(redirectNext ?? "/customer/dashboard");
      return;
    }

    // Unknown / unset role on an existing row — send to register so the user can re-pick.
    router.replace("/register");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <LabeledField id="login-email" label="Email">
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          className={inputClassName}
          placeholder="you@email.com"
        />
      </LabeledField>
      <LabeledField id="login-password" label="Password">
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className={inputClassName}
          placeholder="••••••••"
        />
      </LabeledField>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ease-out hover:bg-brand-navy-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Continue"}
      </button>
    </form>
  );
}
