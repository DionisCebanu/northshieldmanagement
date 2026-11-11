import { PageHeading } from '@/components/customer/page-heading';
import { AccountsTable } from '@/components/accounts/accounts-table';
import { AccountDetail } from '@/components/accounts/account-detail';
import { WorkspaceState } from '@/components/customer/workspace-state';
import { Link } from 'react-router';
import { ArrowRightLeft } from 'lucide-react';
export function Accounts() {
  return <><PageHeading title="Accounts" description="Explore customer-owned accounts, product details and balances." action={<Link className="button-secondary" to="/transfers"><ArrowRightLeft size={15} />Transfer between accounts</Link>} /><WorkspaceState><AccountsTable /><AccountDetail /></WorkspaceState></>;
}
