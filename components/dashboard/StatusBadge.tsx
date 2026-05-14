import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "info" | "neutral" | "coral";

const tones: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-300/90 transition-colors duration-200 ease-out",
  warning: "bg-amber-50 text-amber-900 ring-amber-300/90 transition-colors duration-200 ease-out",
  info: "bg-accent-blue/14 text-accent-blue ring-accent-blue/35 transition-colors duration-200 ease-out",
  neutral: "bg-brand-navy/12 text-brand-navy ring-brand-navy/25 transition-colors duration-200 ease-out",
  coral: "bg-accent-coral/14 text-accent-coral ring-accent-coral/35 transition-colors duration-200 ease-out",
};

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
};

export function StatusBadge({ children, tone = "neutral", className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
