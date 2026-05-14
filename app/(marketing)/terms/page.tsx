import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { TermsOfServiceDocument } from "@/components/legal/TermsOfServiceDocument";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Brook Planner Terms of Service — marketplace terms for customers and vendors in Brooklyn, NY.",
};

export default function TermsPage() {
  return (
    <>
      <PageIntro
        title="Terms of Service"
        description="Please read these terms carefully. They govern your use of Brook Planner."
      />
      <Section dense className="bg-background pb-16 sm:pb-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Card className="border-border-subtle p-8 shadow-card sm:p-10 lg:p-12">
              <TermsOfServiceDocument />
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
