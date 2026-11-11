import transactions from '@/data/transactions.json';
import { getAccountsByClientId } from '@/services/accountService';
import type { Transaction } from '@/lib/banking-types';

function newestFirst(items: Transaction[]): Transaction[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}
export async function getTransactionsByAccountId(accountId: number): Promise<Transaction[]> {
  return newestFirst(transactions.filter(transaction => transaction.accountId === accountId));
}
export async function getTransactionsByClientId(clientId: number): Promise<Transaction[]> {
  const accounts = await getAccountsByClientId(clientId);
  const ids = new Set(accounts.map(account => account.id));
  return newestFirst(transactions.filter(transaction => ids.has(transaction.accountId)));
}
