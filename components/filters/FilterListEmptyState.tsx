import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";

type FilterListEmptyStateProps = {
  variant: "no-results" | "no-records";
  resourceNoun: string;
  resetHref: string;
  filterHint?: string;
};

export function FilterListEmptyState({ variant, resourceNoun, resetHref, filterHint }: FilterListEmptyStateProps) {
  if (variant === "no-results") {
    return (
      <EmptyState
        title="No results match these filters"
        description={
          filterHint ??
          `Try loosening keyword, status, location, or category filters — or reset to see all ${resourceNoun}.`
        }
        action={
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link
              href={resetHref}
              className="inline-flex items-center justify-center rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a2f4f]"
            >
              Reset filters
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <EmptyState
      title={`No ${resourceNoun} yet`}
      description={`There are no ${resourceNoun} in the system right now. New records will show up here once they are created.`}
    />
  );
}
