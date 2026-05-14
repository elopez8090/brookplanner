import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type FormShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function FormShell({ title, subtitle, children }: FormShellProps) {
  return (
    <div className="mx-auto w-full max-w-md py-12 sm:py-16">
      <Card className="p-8 sm:p-10">
        <h1 className="text-center text-2xl font-bold text-brand-navy">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-center text-sm text-stone-600">{subtitle}</p>
        ) : null}
        <div className="mt-8">{children}</div>
      </Card>
    </div>
  );
}
