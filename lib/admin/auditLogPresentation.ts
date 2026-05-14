import type { AdminAuditLogRow } from "@/lib/admin/types";

export type AuditActionBadgeVariant = "default" | "coral" | "blue" | "navy";

export type AuditActionBadge = {
  label: string;
  variant: AuditActionBadgeVariant;
};

const CREDIT_ACTIONS = new Set(["credits_granted", "credits_adjustment_recorded"]);

function str(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return null;
}

function formatBool(v: unknown): string | null {
  if (typeof v !== "boolean") {
    return null;
  }
  return v ? "Yes" : "No";
}

/** Badge for high-signal actions (including derived account suspend/restore). */
export function getAuditActionBadge(row: AdminAuditLogRow): AuditActionBadge | null {
  const { action, metadata: meta } = row;

  if (action === "vendor_approved") {
    return { label: "Vendor approved", variant: "blue" };
  }
  if (action === "vendor_rejected") {
    return { label: "Vendor rejected", variant: "coral" };
  }
  if (action === "credits_granted") {
    return { label: "Credits granted", variant: "blue" };
  }
  if (action === "credits_adjustment_recorded") {
    return { label: "Credit adjustment", variant: "navy" };
  }

  const newStatus = str(meta, "new_status");
  const statusAction = str(meta, "status_action");

  const isAccountChange =
    action === "vendor_account_status_changed" ||
    action === "customer_account_status_changed" ||
    action === "admin_user_status_changed";

  if (isAccountChange) {
    if (newStatus === "suspended" || statusAction === "suspend") {
      return { label: "User suspended", variant: "coral" };
    }
    if (newStatus === "active" || statusAction === "restore") {
      return { label: "User activated", variant: "blue" };
    }
    if (newStatus === "deactivated" || statusAction === "deactivate") {
      return { label: "Account deactivated", variant: "navy" };
    }
  }

  return null;
}

export function isCreditAuditAction(action: string): boolean {
  return CREDIT_ACTIONS.has(action);
}

/** Human-readable lines derived from metadata (no raw JSON). */
export function humanizeAuditMetadata(row: AdminAuditLogRow): string[] {
  const { action, metadata: meta } = row;
  const lines: string[] = [];

  const push = (line: string) => {
    if (line.trim()) {
      lines.push(line);
    }
  };

  if (
    action === "vendor_approved" ||
    action === "vendor_rejected" ||
    action === "vendor_marketplace_updated"
  ) {
    const prev = str(meta, "previous_status");
    const next = str(meta, "new_status");
    if (prev || next) {
      push(`Listing: ${prev ?? "—"} → ${next ?? "—"}`);
    } else {
      const pub = formatBool(meta["is_public"]);
      const prevPub = formatBool(meta["previous_is_public"]);
      if (prevPub && pub) {
        push(`Public listing: ${prevPub} → ${pub}`);
      } else if (pub) {
        push(`Public listing: ${pub}`);
      }
    }
    const feat = formatBool(meta["is_featured"]);
    if (feat) {
      push(`Featured on marketplace: ${feat}`);
    }
  }

  if (action === "credits_granted" || action === "credits_adjustment_recorded") {
    const amt = str(meta, "credits_added") ?? str(meta, "credits_amount");
    const adj = str(meta, "adjustment_type");
    if (amt) {
      push(`Credits: ${amt}`);
    }
    if (adj) {
      push(`Type: ${adj.replaceAll("_", " ")}`);
    }
    const reason = str(meta, "reason");
    if (reason) {
      push(`Reason: ${reason}`);
    }
  }

  if (
    action === "vendor_account_status_changed" ||
    action === "customer_account_status_changed" ||
    action === "admin_user_status_changed"
  ) {
    const prev = str(meta, "previous_status");
    const next = str(meta, "new_status");
    const sa = str(meta, "status_action");
    if (prev || next) {
      push(`Account status: ${prev ?? "—"} → ${next ?? "—"}`);
    } else if (sa) {
      push(`Admin action: ${sa}`);
    }
    const role = str(meta, "target_role");
    if (role) {
      push(`Role: ${role}`);
    }
    const reason = str(meta, "reason");
    if (reason) {
      push(`Reason: ${reason}`);
    }
  }

  if (action === "event_created") {
    const title = str(meta, "title");
    const hood = str(meta, "neighborhood");
    const st = str(meta, "status");
    if (title) {
      push(`Event: ${title}`);
    }
    if (hood) {
      push(`Area: ${hood}`);
    }
    if (st) {
      push(`Status: ${st}`);
    }
  }

  if (action === "quote_accepted" || action === "quote_declined") {
    const es = str(meta, "event_service_id");
    if (es) {
      push(`Event service: ${es}`);
    }
  }

  if (action === "vendor_profile_completed") {
    const biz = str(meta, "business_name");
    const slug = str(meta, "slug");
    if (biz) {
      push(`Business: ${biz}`);
    }
    if (slug) {
      push(`Slug: ${slug}`);
    }
  }

  if (action === "review_submitted") {
    const rating = str(meta, "rating");
    const pub = formatBool(meta["is_public"]);
    if (rating) {
      push(`Rating: ${rating} / 5`);
    }
    if (pub) {
      push(`Public review: ${pub}`);
    }
  }

  if (action === "message_thread_created") {
    const ev = str(meta, "event_id");
    const q = str(meta, "quote_id");
    if (ev) {
      push(`Event: ${ev}`);
    }
    if (q) {
      push(`Quote: ${q}`);
    }
  }

  // Fallback: single-line summary for unknown shapes with a few scalar keys
  if (lines.length === 0 && meta && typeof meta === "object") {
    const keys = Object.keys(meta).filter((k) => !k.startsWith("_"));
    const parts: string[] = [];
    for (const k of keys.slice(0, 6)) {
      const v = meta[k];
      if (v === null || v === undefined) {
        continue;
      }
      if (typeof v === "object") {
        continue;
      }
      parts.push(`${k.replaceAll("_", " ")}: ${String(v)}`);
    }
    if (parts.length) {
      push(parts.join(" · "));
    }
  }

  return lines;
}

export function prettyJsonForAudit(meta: Record<string, unknown>): string {
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return "{}";
  }
}

export function titleCaseAction(action: string): string {
  return action.replaceAll("_", " ");
}
