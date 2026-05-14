import type { ReactNode } from "react";

type BadgeVariant = "default" | "coral" | "blue" | "navy";

const variants: Record<BadgeVariant, string> = {
  default:
    "bg-stone-100 text-stone-700 ring-stone-300/90 transition-colors duration-200 ease-out",
  coral:
    "bg-accent-coral/14 text-accent-coral ring-accent-coral/35 transition-colors duration-200 ease-out",
  blue:
    "bg-accent-blue/14 text-accent-blue ring-accent-blue/35 transition-colors duration-200 ease-out",
  navy:
    "bg-brand-navy/12 text-brand-navy ring-brand-navy/25 transition-colors duration-200 ease-out",
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ring-1 ring-inset ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
