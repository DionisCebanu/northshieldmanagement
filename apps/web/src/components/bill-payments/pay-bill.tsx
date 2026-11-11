import { useState, useEffect } from 'react';
import { ArrowRight, Check, ArrowLeft, Receipt } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { getPayeesByClientId, makePayment } from '@/services/billPaymentService';
import { money, maskedAccount, dateLabel } from '@/lib/banking-format';
import type { ResolvedPayee, ResolvedBillPayment } from '@/lib/banking-types';

type Step = 'form' | 'confirm' | 'result';

export function PayBill() {
  const { workspace } = useClient();
  const [payees, setPayees] = useState<ResolvedPayee[]>([]);
  const [payeeId, setPayeeId] = useState<number | null>(null);
  const [sourceAccountId, setSourceAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [result, setResult] = useState<ResolvedBillPayment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clientId = workspace?.client.id ?? 0;
  useEffect(() => { if (clientId) void getPayeesByClientId(clientId).then(setPayees); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  if (!workspace) return null;

  const eligibleAccounts = workspace.accounts.filter(account => account.status === 'ACTIVE' && (account.product.category === 'CHEQUING' || account.product.category === 'SAVINGS'));
  const payee = payees.find(p => p.id === payeeId) ?? null;
  const sourceAccount = eligibleAccounts.find(a => a.id === sourceAccountId) ?? null;
  const isFuture = paymentDate > new Date().toISOString().slice(0, 10);

  function handleContinue() {
    setError(null);
    if (!payee) { setError('Select a payee.'); return; }
    if (!sourceAccount) { setError('Select a source account.'); return; }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) { setError('Enter a positive payment amount.'); return; }
    if (value > sourceAccount.balance) { setError('The amount cannot exceed the available balance.'); return; }
    if (!paymentDate) { setError('Select a payment date.'); return; }
    setStep('confirm');
  }

  async function handleConfirm() {
    if (!payee || !sourceAccount) return;
    setSubmitting(true);
    try {
      const payment = await makePayment({
        clientId,
        payeeId: payee.id,
        sourceAccountId: sourceAccount.id,
        amount: Number(amount),
        currency: sourceAccount.currency,
        paymentDate,
        description: description || null,
        scheduled: isFuture,
      });
      setResult(payment);
      setStep('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not complete the payment.');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setPayeeId(null); setSourceAccountId(null); setAmount(''); setDescription('');
    setPaymentDate(new Date().toISOString().slice(0, 10)); setError(null); setResult(null); setStep('form');
  }

  if (step === 'confirm' && payee && sourceAccount) {
    return (
      <section className="panel">
        <div className="panel-heading"><div><h2>Confirm payment</h2><p>Review the bill payment before submitting.</p></div></div>
        <div className="transfer-form">
          <div className="transfer-result-grid">
            <div className="transfer-result-card"><small>Payee</small><strong>{payee.biller.name}</strong><span>{maskedAccount(payee.billAccountNumber)}</span></div>
            <div className="transfer-result-card"><small>Source account</small><strong>{sourceAccount.product.name}</strong><span>{maskedAccount(sourceAccount.accountNumber)}</span></div>
            <div className="transfer-result-card"><small>Amount</small><strong>{money(Number(amount), sourceAccount.currency)}</strong></div>
            <div className="transfer-result-card"><small>Payment date</small><strong>{dateLabel(paymentDate)}</strong><span>{isFuture ? 'Scheduled' : 'Immediate'}</span></div>
          </div>
          {description && <p className="transfer-note">Description: {description}</p>}
          {error && <p className="filter-error" role="alert">{error}</p>}
          <div className="transfer-actions">
            <button className="button-secondary" type="button" onClick={() => setStep('form')}><ArrowLeft size={15} />Back</button>
            <button className="button-primary" type="button" onClick={handleConfirm} disabled={submitting}>{submitting ? 'Processing…' : 'Confirm payment'}</button>
          </div>
        </div>
      </section>
    );
  }

  if (step === 'result' && result) {
    return (
      <section className="panel issuance-success">
        <div className="transfer-success-head">
          <span className="transfer-success-icon"><Check size={24} /></span>
          <div><h2>{result.status === 'SCHEDULED' ? 'Payment scheduled' : 'Payment completed'}</h2><p>{result.status === 'SCHEDULED' ? 'The payment is scheduled and will not execute automatically.' : 'A simulated payment record was created.'}</p></div>
        </div>
        <div className="transfer-result-grid">
          <div className="transfer-result-card"><small>Confirmation reference</small><strong>{result.confirmationReference}</strong></div>
          <div className="transfer-result-card"><small>Payee</small><strong>{result.biller.name}</strong></div>
          <div className="transfer-result-card"><small>Amount</small><strong>{money(result.amount, result.currency)}</strong></div>
          <div className="transfer-result-card"><small>Status</small><strong>{result.status}</strong></div>
        </div>
        <p className="transfer-note">Account balances are not modified in this phase. Permanent posting will be handled by the future backend.</p>
        <div className="transfer-actions"><button className="button-secondary" type="button" onClick={reset}><Receipt size={15} />Make another payment</button></div>
      </section>
    );
  }

  if (payees.length === 0) {
    return <section className="panel inline-empty"><h2>No saved payees</h2><p>Add a payee in the Manage Payees tab before making a payment.</p></section>;
  }

  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Pay a bill</h2><p>Pay a saved payee from an eligible customer account.</p></div></div>
      <div className="transfer-form">
        <div className="transfer-row">
          <label><span>Payee</span>
            <select className="profile-input" value={payeeId ?? ''} onChange={e => { setPayeeId(Number(e.target.value)); setError(null); }}>
              <option value="" disabled>Select a payee</option>
              {payees.map(p => <option key={p.id} value={p.id}>{p.biller.name}{p.nickname ? ` · ${p.nickname}` : ''}</option>)}
            </select>
          </label>
          <label><span>Source account</span>
            <select className="profile-input" value={sourceAccountId ?? ''} onChange={e => { setSourceAccountId(Number(e.target.value)); setError(null); }}>
              <option value="" disabled>Select source account</option>
              {eligibleAccounts.map(a => <option key={a.id} value={a.id}>{a.product.name} · {money(a.balance, a.currency)}</option>)}
            </select>
          </label>
        </div>
        <div className="transfer-balances">
          <div className="transfer-balance"><small>Available balance</small><strong>{sourceAccount ? money(sourceAccount.balance, sourceAccount.currency) : '—'}</strong>{sourceAccount && <span>{sourceAccount.product.name}</span>}</div>
        </div>
        <div className="transfer-row">
          <label><span>Payment amount</span><input className="profile-input" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></label>
          <label><span>Payment date</span><input className="profile-input" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} /></label>
        </div>
        <label className="full-width-field"><span>Description (optional)</span><input className="profile-input" placeholder="e.g. Monthly internet bill" value={description} onChange={e => setDescription(e.target.value)} /></label>
        {error && <p className="filter-error" role="alert">{error}</p>}
        <div className="transfer-actions"><button className="button-primary" type="button" onClick={handleContinue}>Continue <ArrowRight size={15} /></button></div>
        <p className="transfer-note">Future-dated payments are saved as SCHEDULED and do not deduct balances. Immediate payments create a record without modifying global balances.</p>
      </div>
    </section>
  );
}
