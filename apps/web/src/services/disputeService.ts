import { readStore, writeStore, nextId, todayISO } from '@/lib/mock-storage';
import type { TransactionDispute, DisputeCategory } from '@/lib/banking-types';

const DISPUTE_STORE_KEY = 'northshield:disputes';

/** Transaction types eligible for a customer dispute. */
export const DISPUTE_ELIGIBLE_TYPES = ['PRE_AUTHORIZED_DEBIT', 'ONLINE_PURCHASE', 'ATM_WITHDRAWAL', 'CARD_PURCHASE'] as const;

export const DISPUTE_CATEGORIES: { value: DisputeCategory; label: string }[] = [
  { value: 'UNAUTHORIZED_TRANSACTION', label: 'Unauthorized transaction' },
  { value: 'DUPLICATE_CHARGE', label: 'Duplicate charge' },
  { value: 'INCORRECT_AMOUNT', label: 'Incorrect amount' },
  { value: 'GOODS_NOT_RECEIVED', label: 'Goods not received' },
  { value: 'SERVICE_NOT_PROVIDED', label: 'Service not provided' },
  { value: 'CARD_FRAUD', label: 'Card fraud' },
  { value: 'OTHER', label: 'Other' },
];

function allDisputes(): TransactionDispute[] {
  return readStore<TransactionDispute>(DISPUTE_STORE_KEY);
}

export async function getDisputesByClientId(clientId: number): Promise<TransactionDispute[]> {
  if (!Number.isInteger(clientId)) return [];
  return allDisputes()
    .filter(dispute => dispute.clientId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export function isDisputeEligible(type: string): boolean {
  return (DISPUTE_ELIGIBLE_TYPES as readonly string[]).includes(type);
}

export type CreateDisputeInput = {
  clientId: number;
  transactionIds: number[];
  reason: string;
  category: DisputeCategory;
};

/**
 * Creates a transaction dispute. Validates that at least one eligible
 * transaction is selected, a reason and category are provided, and that none of
 * the selected transactions already belong to an OPEN dispute for this customer.
 * Persisted to localStorage keyed separately from seed data.
 * Prepared for a future REST API: replace the localStorage write with a
 * `POST /api/disputes` call.
 */
export async function createDispute(input: CreateDisputeInput): Promise<TransactionDispute> {
  if (!input.transactionIds.length) throw new Error('Select at least one eligible transaction to dispute.');
  if (!input.reason.trim()) throw new Error('Provide a reason for the dispute.');
  if (!input.category) throw new Error('Select a dispute category.');

  const stored = allDisputes();
  const active = stored.filter(dispute => dispute.clientId === input.clientId && dispute.status === 'OPEN');
  const conflict = input.transactionIds.some(id => active.some(dispute => dispute.transactionIds.includes(id)));
  if (conflict) throw new Error('One or more selected transactions already have an active dispute.');

  const id = nextId([], stored);
  const dispute: TransactionDispute = {
    id,
    clientId: input.clientId,
    transactionIds: [...input.transactionIds],
    reason: input.reason.trim(),
    category: input.category,
    date: todayISO(),
    status: 'OPEN',
  };
  stored.push(dispute);
  writeStore(DISPUTE_STORE_KEY, stored);
  return dispute;
}
