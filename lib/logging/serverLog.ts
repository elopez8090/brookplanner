/** Production-safe logging for server and API routes. Safe to import from shared modules (no "server-only"). */
export type ServerLogTag = "AUTH" | "STRIPE" | "EMAIL" | "ADMIN" | "RPC";

const SENSITIVE_KEY = /pass|secret|token|authorization|apikey|api_key|cookie|bearer|pwd|credential/i;

function truncateString(value: string): string {
  if (value.length > 120) {
    return `[string len ${value.length}]`;
  }
  return value;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return truncateString(value);
  }
  if (value instanceof Error) {
    return truncateString(value.message);
  }
  return value;
}

/** Redacts obvious secret keys and truncates long strings (e.g. tokens). */
export function sanitizeLogContext(ctx?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!ctx) {
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (SENSITIVE_KEY.test(k)) {
      out[k] = "[redacted]";
      continue;
    }
    out[k] = sanitizeValue(v);
  }
  return out;
}

function emit(level: "log" | "warn" | "error", tag: ServerLogTag | "ERROR", message: string, ctx?: Record<string, unknown>) {
  const line = `[${tag}] ${message}`;
  const safe = sanitizeLogContext(ctx);
  if (level === "error") {
    if (safe && Object.keys(safe).length > 0) {
      console.error(line, safe);
    } else {
      console.error(line);
    }
    return;
  }
  if (level === "warn") {
    if (safe && Object.keys(safe).length > 0) {
      console.warn(line, safe);
    } else {
      console.warn(line);
    }
    return;
  }
  if (safe && Object.keys(safe).length > 0) {
    console.log(line, safe);
  } else {
    console.log(line);
  }
}

export function serverInfo(tag: ServerLogTag, message: string, ctx?: Record<string, unknown>): void {
  emit("log", tag, message, ctx);
}

export function serverWarn(tag: ServerLogTag, message: string, ctx?: Record<string, unknown>): void {
  emit("warn", tag, message, ctx);
}

/** Use for unexpected failures; always tagged `[ERROR]`. */
export function serverError(message: string, ctx?: Record<string, unknown>): void {
  emit("error", "ERROR", message, ctx);
}
