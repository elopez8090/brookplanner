import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-coral text-white shadow-md hover:bg-accent-coral-hover focus-visible:outline-accent-coral",
  secondary:
    "border border-brand-navy bg-white text-brand-navy shadow-sm hover:border-brand-navy hover:bg-white hover:text-brand-navy",
  ghost:
    "text-brand-navy-muted hover:bg-brand-navy/[0.06] hover:text-brand-navy",
};

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
