import customerCardsData from '@/data/customerCards.json';
import creditCardProducts from '@/data/creditcards.json';
import debitCardProducts from '@/data/debitcards.json';
import { getAccountById } from '@/services/accountService';
import { readStore, writeStore, nextId, generateCardNumber, generateExpiryDate, todayISO } from '@/lib/mock-storage';
import type { CardStatus, CardType, CustomerCard, DebitCard, CreditCard, ResolvedCard, ResolvedDebitCard, ResolvedCreditCard, ResolvedAccount } from '@/lib/banking-types';

const CARD_STORAGE_PREFIX = 'northshield:card:';
const ISSUED_CARD_STORE_KEY = 'northshield:card:issued';
const seedCards = customerCardsData as unknown as CustomerCard[];

type CardOverride = { status: CardStatus; dateClosed: string | null };

function loadOverride(cardId: number, cardType: CardType): CardOverride | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${CARD_STORAGE_PREFIX}${cardType}:${cardId}`);
    return raw ? (JSON.parse(raw) as CardOverride) : null;
  } catch {
    return null;
  }
}

function saveOverride(cardId: number, cardType: CardType, override: CardOverride): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${CARD_STORAGE_PREFIX}${cardType}:${cardId}`, JSON.stringify(override));
  } catch {
    /* ignore storage failures */
  }
}

function loadIssuedCards(): CustomerCard[] {
  return readStore<CustomerCard>(ISSUED_CARD_STORE_KEY);
}

/** All cards: read-only seed records merged with locally issued cards. */
function allCards(): CustomerCard[] {
  return [...seedCards, ...loadIssuedCards()];
}

// Freeze/Unfreeze are reversible; Lost, Stolen, Fraud and Closed block normal actions.
const TRANSITIONS: Record<CardStatus, CardStatus[]> = {
  ACTIVE: ['FROZEN', 'LOST', 'STOLEN', 'FRAUD', 'CLOSED'],
  FROZEN: ['ACTIVE', 'LOST', 'STOLEN', 'FRAUD', 'CLOSED'],
  LOST: ['CLOSED'],
  STOLEN: ['CLOSED'],
  FRAUD: ['CLOSED'],
  CLOSED: [],
};

async function resolveCard(card: CustomerCard): Promise<ResolvedCard> {
  const override = loadOverride(card.id, card.cardType);
  const merged = override ? { ...card, ...override } : { ...card };
  if (card.cardType === 'DEBIT') {
    const debit = merged as DebitCard;
    const product = debitCardProducts.find(item => item.id === card.productId);
    if (!product) throw new Error('Debit card product not found.');
    const linkedIds = debit.linkedAccountIds?.length ? debit.linkedAccountIds : [debit.linkedAccountId];
    const linkedAccounts: ResolvedAccount[] = [];
    for (const id of linkedIds) {
      const acc = await getAccountById(id);
      if (acc) linkedAccounts.push(acc);
    }
    const primary = linkedAccounts[0] ?? (await getAccountById(debit.linkedAccountId));
    if (!primary) throw new Error('Linked account not found for debit card.');
    return { ...debit, product, linkedAccount: primary, linkedAccounts } as ResolvedDebitCard;
  }
  const product = creditCardProducts.find(item => item.id === card.productId);
  if (!product) throw new Error('Credit card product not found.');
  return { ...(merged as CreditCard), product, annualFee: product.annualFee } as ResolvedCreditCard;
}

export async function getCardsByClientId(clientId: number): Promise<ResolvedCard[]> {
  if (!Number.isInteger(clientId)) return [];
  const cards = allCards().filter(card => card.clientId === clientId);
  return Promise.all(cards.map(resolveCard));
}

/**
 * Changes a card status. Validates the transition, persists the override to
 * localStorage keyed by card id + card type, and returns the new override.
 * Prepared for a future REST API: replace the localStorage write with a
 * `PUT /api/cards/{cardId}/status` call.
 */
