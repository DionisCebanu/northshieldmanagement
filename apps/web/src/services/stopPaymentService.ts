import { demoEmployee } from '@/config/employee-session';
import initialRequests from '@/data/stopPayments.json';

export type StopType = 'cheque' | 'pad' | 'card';

export interface StopPaymentInput {
  type: StopType;
  productId: number;
  productLabel: string;
  payee: string;
  transactionName?: string;
  chequeNumber: string;
  amount: string;
  currency: string;
  paymentDate: string;
  recurring: boolean;
  reason: string;
}

export interface StopPayment extends StopPaymentInput {
  id: string;
  customerId: number;
  status: 'Active' | 'Cancelled';
  createdAt: string;
  employee: string;
  cancelledAt: string | null;
  cancelledBy: string | null;
}

function storageKey(customerId: number): string {
  return `northshield-stop-payments-v1-${customerId}`;
}

export function readStopPayments(customerId: number): StopPayment[] {
  // React Router also renders on the server, where localStorage is unavailable.
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = window.localStorage.getItem(storageKey(customerId));

  if (saved !== null) {
    return JSON.parse(saved) as StopPayment[];
  }

  return (initialRequests as StopPayment[]).filter(
    request => request.customerId === customerId
  );
}

function saveRequests(customerId: number, requests: StopPayment[]): void {
  window.localStorage.setItem(
    storageKey(customerId),
    JSON.stringify(requests)
  );
}

export function createStopPayment(
  customerId: number,
  input: StopPaymentInput
): StopPayment[] {
  if (!input.productId || !input.reason.trim()) {
    throw new Error('Select a product and enter a reason.');
  }

  if (input.type !== 'card') {
    if (!input.payee.trim() || !input.paymentDate) {
      throw new Error('Enter the payee and expected payment date.');
    }

    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Enter a positive payment amount.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (new Date(`${input.paymentDate}T00:00:00`) < today) {
      throw new Error('Select today or a future payment date.');
    }
  }

  if (input.type === 'cheque' && !/^\d+$/.test(input.chequeNumber)) {
    throw new Error('Enter a valid cheque number.');
  }

  const requests = readStopPayments(customerId);

  // Prevent duplicate active requests for the same payment or card.
  
// ========================================
// Prevent duplicate stop payment requests
// ========================================

const duplicate = requests.some(request => {

  // Ignore cancelled requests and requests
  // associated with other products.

  if (
    request.status !== 'Active' ||
    request.type !== input.type ||
    request.productId !== input.productId
  ) {
    return false;
  }

  // --------------------------------------
  // Card stop payment
  // --------------------------------------

  if (input.type === 'card') {

    const sameTransactionName =
      (request.transactionName ?? '').trim().toLowerCase() ===
      (input.transactionName ?? '').trim().toLowerCase();

    const sameAmount =
      Number(request.amount) === Number(input.amount);

    const sameCurrency =
      request.currency === input.currency;

    return (
      sameTransactionName &&
      sameAmount &&
      sameCurrency
    );
  }

  // --------------------------------------
  // Cheque stop payment
  // --------------------------------------

  if (input.type === 'cheque') {

    const sameChequeNumber =
      Number(request.chequeNumber) ===
      Number(input.chequeNumber);

    return sameChequeNumber;
  }

  // --------------------------------------
  // Pre-authorized debit stop payment
  // --------------------------------------

  const samePayee =
    request.payee.trim().toLowerCase() ===
    input.payee.trim().toLowerCase();

  const sameDate =
    request.paymentDate === input.paymentDate;

  const sameAmount =
    Number(request.amount) === Number(input.amount);

  return (
    samePayee &&
    (
      request.recurring ||
      input.recurring ||
      (sameDate && sameAmount)
    )
  );
});

// Display an error if a duplicate exists.

if (duplicate) {
  throw new Error(
    'A matching active stop payment request already exists.'
  );
}


  if (duplicate) {
    throw new Error('A matching active request already exists.');
  }

  const request: StopPayment = {
    ...input,
    id: crypto.randomUUID(),
    customerId,
    status: 'Active',
    createdAt: new Date().toISOString(),
    employee: demoEmployee.id,
    cancelledAt: null,
    cancelledBy: null,
  };

  requests.unshift(request);
  saveRequests(customerId, requests);
  return requests;
}

export function cancelStopPayment(
  customerId: number,
  requestId: string
): StopPayment[] {
  const requests = readStopPayments(customerId);
  const request = requests.find(item => item.id === requestId);

  if (!request || request.status !== 'Active') {
    throw new Error('This request cannot be cancelled.');
  }

  // Past one-time payments cannot be cancelled in this demo.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (request.type !== 'card' && !request.recurring &&
      new Date(`${request.paymentDate}T00:00:00`) < today) {
    throw new Error('The expected payment date has passed.');
  }

  request.status = 'Cancelled';
  request.cancelledAt = new Date().toISOString();
  request.cancelledBy = demoEmployee.id;
  saveRequests(customerId, requests);
  return requests;
}
