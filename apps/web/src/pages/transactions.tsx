import { PageHeading } from '@/components/customer/page-heading';
import { TransactionHistory } from '@/components/transactions/transaction-history';
import { WorkspaceState } from '@/components/customer/workspace-state';
export function Transactions() {
  return <><PageHeading title="Transactions" description="Review and filter activity across the selected customer’s accounts." /><WorkspaceState><TransactionHistory /></WorkspaceState></>;
}
