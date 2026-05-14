import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

type PageIntroProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PageIntro({ title, description, children }: PageIntroProps) {
  return (
    <div className="border-b border-border-subtle bg-card shadow-[var(--shadow-card)]">
      <Container className="py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-base text-stone-600 sm:text-lg">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-6">{children}</div> : null}
      </Container>
    </div>
  );
}
