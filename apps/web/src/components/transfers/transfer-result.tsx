import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { ResolvedAccount } from '@/lib/banking-types';
import type { TransferResult } from '@/services/transferService';
import { money, maskedAccount } from '@/lib/banking-format';

export type TransferResultProps = {
  from: ResolvedAccount;
  to: ResolvedAccount;
  amount: number;
  result: TransferResult;
  onReset: () => void;
};

export function TransferResultView({ from, to, amount, result, onReset }: TransferResultProps) {
  return (
    <section className="panel transfer-panel transfer-success">
      <div className="transfer-success-head">
        <span className="transfer-success-icon"><CheckCircle2 size={26} /></span>
        <div>
          <h2>Transfer completed</h2>
          <p>{money(amount, result.fromCurrency)} moved from {from.product.name} to {to.product.name}.</p>
        </div>
      </div>
      <div className="transfer-result-grid">
        <div className="transfer-result-card">
          <small>FROM · {maskedAccount(from.accountNumber)}</small>
          <strong>{from.product.name}</strong>
          <span className="transfer-balance-before">Previous balance: {money(from.balance, from.currency)}</span>
          <span className="transfer-balance-after">New balance: {money(result.fromBalance, from.currency)}</span>
        </div>
        <div className="transfer-result-card">
          <small>TO · {maskedAccount(to.accountNumber)}</small>
          <strong>{to.product.name}</strong>
          <span className="transfer-balance-before">Previous balance: {money(to.balance, to.currency)}</span>
          <span className="transfer-balance-after">New balance: {money(result.toBalance, to.currency)}</span>
        </div>
      </div>
      <p className="transfer-note">Simulated balances shown only on this page. Original account balances are unchanged elsewhere.</p>
      <div className="transfer-actions">
        <button className="button-primary" type="button" onClick={onReset}><RotateCcw size={14} />New transfer</button>
      </div>
    </section>
  );
}
