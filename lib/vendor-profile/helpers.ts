export function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function normalizeSocialHandle(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/^@+/, "");
}

export function generateVendorSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isVendorProfileComplete(input: {
  businessName: string;
  slug: string;
  bio: string;
  businessPhone: string;
  serviceAreas: string;
}): boolean {
  return (
    input.businessName.trim().length > 1 &&
    input.slug.trim().length > 1 &&
    input.bio.trim().length > 20 &&
    input.businessPhone.trim().length > 6 &&
    input.serviceAreas.trim().length > 2
  );
}
