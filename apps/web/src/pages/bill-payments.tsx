import { PageHeading } from '@/components/customer/page-heading';
import { CustomerHeader } from '@/components/customer/customer-header';
import { BillPaymentsWorkspace } from '@/components/bill-payments/bill-payments-workspace';
import { WorkspaceState } from '@/components/customer/workspace-state';
export function BillPayments() {
  return (
    <>
      <PageHeading title="Bill Payments" description="Pay bills, manage payees and review payment history for the selected customer." />
      <WorkspaceState>
        <CustomerHeader />
        <BillPaymentsWorkspace />
      </WorkspaceState>
    </>
  );
}
