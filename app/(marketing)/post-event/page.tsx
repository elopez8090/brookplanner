import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/getUserProfile";
import { fetchCategoriesForPosting } from "@/lib/events/queries";
import { PostEventForm } from "@/components/events/PostEventForm";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Post an Event",
};

export default async function PostEventPage() {
  await requireRole("customer");

  const categories = await fetchCategoriesForPosting();

  if (categories.length === 0) {
    return (
      <>
        <PageIntro
          title="Post your Brooklyn event"
          description="Categories could not be loaded. Apply the Supabase migration (categories seed), then refresh."
        />
        <Section dense className="bg-background">
          <Container>
            <div className="mx-auto max-w-2xl">
              <Card className="p-8 sm:p-10">
                <p className="text-sm leading-relaxed text-brand-navy-muted">
                  The <code className="rounded bg-brand-navy/5 px-1.5 py-0.5 text-xs">categories</code> table is
                  empty or unavailable. Run the SQL in{" "}
                  <code className="rounded bg-brand-navy/5 px-1.5 py-0.5 text-xs">
                    supabase/migrations/20260504120000_phase3_events_categories.sql
                  </code>{" "}
                  in the Supabase SQL editor, then reload this page.
                </p>
              </Card>
            </div>
          </Container>
        </Section>
      </>
    );
  }

  return <PostEventForm categories={categories} />;
}
