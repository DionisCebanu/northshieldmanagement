export type Client = {
  id: number; firstName: string; lastName: string; dateOfBirth: string; status: string;
  address: { street: string; unit: string | null; city: string; province: string; postalCode: string; country: string };
  contact: { email: string; mobilePhone: string | null; homePhone: string | null };
  employment: { status: string; employer: string | null; occupation: string | null };
  student: { isStudent: boolean; institution: string | null; program: string | null };
};
export type AccountType = { id: number; category: string; name: string; monthlyFee: number; currency: string; terms: string };
// Ownership remains isolated in services; a future ownership relation can replace clientId there.
export type Account = { id: number; clientId: number; accountTypeId: number; accountNumber: string; transitNumber: string; institutionNumber: string; branchId: string; currency: string; balance: number; status: string; dateOpened: string; dateClosed: string | null;
  // Lending attributes (optional — present on personal loans and lines of credit)
  creditLimit?: number | null;
  outstandingBalance?: number | null;
  annualInterestRate?: number | null;
  repaymentTermMonths?: number | null;
  // Registered account attributes (optional)
  registrationType?: string | null;
  beneficiary?: string | null;
  // GIC attributes (optional)
  principal?: number | null;
  term?: string | null;
  maturityDate?: string | null;
};

export const LENDING_CATEGORIES = ['PERSONAL_LOAN', 'LINE_OF_CREDIT'] as const;
export type LendingCategory = typeof LENDING_CATEGORIES[number];
export function isLendingCategory(category: string): boolean {
  return (LENDING_CATEGORIES as readonly string[]).includes(category);
}
export type Branch = { id: string; name: string; transitNumber: string; street: string; city: string; province: string; postalCode: string; status: string };
export type Transaction = { id: number; accountId: number; date: string; amount: number; currency: string; type: string; description: string; merchant: string | null; status: string; fraud?: boolean };
export type ResolvedAccount = Account & { product: AccountType; branch: Branch };

export type CardStatus = 'ACTIVE' | 'FROZEN' | 'LOST' | 'STOLEN' | 'FRAUD' | 'CLOSED';
export type CardType = 'DEBIT' | 'CREDIT';

export type CreditCardProduct = { id: number; name: string; category: string; annualFee: number; currency: string; description: string; rewardType: string };
export type DebitCardProduct = { id: number; name: string; category: string; currency: string; description: string; linkedAccountType: string };

export type CustomerCardBase = { id: number; clientId: number; productId: number; cardType: CardType; cardNumber: string; cardholderName: string; expiryDate: string; dateOpened: string; dateClosed: string | null; status: CardStatus; deliveryMethod?: string | null };
export type DebitCard = CustomerCardBase & { cardType: 'DEBIT'; linkedAccountId: number; linkedAccountIds: number[]; currency: string };
export type CreditCard = CustomerCardBase & { cardType: 'CREDIT'; creditLimit: number; outstandingBalance: number; currency: string };
export type CustomerCard = DebitCard | CreditCard;

export type ResolvedDebitCard = DebitCard & { product: DebitCardProduct; linkedAccount: ResolvedAccount; linkedAccounts: ResolvedAccount[] };
export type ResolvedCreditCard = CreditCard & { product: CreditCardProduct; annualFee: number };
export type ResolvedCard = ResolvedDebitCard | ResolvedCreditCard;

export type ClientWorkspace = { client: Client; accounts: ResolvedAccount[]; transactions: Transaction[]; cards: ResolvedCard[]; disputes: TransactionDispute[]; offers: CustomerOffer[]; notes: CustomerNote[] };

// ---- Transaction disputes ----
export type DisputeCategory = 'UNAUTHORIZED_TRANSACTION' | 'DUPLICATE_CHARGE' | 'INCORRECT_AMOUNT' | 'GOODS_NOT_RECEIVED' | 'SERVICE_NOT_PROVIDED' | 'CARD_FRAUD' | 'OTHER';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
export type TransactionDispute = { id: number; clientId: number; transactionIds: number[]; reason: string; category: DisputeCategory; date: string; status: DisputeStatus };

// ---- Customer offers ----
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type CustomerOffer = { id: number; clientId: number; product: string; amount: number; currency: string; expiry: string; status: OfferStatus; description: string; respondedAt?: string | null };

// ---- Customer notes ----
export type NoteCategory = 'COMPLAINT' | 'FRAUD' | 'CARD' | 'ACCOUNT' | 'GENERAL';
export type CustomerNote = { id: number; clientId: number; author: string; comment: string; category: NoteCategory; createdAt: string; expiresAt: string };

// ---- Lending applications ----
export type LendingApplicationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type LendingApplication = {
  id: number; clientId: number; productType: LendingCategory; requestedAmount: number; purpose: string;
  annualInterestRate: number; repaymentTermMonths: number | null; applicationDate: string;
  employmentStatus: string; employer: string | null; occupation: string | null; notes: string | null;
  status: LendingApplicationStatus;
};

// ---- Bill payments ----
export type BillPaymentCompany = {
  id: number; name: string; category: string; accountNumberFormat: string; accountNumberPattern: string; status: string;
};
export type Payee = {
  id: number; clientId: number; billerId: number; billAccountNumber: string; nickname: string | null; dateAdded: string;
};
export type ResolvedPayee = Payee & { biller: BillPaymentCompany };
export type PaymentStatus = 'POSTED' | 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';
export type BillPayment = {
  id: number; clientId: number; payeeId: number; billerId: number; sourceAccountId: number;
  amount: number; currency: string; paymentDate: string; description: string | null;
  status: PaymentStatus; confirmationReference: string; scheduledDate?: string | null;
};
export type ResolvedBillPayment = BillPayment & { biller: BillPaymentCompany; payee: ResolvedPayee | null; sourceAccount: ResolvedAccount | null };
