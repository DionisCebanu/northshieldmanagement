import { Link } from 'react-router';
import { Wallet, PiggyBank, ArrowUpRight, Landmark, Banknote, CreditCard as CreditCardIcon } from 'lucide-react';
import type { ResolvedAccount } from '@/lib/banking-types';
import { isLendingCategory } from '@/lib/banking-types';
import { money, maskedAccount, humanize } from '@/lib/banking-format';
import { StatusBadge } from '@/components/customer/status-badge';

export function AccountCard({ account }: { account: ResolvedAccount }) {
  const isLending = isLendingCategory(account.product.category);
  const isLoc = account.product.category === 'LINE_OF_CREDIT';
  const Icon = account.product.category === 'CHEQUING' ? Wallet
    : account.product.category === 'SAVINGS' ? PiggyBank
    : isLoc ? CreditCardIcon
    : isLending ? Banknote
    : Landmark;

  const balanceLabel = isLoc ? 'Outstanding balance'
    : account.product.category === 'PERSONAL_LOAN' ? 'Outstanding principal'
    : 'Current balance';
  const balanceValue = isLending ? (account.outstandingBalance ?? 0) : account.balance;
  const subLine = isLoc
    ? `Available credit ${money((account.creditLimit ?? 0) - (account.outstandingBalance ?? 0), account.currency)}`
    : account.product.category === 'PERSONAL_LOAN'
      ? `Interest rate ${(account.annualInterestRate ?? 0).toFixed(2)}%`
      : null;

  return (
    <Link to={`/accounts?account=${account.id}`} className="account-card">
      <div className="account-card-top">
        <span className={`product-icon ${account.product.category === 'SAVINGS' ? 'savings-icon' : ''}`}><Icon size={21} /></span>
        <span className="account-category">{humanize(account.product.category)}</span>
        <ArrowUpRight size={17} />
      </div>
      <h3>{account.product.name}</h3>
      <span className="masked-number">{maskedAccount(account.accountNumber)}</span>
      <div className="balance-label">{balanceLabel}</div>
      <div className="account-balance">{money(balanceValue, account.currency)}<span>{account.currency}</span></div>
      {subLine && <div className="account-card-sub">{subLine}</div>}
      <div className="account-card-bottom">
        <StatusBadge status={account.status} />
        <span>View account <ArrowUpRight size={13} /></span>
      </div>
    </Link>
  );
}
