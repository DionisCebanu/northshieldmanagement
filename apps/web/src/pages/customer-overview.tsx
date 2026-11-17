import { PageHeading } from '@/components/customer/page-heading';
import { CustomerHeader } from '@/components/customer/customer-header';
import { AccountOverview } from '@/components/accounts/account-overview';
import { RelationshipSummary } from '@/components/customer/relationship-summary';
import { RecentTransactions } from '@/components/transactions/recent-transactions';
import { CustomerDetails } from '@/components/customer/customer-details';
import { CustomerOffers } from '@/components/customer/customer-offers';
import { WorkspaceState } from '@/components/customer/workspace-state';
export function CustomerOverview() {
  return <><PageHeading title="Customer Overview" description="A complete view of your customer, all in one place." /><WorkspaceState><CustomerHeader /><CustomerOffers /><div className="overview-grid"><AccountOverview /><RelationshipSummary /><RecentTransactions /><CustomerDetails /></div></WorkspaceState></>;
}
