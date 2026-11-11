import type { ResolvedAccount } from '@/lib/banking-types';

export type TransferInput = {
  from: ResolvedAccount;
  to: ResolvedAccount;
  amount: number;
  description?: string;
};

export type TransferResult = {
  fromBalance: number;
  toBalance: number;
  fromCurrency: string;
  toCurrency: string;
};

/**
 * Temporary in-memory transfer simulation. No balances, accounts.json,
 * transactions.json or global state are modified. The real transaction
 * processing will be implemented later with Spring Boot and a database.
 */
export function validateTransfer(input: TransferInput): string | null {
  const { from, to, amount } = input;
  if (!from || !to) return 'Select both a source and destination account.';
  if (from.id === to.id) return 'The source and destination accounts must be different.';
  if (from.currency !== to.currency) return 'Transfers are currently supported only between accounts using the same currency.';
  if (!Number.isFinite(amount) || amount <= 0) return 'Enter a positive transfer amount.';
  if (amount > from.balance) return 'The amount cannot exceed the source account available balance.';
  return null;
}

export function applyTransfer(input: TransferInput): TransferResult {
  const error = validateTransfer(input);
  if (error) throw new Error(error);
  return {
    fromBalance: input.from.balance - input.amount,
    toBalance: input.to.balance + input.amount,
    fromCurrency: input.from.currency,
    toCurrency: input.to.currency,
  };
}
