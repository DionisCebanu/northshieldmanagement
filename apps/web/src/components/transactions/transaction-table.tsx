import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import type { Transaction, ResolvedAccount } from '@/lib/banking-types';
import { money, dateLabel, humanize, maskedAccount } from '@/lib/banking-format';
import { StatusBadge } from '@/components/customer/status-badge';

type TransactionTableProps = {
  transactions: Transaction[];
  accounts: ResolvedAccount[];
  showStatus?: boolean;
  selectable?: boolean;
  selectedIds?: number[];
  onToggleSelect?: (id: number) => void;
  isEligible?: (transaction: Transaction) => boolean;
};

export function TransactionTable({ transactions, accounts, showStatus = false, selectable = false, selectedIds = [], onToggleSelect, isEligible }: TransactionTableProps) {
  if (!transactions.length) return <div className="inline-empty"><strong>No transactions found</strong><p>There are no transactions matching this view.</p></div>;
  return <div className="table-scroll"><table className="data-table transaction-table"><thead><tr>{selectable && <th className="dispute-check-col"></th>}<th>Date</th><th>Description</th><th>Account</th>{showStatus && <th>Status</th>}<th className="amount-cell">Amount</th></tr></thead><tbody>{transactions.map(transaction => { const account = accounts.find(item => item.id === transaction.accountId); const incoming = transaction.amount >= 0; const eligible = !isEligible || isEligible(transaction); const checked = selectedIds.includes(transaction.id); return <tr key={transaction.id} className={transaction.fraud ? 'fraud-row' : ''}>{selectable && <td className="dispute-check-col">{eligible ? <input type="checkbox" className="dispute-checkbox" checked={checked} onChange={() => onToggleSelect?.(transaction.id)} aria-label={`Select ${transaction.description} for dispute`} /> : null}</td>}<td className="date-cell">{dateLabel(transaction.date)}</td><td><div className="transaction-description"><span className={`transaction-icon ${incoming ? 'incoming-icon' : ''}`}>{incoming ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span><div><strong>{transaction.description}</strong>{transaction.fraud ? <span className="fraud-flag">Flagged fraud · {humanize(transaction.type)}</span> : <span>{humanize(transaction.type)}</span>}</div></div></td><td>{account ? <Link className="account-reference" to={`/accounts?account=${account.id}`}>{account.product.name}<small>{maskedAccount(account.accountNumber)}</small></Link> : 'Account unavailable'}</td>{showStatus && <td><StatusBadge status={transaction.status} /></td>}<td className={`amount-cell ${incoming ? 'positive-amount' : ''}`}>{incoming ? '+' : '−'}{money(Math.abs(transaction.amount), transaction.currency)}</td></tr>; })}</tbody></table></div>;
}
