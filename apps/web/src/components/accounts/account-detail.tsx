import { Link, useSearchParams } from 'react-router';
import type { ReactNode } from 'react';
import { X, Landmark } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { money, dateLabel, humanize } from '@/lib/banking-format';
import { isLendingCategory } from '@/lib/banking-types';
import { StatusBadge } from '@/components/customer/status-badge';
import { TransactionTable } from '@/components/transactions/transaction-table';
export function AccountDetail() {
  const { workspace } = useClient();
  const [params] = useSearchParams();
  const selected = params.get('account');
  if (!selected || !workspace) return null;
  const account = workspace.accounts.find(item => item.id === Number(selected));
  if (!account) return <section className="panel inline-empty"><h2>Account not found</h2><p>This account does not belong to the selected customer.</p><Link className="text-link" to="/accounts">Return to accounts</Link></section>;
  const isLending = isLendingCategory(account.product.category);
  const isLoc = account.product.category === 'LINE_OF_CREDIT';

  const fields: { label: string; value: ReactNode }[] = [
    { label: 'Account number', value: account.accountNumber },
    { label: 'Transit number', value: account.transitNumber },
    { label: 'Institution number', value: account.institutionNumber },
    { label: 'Branch', value: account.branch.name },
    { label: 'Branch address', value: `${account.branch.street}, ${account.branch.city}, ${account.branch.province} ${account.branch.postalCode}` },
    { label: 'Branch status', value: humanize(account.branch.status) },
    { label: 'Product type', value: humanize(account.product.category) },
  ];

  if (isLending) {
    fields.push(
      { label: 'Outstanding balance', value: `${money(account.outstandingBalance ?? 0, account.currency)} ${account.currency}` },
      { label: 'Annual interest rate', value: `${(account.annualInterestRate ?? 0).toFixed(2)}%` },
    );
    if (isLoc) {
      fields.push(
        { label: 'Credit limit', value: `${money(account.creditLimit ?? 0, account.currency)} ${account.currency}` },
        { label: 'Available credit', value: `${money((account.creditLimit ?? 0) - (account.outstandingBalance ?? 0), account.currency)} ${account.currency}` },
      );
    } else {
      fields.push({ label: 'Repayment term', value: account.repaymentTermMonths ? `${account.repaymentTermMonths} months` : 'Not specified' });
    }
  } else {
    fields.push(
      { label: 'Current balance', value: `${money(account.balance, account.currency)} ${account.currency}` },
    );
    if (account.product.category === 'INVESTMENT' && account.principal != null) {
      fields.push(
        { label: 'Principal', value: `${money(account.principal, account.currency)} ${account.currency}` },
        { label: 'Term', value: account.term ?? 'Not specified' },
        { label: 'Maturity date', value: account.maturityDate ? dateLabel(account.maturityDate) : 'Not specified' },
        { label: 'Interest rate', value: account.annualInterestRate != null ? `${account.annualInterestRate.toFixed(2)}%` : 'Not specified' },
      );
    }
    if (account.product.category === 'REGISTERED') {
      fields.push(
        { label: 'Registration type', value: account.registrationType ?? humanize(account.product.name) },
        { label: 'Beneficiary', value: account.beneficiary ?? 'Not designated' },
      );
    }
  }

  fields.push(
    { label: 'Date opened', value: dateLabel(account.dateOpened) },
    { label: 'Date closed', value: account.dateClosed ? dateLabel(account.dateClosed) : 'Not applicable — active account' },
    { label: 'Monthly product fee', value: money(account.product.monthlyFee, account.product.currency) },
    { label: 'Product terms', value: account.product.terms },
    { label: 'Status', value: <StatusBadge status={account.status} /> },
  );

  return <section className="panel account-detail"><div className="panel-heading"><div><h2><Landmark size={20} />{account.product.name} <StatusBadge status={account.status} /></h2><p>Account details · Read-only</p></div><Link className="icon-button" to="/accounts" aria-label="Close account details"><X size={20} /></Link></div><dl className="profile-fields account-detail-fields">{fields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl><div className="panel-heading detail-activity-heading"><div><h2>Related transactions</h2><p>Only activity for this account</p></div><Link className="text-link" to={`/transactions?account=${account.id}`}>Full history</Link></div><TransactionTable transactions={workspace.transactions.filter(item => item.accountId === account.id)} accounts={[account]} showStatus /></section>;
}
