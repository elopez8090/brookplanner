import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/lib/auth/types";
import { normalizeProfileStatus } from "@/lib/auth/accountStatus";
import { parseRoleFromRow } from "@/lib/auth/parseRole";

/**
 * Email lives on `auth.users`, not `public.profiles`.
 * Profile reads must never assume a `profiles.email` column exists.
 */
type ProfileRow = {
  id: string;
  full_name: string;
  role: unknown;
  credits_balance?: number | string | null;
  created_at?: string | null;
  status?: string | null;
  suspended_at?: string | null;
  suspended_reason?: string | null;
};

function parseRoleFromMetadata(raw: unknown): "customer" | "vendor" | null {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (s === "customer" || s === "vendor") return s;
  return null;
}

function profileFromRow(row: ProfileRow): Profile {
  const fullName =
    typeof row.full_name === "string" && row.full_name.trim().length > 0 ? row.full_name.trim() : "User";
  const createdAt =
    typeof row.created_at === "string" && row.created_at.trim().length > 0
      ? row.created_at.trim()
      : new Date(0).toISOString();
  return {
    id: row.id,
    full_name: fullName,
    role: parseRoleFromRow(row.role),
    credits_balance: Number(row.credits_balance ?? 0),
    created_at: createdAt,
    status: normalizeProfileStatus(typeof row.status === "string" ? row.status : null),
    suspended_at: row.suspended_at ?? null,
    suspended_reason: row.suspended_reason ?? null,
  };
}

function devWarn(message: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[AUTH] ${message}`, details);
  }
}

async function fetchProfileCoreRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ row: ProfileRow | null; hardError: boolean }> {
  const baseSelects = ["id, full_name, role, created_at", "id, full_name, role"] as const;

  for (const sel of baseSelects) {
    const { data, error } = await supabase.from("profiles").select(sel).eq("id", userId).maybeSingle();

    if (error) {
      devWarn("profiles core lookup", {
        userId,
        select: sel,
        message: error.message,
        code: error.code,
      });
      continue;
    }

    if (!data || typeof data !== "object") {
      return { row: null, hardError: false };
    }

    return { row: data as unknown as ProfileRow, hardError: false };
  }

  return { row: null, hardError: true };
}

async function mergeOptionalWalletAndStatus(
  supabase: SupabaseClient,
  userId: string,
  row: ProfileRow,
): Promise<ProfileRow> {
  const merged: ProfileRow = { ...row };

  const [walletRes, statusRes] = await Promise.all([
    supabase.from("profiles").select("credits_balance").eq("id", userId).maybeSingle(),
    supabase
      .from("profiles")
      .select("status, suspended_at, suspended_reason")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (walletRes.error) {
    devWarn("profiles credits_balance lookup", {
      userId,
      message: walletRes.error.message,
      code: walletRes.error.code,
    });
  } else if (walletRes.data && typeof walletRes.data === "object" && "credits_balance" in walletRes.data) {
    merged.credits_balance = (walletRes.data as { credits_balance?: unknown }).credits_balance as
      | number
      | string
      | null;
  }

  if (statusRes.error) {
    devWarn("profiles status lookup", {
      userId,
      message: statusRes.error.message,
      code: statusRes.error.code,
    });
  } else if (statusRes.data && typeof statusRes.data === "object") {
    const s = statusRes.data as {
      status?: unknown;
      suspended_at?: unknown;
      suspended_reason?: unknown;
    };
    if (typeof s.status === "string" || s.status === null) {
      merged.status = s.status as string | null;
    }
    if (typeof s.suspended_at === "string" || s.suspended_at === null) {
      merged.suspended_at = s.suspended_at as string | null;
    }
    if (typeof s.suspended_reason === "string" || s.suspended_reason === null) {
      merged.suspended_reason = s.suspended_reason as string | null;
    }
  }

  return merged;
}

export async function fetchProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { row: core, hardError } = await fetchProfileCoreRow(supabase, userId);

  if (!core) {
    if (hardError) {
      devWarn("profiles lookup exhausted fallbacks", { userId });
    }
    return null;
  }

  const merged = await mergeOptionalWalletAndStatus(supabase, userId, core);
  return profileFromRow(merged);
}

export async function fetchOrEnsureProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<Profile | null> {
  const existing = await fetchProfileByUserId(supabase, user.id);
  if (existing) {
    return existing;
  }
  const { profile } = await ensureProfileFromMetadata(supabase, user);
  return profile;
}

export async function fetchOrEnsureProfileWithMeta(
  supabase: SupabaseClient,
  user: User,
): Promise<{ profile: Profile | null; profileCreated: boolean }> {
  const existing = await fetchProfileByUserId(supabase, user.id);
  if (existing) {
    return { profile: existing, profileCreated: false };
  }
  const { profile, inserted } = await ensureProfileFromMetadata(supabase, user);
  return { profile, profileCreated: inserted };
}

/**
 * Ensures a row exists in `profiles` using sign-up metadata when the user has no profile yet
 * (e.g. email confirmation was required and insert could not run on the client).
 */
export async function ensureProfileFromMetadata(
  supabase: SupabaseClient,
  user: User,
): Promise<{ profile: Profile | null; inserted: boolean }> {
  const retryExisting = await fetchProfileByUserId(supabase, user.id);
  if (retryExisting) {
    return { profile: retryExisting, inserted: false };
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const full_name =
    typeof meta?.full_name === "string" && meta.full_name.trim().length > 0
      ? meta.full_name.trim()
      : "User";
  const metaRole = parseRoleFromMetadata(meta?.role);
  const role: UserRole = metaRole ?? "customer";

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    full_name,
    role,
  });

  if (
    process.env.NODE_ENV === "development" &&
    insertError &&
    insertError.code !== "23505"
  ) {
    console.warn("[AUTH] ensureProfileFromMetadata insert failed (development)", {
      message: insertError.message,
      code: insertError.code,
    });
  }

  const inserted = !insertError;
  const profile = await fetchProfileByUserId(supabase, user.id);
  return { profile, inserted };
}
