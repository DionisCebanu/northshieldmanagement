import applicationsSeed from '@/data/lendingApplications.json';
import { readStore, writeStore, nextId, todayISO } from '@/lib/mock-storage';
import type { LendingApplication, LendingCategory } from '@/lib/banking-types';

const STORE_KEY = 'northshield:lending:applications';
const seedApplications = applicationsSeed as unknown as LendingApplication[];

function allApplications(): LendingApplication[] {
  return [...seedApplications, ...readStore<LendingApplication>(STORE_KEY)];
}

export async function getLendingApplicationsByClientId(clientId: number): Promise<LendingApplication[]> {
  return allApplications()
    .filter(app => app.clientId === clientId)
    .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate) || b.id - a.id);
}

export type LendingApplicationInput = {
  clientId: number;
  productType: LendingCategory;
  requestedAmount: number;
  purpose: string;
  annualInterestRate: number;
  repaymentTermMonths: number | null;
  employmentStatus: string;
  employer: string | null;
  occupation: string | null;
  notes: string | null;
};

/**
 * Submits a lending application with status PENDING_APPROVAL. The application
 * is not an active account until approved. Prepared for a future REST API:
 * replace the localStorage write with a `POST /api/lending/applications` call.
 */
export async function submitLendingApplication(input: LendingApplicationInput): Promise<LendingApplication> {
  if (!Number.isFinite(input.requestedAmount) || input.requestedAmount <= 0) throw new Error('Enter a positive requested amount.');
  if (!input.purpose.trim()) throw new Error('A loan purpose is required.');
  const stored = readStore<LendingApplication>(STORE_KEY);
  const id = nextId(seedApplications, stored);
  const application: LendingApplication = {
    id,
    clientId: input.clientId,
    productType: input.productType,
    requestedAmount: input.requestedAmount,
    purpose: input.purpose.trim(),
    annualInterestRate: input.annualInterestRate,
    repaymentTermMonths: input.productType === 'PERSONAL_LOAN' ? input.repaymentTermMonths : null,
    applicationDate: todayISO(),
    employmentStatus: input.employmentStatus,
    employer: input.employer,
    occupation: input.occupation,
    notes: input.notes,
    status: 'PENDING_APPROVAL',
  };
  stored.push(application);
  writeStore(STORE_KEY, stored);
  return application;
}

/**
 * Updates a lending application status. Prepared for future approval and
 * rejection workflows. Only locally-submitted applications are mutable; seed
 * records remain read-only.
 */
export async function updateLendingApplicationStatus(applicationId: number, status: LendingApplication['status']): Promise<void> {
  const stored = readStore<LendingApplication>(STORE_KEY);
  const app = stored.find(item => item.id === applicationId);
  if (!app) throw new Error('Lending application not found.');
  app.status = status;
  writeStore(STORE_KEY, stored);
}
