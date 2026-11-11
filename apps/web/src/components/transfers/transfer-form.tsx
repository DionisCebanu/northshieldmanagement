import { ArrowRight } from 'lucide-react';
import type { ResolvedAccount } from '@/lib/banking-types';
import { money, maskedAccount, humanize } from '@/lib/banking-format';

export type TransferFormProps = {
  accounts: ResolvedAccount[];
  fromId: number | null;
  toId: number | null;
  amount: string;
  description: string;
  error: string | null;
  onFromChange: (id: number) => void;
  onToChange: (id: number) => void;
  onAmountChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onContinue: () => void;
};

export function TransferForm({ accounts, fromId, toId, amount, description, error, onFromChange, onToChange, onAmountChange, onDescriptionChange, onContinue }: TransferFormProps) {
  const fromAccount = accounts.find(account => account.id === fromId) ?? null;
  const toOptions = accounts.filter(account => account.id !== fromId && (!fromAccount || account.currency === fromAccount.currency));

  return (
    <section className="panel transfer-panel">
      <div className="panel-heading"><div><h2>Transfer between accounts</h2><p>Move funds between this customer's active accounts. Same currency only.</p></div></div>
      <div className="transfer-form">
        <div className="transfer-row">
          <label>
            <span>From account</span>
            <select value={fromId ?? ''} onChange={event => onFromChange(Number(event.target.value))}>
              <option value="" disabled>Select source account</option>
              {accounts.map(account => <option key={account.id} value={account.id}>{account.product.name} · {maskedAccount(account.accountNumber)}</option>)}
            </select>
          </label>
          <label>
            <span>To account</span>
            <select value={toId ?? ''} onChange={event => onToChange(Number(event.target.value))} disabled={!fromAccount}>
              <option value="" disabled>Select destination account</option>
              {toOptions.map(account => <option key={account.id} value={account.id}>{account.product.name} · {maskedAccount(account.accountNumber)}</option>)}
            </select>
          </label>
        </div>
        <div className="transfer-balances">
          <div className="transfer-balance"><small>From available balance</small><strong>{fromAccount ? money(fromAccount.balance, fromAccount.currency) : '—'}</strong>{fromAccount && <span>{humanize(fromAccount.product.category)} · {fromAccount.currency}</span>}</div>
          <ArrowRight size={18} className="transfer-arrow" />
          <div className="transfer-balance"><small>To available balance</small><strong>{toId ? money(accounts.find(a => a.id === toId)?.balance ?? 0, fromAccount?.currency ?? 'CAD') : '—'}</strong>{toId && <span>{humanize(accounts.find(a => a.id === toId)?.product.category ?? '')} · {fromAccount?.currency}</span>}</div>
        </div>
        <div className="transfer-row">
          <label>
            <span>Transfer amount</span>
            <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={amount} onChange={event => onAmountChange(event.target.value)} />
          </label>
          <label>
            <span>Description (optional)</span>
            <input type="text" placeholder="e.g. Savings contribution" value={description} onChange={event => onDescriptionChange(event.target.value)} />
          </label>
        </div>
        {error && <p className="filter-error" role="alert">{error}</p>}
        <div className="transfer-actions">
          <button className="button-primary" type="button" onClick={onContinue}>Continue</button>
        </div>
        <p className="transfer-note">This is a temporary simulation. Balances are not permanently updated and reset when you leave this page.</p>
      </div>
    </section>
  );
}