export async function setCardStatus(clientId: number, cardId: number, cardType: CardType, newStatus: CardStatus): Promise<CardOverride> {
  const base = allCards().find(card => card.id === cardId && card.cardType === cardType && card.clientId === clientId);
  if (!base) throw new Error('Card not found for this customer.');
  const override = loadOverride(cardId, cardType);
  const currentStatus: CardStatus = override?.status ?? base.status;
  if (!TRANSITIONS[currentStatus]?.includes(newStatus)) {
    throw new Error(`This card cannot be changed to ${newStatus.toLowerCase()} from its current status.`);
  }
  const update: CardOverride = {
    status: newStatus,
    dateClosed: newStatus === 'CLOSED'
      ? new Date().toISOString().slice(0, 10)
      : newStatus === 'ACTIVE' ? null : (override?.dateClosed ?? base.dateClosed),
  };
  saveOverride(cardId, cardType, update);
  return update;
}

export type IssueDebitCardInput = {
  clientId: number;
  productId: number;
  cardholderName: string;
  currency: string;
  linkedAccountIds: number[];
  deliveryMethod: string;
};

export type IssueCreditCardInput = {
  clientId: number;
  productId: number;
  cardholderName: string;
  currency: string;
  creditLimit: number;
  deliveryMethod: string;
};

/**
 * Issues a new debit card linked to one or more eligible accounts. The card is
 * persisted to localStorage and immediately appears on the Cards page. Debit
 * cards carry no annual fee. No CVV, PIN or real payment card data is stored.
 * Prepared for a future REST API: replace the localStorage write with a
 * `POST /api/cards/debit` call.
 */
export async function issueDebitCard(input: IssueDebitCardInput): Promise<ResolvedCard> {
  const product = debitCardProducts.find(item => item.id === input.productId);
  if (!product) throw new Error('Debit card product not found.');
  if (!input.linkedAccountIds.length) throw new Error('Select at least one linked account.');
  const issued = loadIssuedCards();
  const id = nextId(seedCards, issued);
  const card: DebitCard = {
    id,
    clientId: input.clientId,
    productId: input.productId,
    cardType: 'DEBIT',
    cardNumber: generateCardNumber('4'),
    cardholderName: input.cardholderName,
    expiryDate: generateExpiryDate(),
    dateOpened: todayISO(),
    dateClosed: null,
    status: 'ACTIVE',
    deliveryMethod: input.deliveryMethod,
    linkedAccountId: input.linkedAccountIds[0],
    linkedAccountIds: input.linkedAccountIds,
    currency: input.currency,
  };
  issued.push(card);
  writeStore(ISSUED_CARD_STORE_KEY, issued);
  return resolveCard(card);
}

/**
 * Issues a new credit card with an outstanding balance of 0 and available
 * credit equal to the limit. Persisted to localStorage and shown immediately.
 * Prepared for a future REST API: replace the localStorage write with a
 * `POST /api/cards/credit` call.
 */
export async function issueCreditCard(input: IssueCreditCardInput): Promise<ResolvedCard> {
  const product = creditCardProducts.find(item => item.id === input.productId);
  if (!product) throw new Error('Credit card product not found.');
  if (!Number.isFinite(input.creditLimit) || input.creditLimit <= 0) throw new Error('Enter a positive credit limit.');
  const issued = loadIssuedCards();
  const id = nextId(seedCards, issued);
  const card: CreditCard = {
    id,
    clientId: input.clientId,
    productId: input.productId,
    cardType: 'CREDIT',
    cardNumber: generateCardNumber('5'),
    cardholderName: input.cardholderName,
    expiryDate: generateExpiryDate(),
    dateOpened: todayISO(),
    dateClosed: null,
    status: 'ACTIVE',
    deliveryMethod: input.deliveryMethod,
    creditLimit: input.creditLimit,
    outstandingBalance: 0,
    currency: input.currency,
  };
  issued.push(card);
  writeStore(ISSUED_CARD_STORE_KEY, issued);
  return resolveCard(card);
}
