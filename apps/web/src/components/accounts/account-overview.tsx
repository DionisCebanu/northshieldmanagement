import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { AccountCard } from '@/components/accounts/account-card';
export function AccountOverview() {
  const { workspace } = useClient();
  if (!workspace) return null;
  return <section className="account-overview"><div className="section-heading"><h2>Account overview <span className="count-badge">{workspace.accounts.length}</span></h2><Link className="text-link" to="/accounts">View all accounts <ArrowRight size={15} /></Link></div><div className="account-card-grid">{workspace.accounts.map(account => <AccountCard account={account} key={account.id} />)}</div>{workspace.accounts.length === 0 && <p className="inline-empty">No accounts are associated with this customer.</p>}</section>;
}
