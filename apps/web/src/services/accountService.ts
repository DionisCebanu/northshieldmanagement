import accountsSeed from '@/data/accounts.json';
import accountTypes from '@/data/accountTypes.json';
import branches from '@/data/branches.json';
import { readStore, writeStore, nextId, generateAccountNumber, todayISO } from '@/lib/mock-storage';
import type { Account, AccountType, ResolvedAccount } from '@/lib/banking-types';

const ACCOUNT_STORE_KEY = 'northshield:account:opened';
const accounts = accountsSeed as unknown as Account[];

function loadOpenedAccounts(): Account[] {
  return readStore<Account>(ACCOUNT_STORE_KEY);
}

/** All accounts: read-only seed records merged with locally opened accounts. */
function allAccounts(): Account[] {
  return [...accounts, ...loadOpenedAccounts()];
}

export async function getAccountTypeById(accountTypeId: number): Promise<AccountType | null> {
  return accountTypes.find(product => product.id === accountTypeId) ?? null;
}

async function resolveAccount(account: Account): Promise<ResolvedAccount> {
  const product = await getAccountTypeById(account.accountTypeId);
  const branch = branches.find(item => item.id === account.branchId);
  if (!product || !branch) throw new Error('An account has missing product or branch information.');
  return { ...account, product, branch };
}

export async function getAccountsByClientId(clientId: number): Promise<ResolvedAccount[]> {
  return Promise.all(allAccounts().filter(account => account.clientId === clientId).map(resolveAccount));
}

export async function getAccountById(accountId: number): Promise<ResolvedAccount | null> {
  const account = allAccounts().find(item => item.id === accountId);
  return account ? resolveAccount(account) : null;
}

export type OpenAccountInput = {
  clientId: number;
  accountTypeId: number;
  currency: string;
  branchId: string;
  initialDeposit?: number;
  creditLimit?: number | null;
  annualInterestRate?: number | null;
  repaymentTermMonths?: number | null;
  registrationType?: string | null;
  beneficiary?: string | null;
  principal?: number | null;
  term?: string | null;
  maturityDate?: string | null;
};

/**
 * Opens a new banking account, persisting it to localStorage keyed separately
 * from the read-only seed data. Returns the resolved account.
 * Prepared for a future REST API: replace the localStorage write with a
 * `POST /api/accounts` call.
 */
export async function openAccount(input: OpenAccountInput): Promise<ResolvedAccount> {
  const product = await getAccountTypeById(input.accountTypeId);
  if (!product) throw new Error('Selected account product was not found.');
  const branch = branches.find(item => item.id === input.branchId);
  if (!branch) throw new Error('Selected branch was not found.');

  const opened = loadOpenedAccounts();
  const id = nextId(accounts, opened);
  const isLending = product.category === 'PERSONAL_LOAN' || product.category === 'LINE_OF_CREDIT';
  const account: Account = {
    id,
    clientId: input.clientId,
    accountTypeId: input.accountTypeId,
    accountNumber: generateAccountNumber(),
    transitNumber: branch.transitNumber,
    institutionNumber: '999',
    branchId: input.branchId,
    currency: input.currency,
    balance: isLending ? 0 : (input.initialDeposit ?? 0),
    status: 'ACTIVE',
    dateOpened: todayISO(),
    dateClosed: null,
    creditLimit: input.creditLimit ?? null,
    outstandingBalance: isLending ? (input.initialDeposit ?? 0) : null,
    annualInterestRate: input.annualInterestRate ?? null,
    repaymentTermMonths: input.repaymentTermMonths ?? null,
    registrationType: input.registrationType ?? null,
    beneficiary: input.beneficiary ?? null,
    principal: input.principal ?? null,
    term: input.term ?? null,
    maturityDate: input.maturityDate ?? null,
  };
  opened.push(account);
  writeStore(ACCOUNT_STORE_KEY, opened);
  return resolveAccount(account);
}
