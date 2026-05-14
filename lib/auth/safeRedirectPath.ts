/** Allows same-origin relative paths only (blocks protocol-relative and external URLs). */
export function safeInternalPath(next: string | undefined | null): string | null {
  if (next == null || typeof next !== "string") {
    return null;
  }
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//")) {
    return null;
  }
  if (t.includes("\\")) {
    return null;
  }
  return t;
}
