import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { PrivacyPolicyDocument } from "@/components/legal/PrivacyPolicyDocument";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Brook Planner Privacy Policy — how we collect, use, and protect information for customers and vendors in Brooklyn, NY.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageIntro
        title="Privacy Policy"
        description="How Brook Planner collects, uses, and protects information when you use the platform."
      />
      <Section dense className="bg-background pb-16 sm:pb-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Card className="border-border-subtle p-8 shadow-card sm:p-10 lg:p-12">
              <PrivacyPolicyDocument />
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
