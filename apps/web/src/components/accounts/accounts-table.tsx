import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { money, maskedAccount, dateLabel, humanize } from '@/lib/banking-format';
import { isLendingCategory } from '@/lib/banking-types';
import { StatusBadge } from '@/components/customer/status-badge';
export function AccountsTable() {
  const { workspace } = useClient();
  if (!workspace) return null;
  return <section className="panel"><div className="panel-heading"><div><h2>Customer accounts <span className="count-badge">{workspace.accounts.length}</span></h2><p>Select an account to view its details and activity.</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Account number</th><th>Product name</th><th>Account type</th><th className="amount-cell">Balance</th><th>Currency</th><th>Status</th><th>Date opened</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{workspace.accounts.map(account => { const lending = isLendingCategory(account.product.category); const balance = lending ? (account.outstandingBalance ?? 0) : account.balance; const balanceLabel = lending ? 'Outstanding' : 'Balance'; return <tr key={account.id}><td><Link to={`?account=${account.id}`} className="text-link">{maskedAccount(account.accountNumber)}</Link></td><td><strong>{account.product.name}</strong></td><td>{humanize(account.product.category)}</td><td className="amount-cell" title={balanceLabel}>{money(balance, account.currency)}</td><td>{account.currency}</td><td><StatusBadge status={account.status} /></td><td>{dateLabel(account.dateOpened)}</td><td><Link className="icon-link" to={`?account=${account.id}`} aria-label={`View ${account.product.name} account ${account.accountNumber.slice(-4)}`}><ArrowUpRight size={17} /></Link></td></tr>; })}</tbody></table></div>{!workspace.accounts.length && <div className="inline-empty">No customer accounts found.</div>}<div className="table-footer"><span>{workspace.accounts.length} accounts · Includes closed accounts</span><span>Lending balances shown as outstanding</span></div></section>;
}
