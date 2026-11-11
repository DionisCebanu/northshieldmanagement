import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { TransactionTable } from '@/components/transactions/transaction-table';
export function RecentTransactions() {
  const { workspace } = useClient();
  if (!workspace) return null;
  return <section className="panel recent-transactions"><div className="panel-heading"><div><h2>Recent transactions</h2><p>Latest activity across all customer accounts</p></div><Link className="text-link" to="/transactions">View all <ArrowRight size={15} /></Link></div><TransactionTable transactions={workspace.transactions.slice(0, 5)} accounts={workspace.accounts} /><div className="table-footer"><span>Showing {Math.min(5, workspace.transactions.length)} of {workspace.transactions.length} transactions</span><span>All amounts in CAD</span></div></section>;
}
