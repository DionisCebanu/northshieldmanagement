import { PageHeading } from '@/components/customer/page-heading';
import { FraudOverview } from '@/components/fraud-security/fraud-overview';
import { WorkspaceState } from '@/components/customer/workspace-state';
export function FraudSecurity() {
  return <><PageHeading title="Fraud & Security" description="Flagged transactions and submitted dispute cases for the selected customer." /><WorkspaceState><FraudOverview /></WorkspaceState></>;
}
