import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAccountRestrictedStatus } from "@/lib/auth/accountStatus";
import { fetchProfileByUserId } from "@/lib/auth/ensureProfile";
import { serverWarn } from "@/lib/logging/serverLog";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

type CreditPackage = {
  name: string;
  credits: number;
  amountDollars: number;
};

const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  starter: { name: "Starter Pack", credits: 6, amountDollars: 25 },
  growth: { name: "Growth Pack", credits: 12, amountDollars: 50 },
  pro: { name: "Pro Pack", credits: 25, amountDollars: 100 },
};

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  if (!appUrl) {
    return NextResponse.json({ error: "Missing NEXT_PUBLIC_APP_URL." }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const profile = await fetchProfileByUserId(supabase, user.id);
  if (!profile || profile.role !== "vendor") {
    return NextResponse.json({ error: "Only vendors can buy credits." }, { status: 403 });
  }
  if (isAccountRestrictedStatus(profile.status)) {
    return NextResponse.json(
      { error: "Your account cannot purchase credits right now. Contact support if you need help." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as { packageId?: string } | null;
  const packageId = typeof body?.packageId === "string" ? body.packageId : "";
  const selectedPackage = CREDIT_PACKAGES[packageId];

  if (!selectedPackage) {
    return NextResponse.json({ error: "Invalid credit package." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    serverWarn("STRIPE", "Credit checkout: STRIPE_SECRET_KEY not configured");
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/vendor/credits/success`,
      cancel_url: `${appUrl}/vendor/credits/cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name: selectedPackage.name,
            },
            unit_amount: selectedPackage.amountDollars * 100,
          },
        },
      ],
      metadata: {
        vendor_id: user.id,
        credits: String(selectedPackage.credits),
        package_name: selectedPackage.name,
      },
    });
  } catch (err) {
    serverWarn("STRIPE", "Credit checkout: Stripe session creation failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Could not start checkout. Try again later." }, { status: 502 });
  }

  let purchaseError: { message?: string } | null = null;
  try {
    const serviceRole = createServiceRoleClient();
    const { error } = await serviceRole.from("credit_purchases").insert({
      vendor_id: user.id,
      stripe_session_id: session.id,
      amount_paid: selectedPackage.amountDollars,
      credits_added: selectedPackage.credits,
      status: "pending",
    });
    purchaseError = error;
  } catch (error) {
    purchaseError = {
      message: error instanceof Error ? error.message : "Could not create pending credit purchase.",
    };
  }

  if (purchaseError) {
    serverWarn("STRIPE", "Credit checkout: pending purchase insert failed", {
      message: purchaseError.message ?? "unknown",
    });
    return NextResponse.json(
      { error: purchaseError.message || "Could not create pending credit purchase." },
      { status: 500 },
    );
  }

  if (!session.url) {
    serverWarn("STRIPE", "Credit checkout: Stripe session missing redirect URL");
    return NextResponse.json({ error: "Could not create checkout URL." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
