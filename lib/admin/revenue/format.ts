export const CREDIT_FACE_USD = 5;
export const CREDIT_FACE_CENTS = 500;

export function formatUsdCents(cents: number): string {
  if (!Number.isFinite(cents)) {
    return "—";
  }
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function formatCredits(n: number): string {
  if (!Number.isFinite(n)) {
    return "—";
  }
  return n.toLocaleString();
}

export function formatInt(n: number): string {
  if (!Number.isFinite(n)) {
    return "—";
  }
  return n.toLocaleString();
}

export function monthLabelUtc(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return isoDate;
  }
  return d.toLocaleString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
}
