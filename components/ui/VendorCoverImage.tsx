"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

type VendorCoverImageProps = {
  src: string;
  alt: string;
  fallback: ReactNode;
  sizes?: string;
  imageClassName?: string;
};

export function VendorCoverImage({
  src,
  alt,
  fallback,
  sizes = "100vw",
  imageClassName = "object-cover",
}: VendorCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = src.trim();
  if (!trimmed || failed) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      fill
      className={imageClassName}
      sizes={sizes}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
    />
  );
}
