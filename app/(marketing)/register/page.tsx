import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { FormShell } from "@/components/ui/FormShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { FinishSignInRedirect } from "@/components/auth/FinishSignInRedirect";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";
import { getUserProfile } from "@/lib/auth/getUserProfile";
import { postAuthRedirectPath } from "@/lib/auth/roleRedirect";

export const metadata: Metadata = {
  title: "Register",
};

export default async function RegisterPage() {
  const { user, profile } = await getUserProfile();
  if (user && profile) {
    redirect(postAuthRedirectPath(profile));
  }

  if (user && !profile) {
    return (
      <Container>
        <FormShell title="Create your account" subtitle="Linking your session to your Brook Planner profile…">
          <FinishSignInRedirect />
        </FormShell>
        <div className="mx-auto mt-6 max-w-md px-1">
          <LegalDisclaimer className="text-center text-xs leading-relaxed text-brand-navy-muted [&_a]:font-semibold [&_a]:text-brand-navy [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:text-brand-navy-hover" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <FormShell title="Create your account" subtitle="Hosts and vendors both start here.">
        <SignupForm />
        <p className="mt-6 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-accent-blue transition-colors duration-200 ease-out hover:text-brand-navy hover:underline"
          >
            Log in
          </Link>
        </p>
        <div className="mx-auto mt-6 max-w-md px-1">
          <LegalDisclaimer className="text-center text-xs leading-relaxed text-brand-navy-muted [&_a]:font-semibold [&_a]:text-brand-navy [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:text-brand-navy-hover" />
        </div>
      </FormShell>
    </Container>
  );
}
