import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { FormShell } from "@/components/ui/FormShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { FinishSignInRedirect } from "@/components/auth/FinishSignInRedirect";
import { getUserProfile } from "@/lib/auth/getUserProfile";
import { postAuthRedirectPath } from "@/lib/auth/roleRedirect";
import { safeInternalPath } from "@/lib/auth/safeRedirectPath";

export const metadata: Metadata = {
  title: "Log In",
};

type LoginPageProps = {
  searchParams?: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { user, profile } = await getUserProfile();
  if (user && profile) {
    redirect(postAuthRedirectPath(profile));
  }

  const sp = searchParams ? await searchParams : undefined;
  const raw = Array.isArray(sp?.next) ? sp.next[0] : sp?.next;
  const nextSafe = safeInternalPath(raw ?? null);

  if (user && !profile) {
    return (
      <Container>
        <FormShell title="Welcome back" subtitle="Almost there — finishing sign-in.">
          <FinishSignInRedirect redirectNext={nextSafe} />
        </FormShell>
      </Container>
    );
  }

  return (
    <Container>
      <FormShell title="Welcome back" subtitle="Sign in to your Brook Planner account.">
        <LoginForm redirectNext={nextSafe} />
        <p className="mt-6 text-center text-sm text-stone-600">
          New here?{" "}
          <Link
            href="/register"
            className="font-semibold text-accent-blue transition-colors duration-200 ease-out hover:text-brand-navy hover:underline"
          >
            Create an account
          </Link>
        </p>
      </FormShell>
    </Container>
  );
}
