"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

type PlaceholderFormProps = {
  children: ReactNode;
  className?: string;
} & Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit">;

export function PlaceholderForm({
  children,
  className,
  ...rest
}: PlaceholderFormProps) {
  return (
    <form
      {...rest}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
