// Centralized localStorage helpers for mock data persistence. All new entities
// (issued cards, opened accounts, lending applications, bill payees and
// payments) are stored here and merged with the read-only JSON seed data.
// Prepared for a future Spring Boot REST API: replace each read/write with a
// fetch call to the corresponding endpoint.

export function readStore<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function writeStore<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* ignore storage failures */
  }
}

/** Next numeric id that avoids collisions with seed records and stored records. */
export function nextId(seed: { id: number }[], stored: { id: number }[]): number {
  const seedMax = seed.reduce((max, item) => Math.max(max, item.id), 0);
  const storedMax = stored.reduce((max, item) => Math.max(max, item.id), 0);
  return Math.max(seedMax, storedMax) + 1;
}

/** Fictional 16-digit card number. Runs in client event handlers only. */
export function generateCardNumber(prefix: '4' | '5'): string {
  const rest = Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
  return `${prefix}${rest}`;
}

/** Fictional 7-digit account number. Runs in client event handlers only. */
export function generateAccountNumber(): string {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
}

/** Fictional payment confirmation reference. */
export function generateConfirmationReference(): string {
  const segment = () => Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
  return `NSB-${segment()}-${segment()}`;
}

/** Expiry date 4 years ahead, formatted YYYY-MM. */
export function generateExpiryDate(): string {
  const now = new Date();
  const year = now.getFullYear() + 4;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
