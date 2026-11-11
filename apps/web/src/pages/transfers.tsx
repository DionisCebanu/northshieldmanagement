import { PageHeading } from '@/components/customer/page-heading';
import { CustomerHeader } from '@/components/customer/customer-header';
import { TransferWorkspace } from '@/components/transfers/transfer-workspace';
import { WorkspaceState } from '@/components/customer/workspace-state';
export function Transfers() {
  return (
    <>
      <PageHeading title="Internal Transfers" description="Simulate moving funds between this customer's active accounts." />
      <WorkspaceState>
        <CustomerHeader />
        <TransferWorkspace />
      </WorkspaceState>
    </>
  );
}
