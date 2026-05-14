import { serverWarn } from "@/lib/logging/serverLog";
import type {
  AdminCreditActivityBreakdown,
  AdminMonthlyRevenueRow,
  AdminRevenueOverview,
  AdminTopSpendingVendorRow,
} from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";

function toInt(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchAdminRevenueOverview(): Promise<AdminRevenueOverview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_revenue_overview");

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      serverWarn("RPC", "fetchAdminRevenueOverview failed", { message: error.message });
    }
    return null;
  }

  const row = data[0] as Record<string, number | string | null>;
  return {
    totalRevenueCents: toInt(row.total_revenue_cents),
    totalCreditPurchases: toInt(row.total_credit_purchases),
    totalCreditsSold: toInt(row.total_credits_sold),
    totalPromotionalCredits: toInt(row.total_promotional_credits),
    totalCreditsSpent: toInt(row.total_credits_spent),
    totalCreditsRemaining: toInt(row.total_credits_remaining),
    estimatedCreditLiabilityCents: toInt(row.estimated_credit_liability_cents),
    activePayingVendors: toInt(row.active_paying_vendors),
    averagePurchaseValueCents: toInt(row.average_purchase_value_cents),
  };
}

export async function fetchAdminMonthlyRevenue(): Promise<AdminMonthlyRevenueRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_monthly_revenue");

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminMonthlyRevenue failed", { message: error.message });
    }
    return [];
  }

  return (data as Record<string, string | number | null>[]).map((row) => ({
    month: typeof row.month === "string" ? row.month : String(row.month ?? ""),
    revenueCents: toInt(row.revenue_cents),
    purchasesCount: toInt(row.purchases_count),
    creditsSold: toInt(row.credits_sold),
  }));
}

export async function fetchAdminTopSpendingVendors(limit = 20): Promise<AdminTopSpendingVendorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_top_spending_vendors", { p_limit: limit });

  if (error || !Array.isArray(data)) {
    if (error) {
      serverWarn("RPC", "fetchAdminTopSpendingVendors failed", { message: error.message });
    }
    return [];
  }

  return (data as Record<string, unknown>[]).map((row) => ({
    vendorId: String(row.vendor_id ?? ""),
    vendorName: typeof row.vendor_name === "string" ? row.vendor_name : "",
    vendorEmail: typeof row.vendor_email === "string" ? row.vendor_email : "",
    totalSpentCents: toInt(row.total_spent_cents as number | string | null),
    creditsPurchased: toInt(row.credits_purchased as number | string | null),
    promotionalCreditsGranted: toInt(row.promotional_credits_granted as number | string | null),
    creditsSpent: toInt(row.credits_spent as number | string | null),
    creditsRemaining: toInt(row.credits_remaining as number | string | null),
    purchaseCount: toInt(row.purchase_count as number | string | null),
  }));
}

export async function fetchAdminCreditActivityBreakdown(): Promise<AdminCreditActivityBreakdown | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_get_credit_activity_breakdown");

  if (error || !Array.isArray(data) || !data.length) {
    if (error) {
      serverWarn("RPC", "fetchAdminCreditActivityBreakdown failed", { message: error.message });
    }
    return null;
  }

  const row = data[0] as Record<string, number | string | null>;
  return {
    purchasedCredits: toInt(row.purchased_credits),
    promotionalCredits: toInt(row.promotional_credits),
    spentCredits: toInt(row.spent_credits),
    remainingCredits: toInt(row.remaining_credits),
    liabilityCents: toInt(row.liability_cents),
  };
}
