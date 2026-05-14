import "server-only";
import Stripe from "stripe";

let cached: Stripe | null | undefined;

/**
 * Returns a Stripe SDK client when `STRIPE_SECRET_KEY` is set; otherwise `null`.
 * Avoids throwing at import time so builds and diagnostics can run without Stripe.
 */
export function getStripe(): Stripe | null {
  if (cached !== undefined) {
    return cached;
  }
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecretKey) {
    cached = null;
    return null;
  }
  cached = new Stripe(stripeSecretKey);
  return cached;
}
