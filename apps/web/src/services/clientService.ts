import clients from '@/data/clients.json';
import { getAccountsByClientId } from '@/services/accountService';
import { getTransactionsByClientId } from '@/services/transactionService';
import { getCardsByClientId } from '@/services/cardService';
import { getDisputesByClientId } from '@/services/disputeService';
import { getOffersByClientId } from '@/services/offerService';
import { getNotesByClientId } from '@/services/noteService';
import type { Client, ClientWorkspace } from '@/lib/banking-types';

const CLIENT_STORAGE_PREFIX = 'northshield:client:';

function loadClientOverrides(clientId: number): Partial<Client> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${CLIENT_STORAGE_PREFIX}${clientId}`);
    return raw ? (JSON.parse(raw) as Partial<Client>) : null;
  } catch {
    return null;
  }
}

export async function getClientById(clientId: number): Promise<Client | null> {
  if (!Number.isInteger(clientId)) return null;
  const base = clients.find(client => client.id === clientId);
  if (!base) return null;
  const overrides = loadClientOverrides(clientId);
  return overrides ? { ...base, ...overrides } : { ...base };
}

export async function getClientWorkspace(clientId: number): Promise<ClientWorkspace | null> {
  const client = await getClientById(clientId);
  if (!client) return null;
  const [accounts, transactions, cards, disputes, offers, notes] = await Promise.all([
    getAccountsByClientId(clientId),
    getTransactionsByClientId(clientId),
    getCardsByClientId(clientId),
    getDisputesByClientId(clientId),
    getOffersByClientId(clientId),
    getNotesByClientId(clientId),
  ]);
  return { client, accounts, transactions, cards, disputes, offers, notes };
}

/**
 * Persists editable customer profile changes to localStorage keyed by the
 * numeric clientId, merging them over the original clients.json record.
 * `id` and `status` are always preserved from the base record.
 *
 * Prepared for a future REST API: replace the localStorage write with a
 * `PUT /api/clients/{clientId}` call and return the server response.
 */
export async function updateClientProfile(clientId: number, updates: Partial<Client>): Promise<Client> {
  const base = clients.find(client => client.id === clientId);
  if (!base) throw new Error('Customer not found.');
  const merged: Client = {
    ...base,
    ...updates,
    id: base.id,
    status: base.status,
    address: { ...base.address, ...(updates.address ?? {}) },
    contact: { ...base.contact, ...(updates.contact ?? {}) },
    employment: { ...base.employment, ...(updates.employment ?? {}) },
    student: { ...base.student, ...(updates.student ?? {}) },
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(`${CLIENT_STORAGE_PREFIX}${clientId}`, JSON.stringify(merged));
    } catch {
      /* ignore storage failures */
    }
  }
  return merged;
}
