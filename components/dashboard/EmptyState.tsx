import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-brand-navy/[0.04] px-6 py-12 text-center">
      <p className="text-sm font-semibold text-brand-navy">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-brand-navy-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
