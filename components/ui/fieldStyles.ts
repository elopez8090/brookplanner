/** Shared Tailwind classes for form controls (UI shell). */
export const inputClassName =
  "block w-full rounded-xl border border-border-subtle bg-white px-3 py-2.5 text-sm text-brand-navy shadow-sm outline-none transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-stone-400 focus:border-brand-navy/25 focus:ring-2 focus:ring-brand-navy/15";

export const selectClassName = inputClassName;

export const textareaClassName = `${inputClassName} min-h-[120px] resize-y`;
