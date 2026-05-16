/**
 * Toggle public vendor browse/search/discovery UI without removing routes, RPCs, or SEO.
 * Set to `true` when the marketplace directory is ready for launch traffic.
 */
export const PUBLIC_VENDOR_DISCOVERY_ENABLED = false;

export function isPublicVendorDiscoveryEnabled(): boolean {
  return PUBLIC_VENDOR_DISCOVERY_ENABLED;
}

export const publicVendorDiscoveryPausedCopy = {
  eyebrow: "Matched vendors",
  headline: "Vendors are matched after you post your event.",
  body: "Post your event and receive quotes from NYC vendors. We connect you with DJs, photographers, caterers, venues, and more — no empty directory browsing.",
  primaryCta: { href: "/post-event", label: "Post Your Event" },
  secondaryLine: "Free to post · Compare up to four quotes per service · No obligation until you book",
} as const;
