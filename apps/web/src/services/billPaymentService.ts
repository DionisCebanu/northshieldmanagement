import companiesSeed from '@/data/billPaymentCompanies.json';
import { readStore, writeStore, nextId, todayISO, generateConfirmationReference } from '@/lib/mock-storage';
import { getAccountsByClientId } from '@/services/accountService';
import type { BillPaymentCompany, Payee, ResolvedPayee, BillPayment, ResolvedBillPayment, ResolvedAccount } from '@/lib/banking-types';

const PAYEE_STORE_KEY = 'northshield:billpay:payees';
const PAYMENT_STORE_KEY = 'northshield:billpay:payments';
const companies = companiesSeed as unknown as BillPaymentCompany[];

export function getBillPaymentCompanies(): BillPaymentCompany[] {
  return companies.filter(company => company.status === 'ACTIVE');
}

/** Case-insensitive, accent-insensitive search by company name. */
export function searchBillPaymentCompanies(query: string): BillPaymentCompany[] {
  const normalized = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!normalized) return [];
  return getBillPaymentCompanies().filter(company => {
    const name = company.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return name.includes(normalized);
  });
}

export function getBillPaymentCompanyById(billerId: number): BillPaymentCompany | null {
  return companies.find(company => company.id === billerId) ?? null;
}

function allPayees(): Payee[] {
  return readStore<Payee>(PAYEE_STORE_KEY);
}

export async function getPayeesByClientId(clientId: number): Promise<ResolvedPayee[]> {
  return allPayees()
    .filter(payee => payee.clientId === clientId)
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded) || b.id - a.id)
    .map(payee => {
      const biller = getBillPaymentCompanyById(payee.billerId);
      if (!biller) throw new Error('A saved payee references an unknown biller.');
      return { ...payee, biller };
    });
}

export function validateBillAccountNumber(billerId: number, accountNumber: string): string | null {
  const biller = getBillPaymentCompanyById(billerId);
  if (!biller) return 'Select a biller.';
  const trimmed = accountNumber.trim();
  if (!trimmed) return 'Enter the customer bill account number.';
  try {
    if (!new RegExp(biller.accountNumberPattern).test(trimmed)) {
      return `Enter a valid account number (${biller.accountNumberFormat.toLowerCase()}).`;
    }
  } catch {
    /* if the pattern is invalid, accept non-empty */
  }
  return null;
}

export type AddPayeeInput = {
  clientId: number;
  billerId: number;
  billAccountNumber: string;
  nickname: string | null;
};

export async function addPayee(input: AddPayeeInput): Promise<ResolvedPayee> {
  const biller = getBillPaymentCompanyById(input.billerId);
  if (!biller) throw new Error('Select a biller.');
  const error = validateBillAccountNumber(input.billerId, input.billAccountNumber);
  if (error) throw new Error(error);
  const stored = allPayees();
  const id = nextId([], stored);
  const payee: Payee = {
    id,
    clientId: input.clientId,
    billerId: input.billerId,
    billAccountNumber: input.billAccountNumber.trim(),
    nickname: input.nickname?.trim() || null,
    dateAdded: todayISO(),
  };
  stored.push(payee);
  writeStore(PAYEE_STORE_KEY, stored);
  return { ...payee, biller };
}

export async function updatePayeeNickname(payeeId: number, nickname: string | null): Promise<void> {
  const stored = allPayees();
  const payee = stored.find(item => item.id === payeeId);
  if (!payee) throw new Error('Payee not found.');
  payee.nickname = nickname?.trim() || null;
  writeStore(PAYEE_STORE_KEY, stored);
}

export async function deletePayee(payeeId: number): Promise<void> {
  const stored = allPayees().filter(item => item.id !== payeeId);
  writeStore(PAYEE_STORE_KEY, stored);
}

function allPayments(): BillPayment[] {
  return readStore<BillPayment>(PAYMENT_STORE_KEY);
}

export async function getPaymentsByClientId(clientId: number): Promise<ResolvedBillPayment[]> {
  const accounts = await getAccountsByClientId(clientId);
  const accountMap = new Map(accounts.map(account => [account.id, account]));
  const payees = await getPayeesByClientId(clientId);
  const payeeMap = new Map(payees.map(payee => [payee.id, payee]));
  return allPayments()
    .filter(payment => payment.clientId === clientId)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || b.id - a.id)
    .map(payment => ({
      ...payment,
      biller: getBillPaymentCompanyById(payment.billerId),
      payee: payeeMap.get(payment.payeeId) ?? null,
      sourceAccount: accountMap.get(payment.sourceAccountId) ?? null,
    }))
    .filter((payment): payment is ResolvedBillPayment => Boolean(payment.biller));
}

export async function getScheduledPaymentsByClientId(clientId: number): Promise<ResolvedBillPayment[]> {
  return (await getPaymentsByClientId(clientId)).filter(payment => payment.status === 'SCHEDULED');
}

export type MakePaymentInput = {
  clientId: number;
  payeeId: number;
  sourceAccountId: number;
  amount: number;
  currency: string;
  paymentDate: string;
  description: string | null;
  scheduled: boolean;
};

/**
 * Records a bill payment. Immediate payments are POSTED; future-dated payments
 * are SCHEDULED. Account balances are not modified — permanent posting will be
 * handled by the future backend. Prepared for a future REST API: replace the
 * localStorage write with a `POST /api/bill-payments` call.
 */
export async function makePayment(input: MakePaymentInput): Promise<ResolvedBillPayment> {
  const payees = await getPayeesByClientId(input.clientId);
  const payee = payees.find(item => item.id === input.payeeId);
  if (!payee) throw new Error('This payee does not belong to the selected customer.');
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Enter a positive payment amount.');
  if (!input.paymentDate) throw new Error('Select a payment date.');

  const stored = allPayments();
  const id = nextId([], stored);
  const isScheduled = input.scheduled || input.paymentDate > todayISO();
  const payment: BillPayment = {
    id,
    clientId: input.clientId,
    payeeId: input.payeeId,
    billerId: payee.billerId,
    sourceAccountId: input.sourceAccountId,
    amount: input.amount,
    currency: input.currency,
    paymentDate: input.paymentDate,
    description: input.description,
    status: isScheduled ? 'SCHEDULED' : 'POSTED',
    confirmationReference: generateConfirmationReference(),
    scheduledDate: isScheduled ? input.paymentDate : null,
  };
  stored.push(payment);
  writeStore(PAYMENT_STORE_KEY, stored);

  const accounts = await getAccountsByClientId(input.clientId);
  const sourceAccount = accounts.find(account => account.id === input.sourceAccountId) ?? null;
  return { ...payment, biller: payee.biller, payee, sourceAccount };
}

export async function cancelScheduledPayment(paymentId: number): Promise<void> {
  const stored = allPayments();
  const payment = stored.find(item => item.id === paymentId);
  if (!payment) throw new Error('Scheduled payment not found.');
  if (payment.status !== 'SCHEDULED') throw new Error('Only scheduled payments can be cancelled.');
  payment.status = 'CANCELLED';
  writeStore(PAYMENT_STORE_KEY, stored);
}
