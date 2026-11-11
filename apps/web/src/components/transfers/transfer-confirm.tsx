import { ArrowLeft } from 'lucide-react';
import type { ResolvedAccount } from '@/lib/banking-types';
import { money, maskedAccount } from '@/lib/banking-format';

export type TransferConfirmProps = {
  from: ResolvedAccount;
  to: ResolvedAccount;
  amount: number;
  description: string;
  onConfirm: () => void;
  onBack: () => void;
};

export function TransferConfirm({ from, to, amount, description, onConfirm, onBack }: TransferConfirmProps) {
  const rows = [
    { label: 'From account', value: `${from.product.name} · ${maskedAccount(from.accountNumber)}` },
    { label: 'To account', value: `${to.product.name} · ${maskedAccount(to.accountNumber)}` },
    { label: 'Transfer amount', value: money(amount, from.currency) },
    { label: 'Description', value: description || 'No description provided' },
    { label: 'From balance before', value: money(from.balance, from.currency) },
    { label: 'To balance before', value: money(to.balance, to.currency) },
    { label: 'From balance after', value: money(from.balance - amount, from.currency) },
    { label: 'To balance after', value: money(to.balance + amount, to.currency) },
  ];
  return (
    <section className="panel transfer-panel">
      <div className="panel-heading"><div><h2>Confirm transfer</h2><p>Review the transfer details before completing the simulated transaction.</p></div></div>
      <dl className="profile-fields transfer-summary">
        {rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
      </dl>
      <div className="transfer-actions">
        <button className="button-secondary" type="button" onClick={onBack}><ArrowLeft size={14} />Back</button>
        <button className="button-primary" type="button" onClick={onConfirm}>Confirm transfer</button>
      </div>
    </section>
  );
}
