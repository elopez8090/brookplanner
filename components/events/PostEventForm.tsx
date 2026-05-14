"use client";

import { useActionState, useEffect, useRef } from "react";
import { PageIntro } from "@/components/layout/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LabeledField } from "@/components/ui/LabeledField";
import { inputClassName, selectClassName, textareaClassName } from "@/components/ui/fieldStyles";
import { EVENT_TYPE_OPTIONS } from "@/lib/events/eventTypes";
import { createCustomerEvent, type CreateEventFormState } from "@/lib/events/actions";
import type { CategoryRow } from "@/lib/events/types";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

const initialState: CreateEventFormState = { error: null };

type PostEventFormProps = {
  categories: CategoryRow[];
};

export function PostEventForm({ categories }: PostEventFormProps) {
  const [state, formAction, pending] = useActionState(createCustomerEvent, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.error]);

  return (
    <>
      <PageIntro
        title="Post your Brooklyn event"
        description="Free to post. Get quotes from Brooklyn vendors and compare up to 4 quotes per service—share your date, neighborhood, budget, and what you need."
      />
      <Section dense className="bg-background">
        <Container>
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 rounded-2xl border border-accent-blue/20 bg-gradient-to-br from-accent-blue/[0.08] to-white px-5 py-4 text-sm leading-relaxed text-brand-navy shadow-sm ring-1 ring-black/[0.03] sm:px-6">
              <p className="font-semibold text-brand-navy">How quoting works</p>
              <p className="mt-1.5 text-brand-navy-muted">
                Your event is visible to Brooklyn marketplace vendors. They submit quotes; you compare proposals and
                accept only a vendor you want. You are never obligated to choose someone.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-brand-navy-muted">
                <span className="font-medium text-brand-navy">Posting is free</span>
                <span className="mx-1.5 text-brand-navy/35" aria-hidden>
                  ·
                </span>
                <span className="font-medium text-brand-navy">No obligation</span>
                <span className="mx-1.5 text-brand-navy/35" aria-hidden>
                  ·
                </span>
                Vendors submit quotes
                <span className="mx-1.5 text-brand-navy/35" aria-hidden>
                  ·
                </span>
                You choose freely
              </p>
            </div>
            <Card className="p-8 sm:p-10">
              <form ref={formRef} action={formAction} className="grid gap-5 sm:grid-cols-2">
                {state.error ? (
                  <div className="sm:col-span-2" role="alert">
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {state.error}
                    </p>
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <LabeledField id="title" label="Event title">
                    <input
                      id="title"
                      name="title"
                      required
                      disabled={pending}
                      className={inputClassName}
                      placeholder="e.g. Rooftop birthday in Williamsburg"
                    />
                  </LabeledField>
                </div>

                <LabeledField id="event_type" label="Event type">
                  <select
                    id="event_type"
                    name="event_type"
                    required
                    disabled={pending}
                    className={selectClassName}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select type…
                    </option>
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </LabeledField>

                <LabeledField id="event_date" label="Event date">
                  <input
                    id="event_date"
                    name="event_date"
                    type="date"
                    required
                    disabled={pending}
                    className={inputClassName}
                  />
                </LabeledField>

                <LabeledField id="neighborhood" label="Brooklyn neighborhood">
                  <input
                    id="neighborhood"
                    name="neighborhood"
                    required
                    disabled={pending}
                    className={inputClassName}
                    placeholder="e.g. Park Slope"
                  />
                </LabeledField>

                <LabeledField id="guest_count" label="Guest count (estimate)">
                  <input
                    id="guest_count"
                    name="guest_count"
                    type="number"
                    min={1}
                    required
                    disabled={pending}
                    className={inputClassName}
                    placeholder="120"
                  />
                </LabeledField>

                <div className="sm:col-span-2">
                  <LabeledField id="budget_range" label="Budget range">
                    <input
                      id="budget_range"
                      name="budget_range"
                      disabled={pending}
                      className={inputClassName}
                      placeholder="e.g. $8k–$12k"
                    />
                  </LabeledField>
                </div>

                <div className="sm:col-span-2">
                  <fieldset className="min-w-0">
                    <legend className="text-sm font-semibold text-brand-navy">Services needed</legend>
                    <p className="mt-1 text-xs text-brand-navy-muted">
                      Select every service you want quotes for.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {categories.map((c) => (
                        <label
                          key={c.id}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-black/[0.02] transition-colors duration-200 ease-out hover:border-brand-navy/20"
                        >
                          <input
                            type="checkbox"
                            name="category_ids"
                            value={c.id}
                            disabled={pending}
                            className="mt-0.5 h-4 w-4 rounded border-border-subtle text-accent-coral focus:ring-brand-navy/20"
                          />
                          <span className="min-w-0">
                            <span className="font-medium text-brand-navy">{c.name}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <div className="sm:col-span-2">
                  <LabeledField id="details" label="Event details">
                    <textarea
                      id="details"
                      name="details"
                      required
                      disabled={pending}
                      className={textareaClassName}
                      placeholder="Vibe, timing, must-haves, accessibility, load-in constraints…"
                    />
                  </LabeledField>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-xl bg-accent-coral px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 ease-out hover:bg-accent-coral-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
                  >
                    {pending ? "Posting…" : "Post event"}
                  </button>
                </div>

                <div className="sm:col-span-2">
                  <LegalDisclaimer className="text-xs leading-relaxed text-brand-navy-muted [&_a]:font-semibold [&_a]:text-brand-navy [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:text-brand-navy-hover" />
                </div>
              </form>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}
