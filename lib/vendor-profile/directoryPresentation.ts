/** Shared formatting for vendor directory / category hub cards. */

export function bioExcerpt(value: string | null): string {
  const input = (value || "").trim();
  if (!input) {
    return "Profile story coming soon — open their page or request a quote to connect.";
  }
  if (input.length <= 140) {
    return input;
  }
  return `${input.slice(0, 137).trimEnd()}...`;
}

export function parseServiceAreas(serviceAreas: string | null): string[] {
  return (serviceAreas || "")
    .split(",")
    .map((area) => area.trim())
    .filter(Boolean);
}

export function toTitleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => (word ? `${word[0]?.toUpperCase() ?? ""}${word.slice(1).toLowerCase()}` : word))
    .join(" ");
}
