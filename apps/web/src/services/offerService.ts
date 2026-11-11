import offersSeed from '@/data/customerOffers.json';
import type { CustomerOffer, OfferStatus } from '@/lib/banking-types';

const OFFER_OVERRIDE_KEY = 'northshield:offer:overrides';
const seedOffers = offersSeed as unknown as CustomerOffer[];

type OfferOverride = { status: OfferStatus; respondedAt: string };

function loadOverrides(): Record<number, OfferOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(OFFER_OVERRIDE_KEY);
    return raw ? (JSON.parse(raw) as Record<number, OfferOverride>) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<number, OfferOverride>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OFFER_OVERRIDE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore storage failures */
  }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** All offers for a customer: read-only seed records merged with locally saved responses. */
export async function getOffersByClientId(clientId: number): Promise<CustomerOffer[]> {
  if (!Number.isInteger(clientId)) return [];
  const overrides = loadOverrides();
  return seedOffers
    .filter(offer => offer.clientId === clientId)
    .map(offer => {
      const override = overrides[offer.id];
      if (override) return { ...offer, status: override.status, respondedAt: override.respondedAt };
      const expired = offer.expiry < todayISO();
      return expired ? { ...offer, status: 'EXPIRED' as OfferStatus } : { ...offer };
    })
    .sort((a, b) => a.expiry.localeCompare(b.expiry));
}

/**
 * Accepts or declines a pending offer. Validates ownership and that the offer
 * has not already been responded to. Persisted to localStorage keyed by offer id.
 * Prepared for a future REST API: replace the localStorage write with a
 * `POST /api/offers/{offerId}/respond` call.
 */
export async function respondToOffer(clientId: number, offerId: number, status: OfferStatus): Promise<CustomerOffer> {
  const base = seedOffers.find(offer => offer.id === offerId && offer.clientId === clientId);
  if (!base) throw new Error('Offer not found for this customer.');
  if (base.status !== 'PENDING') throw new Error('This offer is no longer available.');
  if (status !== 'ACCEPTED' && status !== 'DECLINED') throw new Error('Select a valid response.');

  const overrides = loadOverrides();
  if (overrides[offerId]) throw new Error('This offer has already been responded to.');
  overrides[offerId] = { status, respondedAt: todayISO() };
  saveOverrides(overrides);
  return { ...base, status, respondedAt: overrides[offerId].respondedAt };
}
