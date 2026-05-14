"use client";

import { useCallback, useState } from "react";

type CopyFilteredViewLinkProps = {
  className?: string;
};

export function CopyFilteredViewLink({ className }: CopyFilteredViewLinkProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={onCopy}
      className={
        className ??
        "inline-flex min-w-0 w-full max-w-full items-center justify-center whitespace-normal rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-center text-sm font-semibold leading-snug text-brand-navy transition-colors hover:bg-slate-50 sm:w-auto"
      }
    >
      {copied ? "Link copied" : "Copy filtered view link"}
    </button>
  );
}
