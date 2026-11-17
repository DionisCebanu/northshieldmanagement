import clients from '@/data/clients.json';
import accountsSeed from '@/data/accounts.json';
import cardsSeed from '@/data/customerCards.json';
import { getClientById } from '@/services/clientService';
import { readStore } from '@/lib/mock-storage';
import type { Account, Client, CustomerCard } from '@/lib/banking-types';

export type CustomerSearchField = 'name' | 'dateOfBirth' | 'clientId' | 'accountNumber' | 'debitCard' | 'creditCard';
export type CustomerSearchResult = Pick<Client, 'id' | 'firstName' | 'lastName' | 'dateOfBirth' | 'status'>;

const accounts = accountsSeed as Account[];
const cards = cardsSeed as unknown as CustomerCard[];
const normalizedDigits = (value: string) => value.replace(/[\s-]/g, '');

/** Demo-only search. Real card-number searches must be performed by a secure backend. */
export async function searchCustomers(field: CustomerSearchField, rawValue: string): Promise<CustomerSearchResult[]> {
  const query = rawValue.trim();
  if (!query) throw new Error('Enter a search value.');
  const normalized = normalizedDigits(query);
  if (field === 'clientId' && !/^\d+$/.test(query)) throw new Error('Client ID must contain digits only.');
  if (field === 'dateOfBirth' && !/^\d{4}-\d{2}-\d{2}$/.test(query)) throw new Error('Use YYYY-MM-DD for date of birth.');
  if (field === 'accountNumber' && !/^\d+$/.test(normalized)) throw new Error('Enter the full numeric account number.');
  if ((field === 'debitCard' || field === 'creditCard') && !/^\d{13,19}$/.test(normalized)) {
    throw new Error('Enter the complete card number (13–19 digits).');
  }
  if (field === 'name' && query.length < 2) throw new Error('Enter at least two characters.');

  const allAccounts = [...accounts, ...readStore<Account>('northshield:account:opened')];
  const allCards = [...cards, ...readStore<CustomerCard>('northshield:card:issued')];
  const matchedIds = new Set<number>();
  if (field === 'accountNumber') {
    allAccounts.filter(account => account.accountNumber === normalized).forEach(account => matchedIds.add(account.clientId));
  } else if (field === 'debitCard' || field === 'creditCard') {
    const cardType = field === 'debitCard' ? 'DEBIT' : 'CREDIT';
    allCards.filter(card => card.cardType === cardType && card.cardNumber === normalized).forEach(card => matchedIds.add(card.clientId));
  } else if (field === 'clientId') {
    matchedIds.add(Number(query));
  }

  const candidates = field === 'name' || field === 'dateOfBirth'
    ? clients
    : clients.filter(client => matchedIds.has(client.id));
  const resolved = await Promise.all(candidates.map(client => getClientById(client.id)));
  const needle = query.toLocaleLowerCase();
  return resolved.filter((client): client is Client => Boolean(client)).filter(client => {
    if (field === 'name') {
      const fullName = `${client.firstName} ${client.lastName}`.toLocaleLowerCase();
      return fullName.includes(needle) || client.firstName.toLocaleLowerCase().includes(needle) || client.lastName.toLocaleLowerCase().includes(needle);
    }
    return field !== 'dateOfBirth' || client.dateOfBirth === query;
  }).map(({ id, firstName, lastName, dateOfBirth, status }) => ({ id, firstName, lastName, dateOfBirth, status }));
}
