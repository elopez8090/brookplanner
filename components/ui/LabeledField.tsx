import type { ReactNode } from "react";

type LabeledFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
};

export function LabeledField({ id, label, children }: LabeledFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-brand-navy">
        {label}
      </label>
      {children}
    </div>
  );
}
