"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

export type DebouncedUrlKeywordInputProps = {
  id: string;
  /** Form field name for GET submit (default `q`). */
  name?: string;
  /** URL query key to read/write (default `q`). */
  paramName?: string;
  placeholder?: string;
  initialValue: string;
  className?: string;
};

function FallbackKeywordInput({
  id,
  name = "q",
  placeholder,
  initialValue,
  className,
}: DebouncedUrlKeywordInputProps) {
  return (
    <input
      id={id}
      name={name}
      defaultValue={initialValue}
      placeholder={placeholder}
      autoComplete="off"
      className={className}
    />
  );
}

function DebouncedUrlKeywordInputInner({
  id,
  name = "q",
  paramName = "q",
  placeholder,
  initialValue,
  className,
}: DebouncedUrlKeywordInputProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);

  const [value, setValue] = useState(initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const pushDebounced = useCallback(
    (nextRaw: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParamsRef.current.toString());
        const trimmed = nextRaw.trim();
        if (trimmed) {
          params.set(paramName, trimmed);
        } else {
          params.delete(paramName);
        }
        const qs = params.toString();
        const nextHref = qs ? `${pathname}?${qs}` : pathname;
        const curQs = searchParamsRef.current.toString();
        const curHref = curQs ? `${pathname}?${curQs}` : pathname;
        if (nextHref !== curHref) {
          router.replace(nextHref, { scroll: false });
        }
      }, DEBOUNCE_MS);
    },
    [paramName, pathname, router],
  );

  return (
    <input
      id={id}
      name={name}
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      className={className}
      onChange={(e) => {
        const v = e.target.value;
        setValue(v);
        pushDebounced(v);
      }}
    />
  );
}

export function DebouncedUrlKeywordInput(props: DebouncedUrlKeywordInputProps) {
  return (
    <Suspense fallback={<FallbackKeywordInput {...props} />}>
      <DebouncedUrlKeywordInputInner {...props} />
    </Suspense>
  );
}
