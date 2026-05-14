import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  /** Tighter vertical rhythm for dense sections */
  dense?: boolean;
};

export function Section({
  children,
  id,
  className = "",
  dense = false,
}: SectionProps) {
  const py = dense ? "py-12 sm:py-16" : "py-16 sm:py-20 lg:py-24";
  return (
    <section id={id} className={`${py} ${className}`}>
      {children}
    </section>
  );
}
