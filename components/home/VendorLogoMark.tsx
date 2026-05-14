"use client";

import Image from "next/image";
import { useState } from "react";

type VendorLogoMarkProps = {
  src: string | null;
  alt: string;
  initials: string;
  className?: string;
};

export function VendorLogoMark({ src, alt, initials, className = "" }: VendorLogoMarkProps) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-gradient-to-br from-brand-navy/[0.07] to-brand-navy/[0.02] ${className}`}
    >
      {showImg ? (
        <Image
          src={src!}
          alt={alt}
          fill
          className="object-cover"
          sizes="120px"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-xl font-bold text-brand-navy">{initials}</span>
      )}
    </div>
  );
}
