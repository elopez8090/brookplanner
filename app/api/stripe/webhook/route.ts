import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { serverError, serverWarn } from "@/lib/logging/serverLog";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return { client: null as ReturnType<typeof createClient> | null, missingEnv: true as const };
  }

  return {
    client: createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
    missingEnv: false as const,
  };
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      serverWarn("STRIPE", "Webhook rejected: missing stripe-signature header");
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      serverWarn("STRIPE", "Webhook misconfiguration: STRIPE_WEBHOOK_SECRET unset");
      return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 500 });
    }

    const stripe = getStripe();
    if (!stripe) {
      serverWarn("STRIPE", "Webhook misconfiguration: STRIPE_SECRET_KEY unset");
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const body = await req.text();

    let event: ReturnType<typeof stripe.webhooks.constructEvent>;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid Stripe event.";
      serverWarn("STRIPE", "Webhook signature verification failed", { message });
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object;
    const vendorId = session.metadata?.vendor_id;
    const packageName = session.metadata?.package_name ?? "credits package";
    const credits = Number.parseInt(session.metadata?.credits ?? "", 10);

    if (!vendorId || !Number.isInteger(credits) || credits <= 0) {
      serverWarn("STRIPE", "Webhook checkout.session.completed: invalid metadata", {
        hasVendorId: Boolean(vendorId),
        creditsParsed: Number.isFinite(credits) ? credits : null,
      });
      return NextResponse.json({ error: "Invalid checkout metadata." }, { status: 400 });
    }

    const { client: supabase, missingEnv } = createServiceRoleClient();
    if (missingEnv || !supabase) {
      serverWarn("STRIPE", "Webhook failed: Supabase service credentials missing");
      return NextResponse.json({ error: "Server storage is not configured." }, { status: 503 });
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from("credit_purchases")
      .select("id, vendor_id, status")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (purchaseError) {
      serverWarn("STRIPE", "Webhook credit_purchases lookup failed", { message: purchaseError.message });
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    }

    if (!purchase) {
      serverWarn("STRIPE", "Webhook: purchase row not found for session", { sessionIdSuffix: session.id.slice(-8) });
      return NextResponse.json({ error: "Purchase row not found." }, { status: 404 });
    }

    if (purchase.status === "completed") {
      return NextResponse.json({ received: true });
    }

    if (purchase.vendor_id !== vendorId) {
      serverWarn("STRIPE", "Webhook: vendor mismatch on purchase row");
      return NextResponse.json({ error: "Vendor mismatch for purchase." }, { status: 400 });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const nowIso = new Date().toISOString();

    const { data: completedPurchase, error: updateError } = await supabase
      .from("credit_purchases")
      .update({
        status: "completed",
        completed_at: nowIso,
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", purchase.id)
      .neq("status", "completed")
      .select("id")
      .maybeSingle();

    if (updateError) {
      serverWarn("STRIPE", "Webhook: failed to mark purchase completed", { message: updateError.message });
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    }

    if (!completedPurchase) {
      return NextResponse.json({ received: true });
    }

    const { data: profileRow, error: profileReadError } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", vendorId)
      .maybeSingle();

    if (profileReadError) {
      serverWarn("STRIPE", "Webhook: profile read failed after purchase completion", {
        message: profileReadError.message,
      });
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    }

    if (!profileRow) {
      serverWarn("STRIPE", "Webhook: vendor profile missing during credit grant");
      return NextResponse.json({ error: "Vendor profile not found." }, { status: 500 });
    }

    const currentCredits = Number(profileRow.credits_balance ?? 0);
    if (!Number.isFinite(currentCredits)) {
      serverWarn("STRIPE", "Webhook: invalid credits_balance on profile");
      return NextResponse.json({ error: "Invalid wallet state." }, { status: 500 });
    }

    const { error: creditsUpdateError } = await supabase
      .from("profiles")
      .update({ credits_balance: currentCredits + credits })
      .eq("id", vendorId);

    if (creditsUpdateError) {
      serverWarn("STRIPE", "Webhook: credits_balance update failed", { message: creditsUpdateError.message });
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    }

    const { error: transactionError } = await supabase.from("credit_transactions").insert({
      vendor_id: vendorId,
      amount: credits,
      type: "purchase",
      description: `Purchased ${packageName}`,
    });

    if (transactionError) {
      serverError("Stripe webhook: credit_transactions insert failed after balance update", {
        message: transactionError.message,
      });
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    serverError("Stripe webhook: unhandled exception", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
