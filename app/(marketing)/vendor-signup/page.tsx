import type { Metadata } from "next";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LabeledField } from "@/components/ui/LabeledField";
import { inputClassName, textareaClassName } from "@/components/ui/fieldStyles";
import Link from "next/link";
import { PlaceholderForm } from "@/components/ui/PlaceholderForm";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

export const metadata: Metadata = {
  title: "Vendor Signup",
};

export default function VendorSignupPage() {
  return (
    <>
      <PageIntro
        title="Become a Brook Planner vendor"
        description="Join Brooklyn’s event marketplace. This page is a UI placeholder—no accounts or payments yet."
      />
      <Section dense className="bg-background">
        <Container>
          <div className="mx-auto max-w-xl">
            <Card className="p-8 sm:p-10">
              <PlaceholderForm className="space-y-5">
                <LabeledField id="biz" label="Business name">
                  <input id="biz" name="business" className={inputClassName} placeholder="e.g. North Brooklyn DJ Co." />
                </LabeledField>
                <LabeledField id="email" label="Work email">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={inputClassName}
                    placeholder="you@company.com"
                  />
                </LabeledField>
                <LabeledField id="cats" label="Primary categories">
                  <select id="cats" name="categories" className={inputClassName} defaultValue="">
                    <option value="" disabled>
                      Select a category
                    </option>
                    <option>DJs</option>
                    <option>Photographers</option>
                    <option>Caterers</option>
                    <option>Event Planners</option>
                    <option>Venues</option>
                    <option>Party Rentals</option>
                  </select>
                </LabeledField>
                <LabeledField id="pitch" label="Short pitch">
                  <textarea
                    id="pitch"
                    name="pitch"
                    className={textareaClassName}
                    placeholder="What makes your team a great fit for Brooklyn hosts?"
                  />
                </LabeledField>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-accent-coral px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ease-out hover:bg-accent-coral-hover"
                >
                  Join waitlist (placeholder)
                </button>
              </PlaceholderForm>
            </Card>
            <div className="mx-auto mt-6 max-w-xl">
              <LegalDisclaimer className="text-center text-xs leading-relaxed text-brand-navy-muted [&_a]:font-semibold [&_a]:text-brand-navy [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:text-brand-navy-hover" />
            </div>
            <div className="mt-6 text-center text-sm text-stone-600">
              Already onboard?{" "}
              <Link
                href="/vendor/dashboard"
                className="font-semibold text-accent-blue transition-colors duration-200 ease-out hover:text-brand-navy hover:underline"
              >
                Vendor dashboard
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
