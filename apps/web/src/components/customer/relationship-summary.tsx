import { Landmark, Wallet, MapPin, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { useClient } from '@/contexts/client-context';
import { money } from '@/lib/banking-format';
import { isLendingCategory } from '@/lib/banking-types';
export function RelationshipSummary() {
  const { workspace } = useClient();
  if (!workspace) return null;
  const active = workspace.accounts.filter(account => account.status === 'ACTIVE');
  // Lending accounts carry debt, not deposits — exclude them from the balance total.
  const depositAccounts = active.filter(account => !isLendingCategory(account.product.category));
  const totals = depositAccounts.reduce<Record<string, number>>((result, account) => { result[account.currency] = (result[account.currency] ?? 0) + account.balance; return result; }, {});
  const branch = workspace.accounts[0]?.branch;
  return <section className="relationship-panel"><div className="relationship-heading"><Landmark size={18} /><h2>Relationship snapshot</h2></div><div className="relationship-total"><span>Total deposit balance</span>{Object.entries(totals).map(([currency, balance]) => <div key={currency}><strong>{money(balance, currency)}</strong><small>{currency}</small></div>)}{depositAccounts.length === 0 && <strong>No active deposit accounts</strong>}</div><div className="relationship-row"><Wallet size={17} /><span>Active accounts</span><strong>{active.length}</strong></div><div className="relationship-row branch-row"><MapPin size={17} /><div><span>Primary account branch</span><strong>{branch?.name ?? 'Not assigned'}</strong><small>{branch ? `${branch.city}, ${branch.province} · ${branch.transitNumber}` : 'No branch information'}</small></div></div><Link to="/accounts" className="relationship-link">Explore customer accounts <ArrowUpRight size={15} /></Link></section>;
}
