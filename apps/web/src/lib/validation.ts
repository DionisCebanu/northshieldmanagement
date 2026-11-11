// Hydration-safe validation helpers for customer profile editing.

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidCanadianPostalCode(value: string): boolean {
  return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(value.trim());
}

export function isValidPhoneNumber(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true; // optional field
  return /^(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(value.trim());
}

export function isPastOrTodayDate(value: string): boolean {
  if (!value) return false;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return d.getTime() <= today.getTime();
}

/** Empty optional string fields become null to match the data model. */
export function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
