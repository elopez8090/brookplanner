import { vendorCategoryHubPath } from "@/lib/marketplace/vendorCategoryPages";
import { isPublicVendorDiscoveryEnabled } from "@/lib/marketplace/publicVendorDiscovery";

export const MVP_CATEGORIES = [
  {
    slug: "djs",
    name: "DJs",
    blurb: "Brooklyn DJs for weddings, parties, and corporate events.",
  },
  {
    slug: "photographers",
    name: "Photographers",
    blurb: "Capture your event with trusted local photographers.",
  },
  {
    slug: "caterers",
    name: "Caterers",
    blurb: "Food and beverage partners who know Brooklyn venues.",
  },
  {
    slug: "event-planners",
    name: "Event Planners",
    blurb: "Full-service planners to coordinate every detail.",
  },
  {
    slug: "venues",
    name: "Venues",
    blurb: "Unique spaces across Brooklyn for any size gathering.",
  },
  {
    slug: "party-rentals",
    name: "Party Rentals",
    blurb: "Tables, tents, decor, and equipment delivered on time.",
  },
] as const;

/** Homepage marketplace grid — links to SEO category hubs (see `lib/marketplace/vendorCategoryPages.ts`). */
export const HOME_MARKETPLACE_CATEGORY_CARDS = [
  {
    name: "DJs",
    slug: "djs",
    blurb: "Sound, mixing, and reception-ready setups.",
    vendorsHref: vendorCategoryHubPath("djs"),
  },
  {
    name: "Photographers",
    slug: "photographers",
    blurb: "Documentary coverage and editorial portraits.",
    vendorsHref: vendorCategoryHubPath("photographers"),
  },
  {
    name: "Caterers",
    slug: "caterers",
    blurb: "Menus and service tailored to your headcount.",
    vendorsHref: vendorCategoryHubPath("caterers"),
  },
  {
    name: "Venues",
    slug: "venues",
    blurb: "Lofts, rooftops, halls, and unique NYC spaces.",
    vendorsHref: vendorCategoryHubPath("venues"),
  },
  {
    name: "Party Rentals",
    slug: "party-rentals",
    blurb: "Tables, tents, lighting, and staging logistics.",
    vendorsHref: vendorCategoryHubPath("party-rentals"),
  },
  {
    name: "Event Planners",
    slug: "event-planners",
    blurb: "Timelines, staffing, and day-of coordination.",
    vendorsHref: vendorCategoryHubPath("event-planners"),
  },
] as const;

export type MarketingNavLink = { href: string; label: string };

/** Marketing header center navigation only (CTAs and auth live in `SiteHeaderClient`). */
export const NAV_LINKS: readonly MarketingNavLink[] = [
  { href: "/vendors", label: "Browse Vendors" },
  { href: "/categories", label: "Categories" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/vendor-signup", label: "For Vendors" },
];

const NAV_HIDDEN_WHEN_DISCOVERY_PAUSED = new Set(["/vendors", "/categories"]);

/** Marketing header links — omits browse/discovery entries when `PUBLIC_VENDOR_DISCOVERY_ENABLED` is false. */
export function marketingNavLinks(): readonly MarketingNavLink[] {
  if (isPublicVendorDiscoveryEnabled()) {
    return NAV_LINKS;
  }
  return NAV_LINKS.filter((item) => !NAV_HIDDEN_WHEN_DISCOVERY_PAUSED.has(item.href));
}

export const FOOTER_LINKS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/categories", label: "Categories" },
  { href: "/pricing", label: "Pricing" },
  { href: "/post-event", label: "Post an Event" },
  { href: "/vendor-signup", label: "Vendor Signup" },
  { href: "/login", label: "Log In" },
  { href: "/register", label: "Sign Up" },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
] as const;
