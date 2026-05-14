type ActiveFilterChipsProps = {
  items: { key: string; text: string }[];
};

export function ActiveFilterChips({ items }: ActiveFilterChipsProps) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" aria-label="Active filters">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-brand-navy-muted">Showing</span>
      <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.key} className="min-w-0 max-w-full">
            <span className="inline-flex max-w-full items-center rounded-full border border-border-subtle bg-slate-50 px-3 py-1 text-xs font-medium text-brand-navy">
              <span className="break-words">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
