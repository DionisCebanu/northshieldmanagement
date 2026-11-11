import { PageHeading } from '@/components/customer/page-heading';
import { CustomerHeader } from '@/components/customer/customer-header';
import { ProductsWorkspace } from '@/components/products/products-workspace';
import { WorkspaceState } from '@/components/customer/workspace-state';
export function Products() {
  return (
    <>
      <PageHeading title="Banking Products" description="Issue cards, open accounts and submit lending applications for the selected customer." />
      <WorkspaceState>
        <CustomerHeader />
        <ProductsWorkspace />
      </WorkspaceState>
    </>
  );
}
