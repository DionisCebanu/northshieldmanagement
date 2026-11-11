import { PageHeading } from '@/components/customer/page-heading';
import { CustomerHeader } from '@/components/customer/customer-header';
import { CardsWorkspace } from '@/components/cards/cards-workspace';
import { WorkspaceState } from '@/components/customer/workspace-state';
export function Cards() {
  return (
    <>
      <PageHeading title="Cards" description="Manage this customer's debit and credit cards, including status servicing." />
      <WorkspaceState>
        <CustomerHeader />
        <CardsWorkspace />
      </WorkspaceState>
    </>
  );
}
