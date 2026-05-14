import {
  type VendorProfileCompletionInput,
  completionFlags,
  isVendorProfileCompletionRequiredComplete,
} from "@/lib/vendor-profile/profileCompletion";

export type MarketplaceReadinessTier = "beginner" | "active" | "marketplace_ready";

export type MarketplaceReadinessInput = {
  profile: VendorProfileCompletionInput;
  quotesSubmitted: number;
  hasCompletedCreditPurchase: boolean;
};

export type MarketplaceReadinessChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type MarketplaceReadinessResult = {
  tier: MarketplaceReadinessTier;
  tierLabel: string;
  metCount: number;
  totalSignals: number;
  percentRounded: number;
  checklist: MarketplaceReadinessChecklistItem[];
  nextStep: { label: string; href: string } | null;
  signals: {
    profileComplete: boolean;
    logoUploaded: boolean;
    serviceAreas: boolean;
    descriptionAdequate: boolean;
    hasQuote: boolean;
    hasPurchase: boolean;
  };
};

function trimmedLen(value: string | null | undefined): number {
  return (value ?? "").trim().length;
}

export function computeMarketplaceReadiness(input: MarketplaceReadinessInput): MarketplaceReadinessResult {
  const flags = completionFlags(input.profile);
  const profileComplete = isVendorProfileCompletionRequiredComplete(input.profile);
  const logoUploaded = flags.logo_url;
  const serviceAreas = flags.service_areas;
  const descriptionAdequate = trimmedLen(input.profile.bio) > 20;
  const hasQuote = input.quotesSubmitted > 0;
  const hasPurchase = input.hasCompletedCreditPurchase;

  const signals = {
    profileComplete,
    logoUploaded,
    serviceAreas,
    descriptionAdequate,
    hasQuote,
    hasPurchase,
  };

  const signalBools = [
    signals.profileComplete,
    signals.logoUploaded,
    signals.serviceAreas,
    signals.descriptionAdequate,
    signals.hasQuote,
    signals.hasPurchase,
  ];
  const metCount = signalBools.filter(Boolean).length;
  const totalSignals = 6;
  const percentRounded = Math.round((metCount / totalSignals) * 100);

  let tier: MarketplaceReadinessTier;
  let tierLabel: string;
  if (metCount >= totalSignals) {
    tier = "marketplace_ready";
    tierLabel = "Marketplace Ready";
  } else if (metCount >= 3) {
    tier = "active";
    tierLabel = "Active";
  } else {
    tier = "beginner";
    tierLabel = "Beginner";
  }

  const checklist: MarketplaceReadinessChecklistItem[] = [
    { id: "profile", label: "Complete your public profile", done: profileComplete, href: "/vendor/profile" },
    { id: "logo", label: "Upload a logo", done: logoUploaded, href: "/vendor/profile" },
    { id: "areas", label: "Add service areas", done: serviceAreas, href: "/vendor/profile" },
    { id: "bio", label: "Add a business description (20+ characters)", done: descriptionAdequate, href: "/vendor/profile" },
    { id: "credits", label: "Buy your first credits", done: hasPurchase, href: "/vendor/credits" },
    { id: "quote", label: "Submit your first quote", done: hasQuote, href: "/vendor/leads" },
  ];

  const next = checklist.find((row) => !row.done) ?? null;
  const nextStep = next ? { label: next.label, href: next.href } : null;

  return {
    tier,
    tierLabel,
    metCount,
    totalSignals,
    percentRounded,
    checklist,
    nextStep,
    signals,
  };
}

export function isStrictFirstTimeVendor(input: {
  isProfileCompleteDb: boolean;
  quotesSubmitted: number;
  hasCompletedCreditPurchase: boolean;
}): boolean {
  return !input.isProfileCompleteDb && input.quotesSubmitted === 0 && !input.hasCompletedCreditPurchase;
}
