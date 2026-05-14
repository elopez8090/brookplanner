"use client";

import { useState } from "react";

type CreditPackageCardProps = {
  packageId: string;
  name: string;
  amountLabel: string;
  credits: number;
};

export function CreditPackageCard({ packageId, name, amountLabel, credits }: CreditPackageCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleBuyCredits() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/vendor/credits/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageId }),
      });

      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!response.ok || !payload?.url) {
        setErrorMessage(payload?.error ?? "Could not start checkout. Please try again.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setErrorMessage("Could not start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <article className="rounded-2xl border border-border-subtle bg-card p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-blue">Credit package</p>
      <h3 className="mt-2 text-xl font-bold tracking-tight text-brand-navy">{name}</h3>
      <p className="mt-3 text-3xl font-bold tracking-tight text-brand-navy">{amountLabel}</p>
      <p className="mt-1 text-sm text-brand-navy-muted">{credits} credits</p>
      <button
        type="button"
        onClick={handleBuyCredits}
        disabled={isLoading}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-accent-coral px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors duration-200 ease-out hover:bg-accent-coral-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-coral disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Redirecting..." : "Buy Credits"}
      </button>
      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
    </article>
  );
}
