import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SuspendedAccountPanel } from "@/components/account/SuspendedAccountPanel";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { isAccountRestrictedStatus } from "@/lib/auth/accountStatus";
import { dashboardPathForRole } from "@/lib/auth/dashboardPaths";
import { getUserProfile } from "@/lib/auth/getUserProfile";

export const metadata: Metadata = {
  title: "Account restricted",
};

export default async function AccountSuspendedPage() {
  const { user, profile } = await getUserProfile();

  if (!user) {
    redirect("/login");
  }
  if (!profile) {
    redirect("/register");
  }

  if (!isAccountRestrictedStatus(profile.status)) {
    redirect(dashboardPathForRole(profile.role));
  }

  const statusLabel = profile.status === "deactivated" ? "Deactivated account" : "Suspended account";

  return (
    <Section className="bg-background py-16 sm:py-24">
      <Container>
        <SuspendedAccountPanel statusLabel={statusLabel} />
      </Container>
    </Section>
  );
}
