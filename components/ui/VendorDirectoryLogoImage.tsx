"use client";

import Image from "next/image";
import { useState } from "react";

function vendorInitial(name: string): string {
  const c = name.trim().charAt(0).toUpperCase();
  return c || "V";
}

export type VendorDirectoryLogoImageProps = {
  logoUrl: string | null | undefined;
  businessName: string;
  /** Pass `""` for decorative logos (name is nearby in the layout). */
  alt?: string;
  /** Typography / colors for the letter fallback (wrapper is a centered flex square). */
  fallbackClassName: string;
  sizes?: string;
  priority?: boolean;
};

export function VendorDirectoryLogoImage({
  logoUrl,
  businessName,
  alt,
  fallbackClassName,
  sizes = "(max-width: 1536px) 14vw, 112px",
  priority,
}: VendorDirectoryLogoImageProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = logoUrl?.trim() ?? "";
  const show = Boolean(trimmed) && !failed;
  const initials = vendorInitial(businessName);
  const altText = alt === undefined ? `${businessName} logo` : alt;
  const decorative = altText === "";

  if (!show) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}
        {...(decorative ? { "aria-hidden": true } : {})}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={trimmed}
      alt={altText}
      fill
      className="object-cover"
      sizes={sizes}
      onError={() => setFailed(true)}
      priority={priority}
      referrerPolicy="no-referrer"
    />
  );
}
