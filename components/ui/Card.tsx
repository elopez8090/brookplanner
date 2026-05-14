import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border-subtle bg-card p-6 shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] transition-shadow duration-200 ${
        hover ? "hover:shadow-[var(--shadow-card-hover)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
