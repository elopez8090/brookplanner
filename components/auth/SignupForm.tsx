"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LabeledField } from "@/components/ui/LabeledField";
import { inputClassName, selectClassName } from "@/components/ui/fieldStyles";
import { postAuthRedirectPath } from "@/lib/auth/roleRedirect";
import { notifyAdminNewVendorAfterClientSignup } from "@/lib/email/adminVendorSignupAction";
import type { UserRole } from "@/lib/auth/types";

type PublicSignupRole = Extract<UserRole, "customer" | "vendor">;

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const full_name = String(fd.get("full_name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const roleRaw = String(fd.get("role") ?? "customer");
    const role: PublicSignupRole = roleRaw === "vendor" ? "vendor" : "customer";

    if (!full_name) {
      setError("Enter your full name.");
      return;
    }
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
      },
    });

    if (signError) {
      setError(signError.message);
      setPending(false);
      return;
    }

    if (!data.user) {
      setError("Sign up did not return a user. Try again.");
      setPending(false);
      return;
    }

    if (data.session) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name,
        role,
      });
      if (profileError) {
        setError(profileError.message);
        setPending(false);
        return;
      }
      if (role === "vendor") {
        void notifyAdminNewVendorAfterClientSignup();
      }
      router.refresh();
      router.push(postAuthRedirectPath({ role }));
      setPending(false);
      return;
    }

    setInfo("Check your email to confirm your account. After confirming, you can log in.");
    setPending(false);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {info}
        </p>
      ) : null}
      <LabeledField id="su-name" label="Full name">
        <input
          id="su-name"
          name="full_name"
          required
          disabled={pending}
          className={inputClassName}
          placeholder="Alex Rivera"
        />
      </LabeledField>
      <LabeledField id="su-email" label="Email">
        <input
          id="su-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          className={inputClassName}
          placeholder="you@email.com"
        />
      </LabeledField>
      <LabeledField id="su-password" label="Password">
        <input
          id="su-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={pending}
          className={inputClassName}
          placeholder="At least 6 characters"
        />
      </LabeledField>
      <LabeledField id="su-role" label="I am">
        <select id="su-role" name="role" className={selectClassName} defaultValue="customer" disabled={pending}>
          <option value="customer">Customer planning an event</option>
          <option value="vendor">Vendor quoting events</option>
        </select>
      </LabeledField>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-xl bg-accent-coral px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ease-out hover:bg-accent-coral-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
