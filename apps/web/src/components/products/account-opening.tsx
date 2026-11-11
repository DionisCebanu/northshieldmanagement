import { useState } from 'react';
import { Check, ArrowLeft, Landmark } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { openAccount } from '@/services/accountService';
import accountTypes from '@/data/accountTypes.json';
import branches from '@/data/branches.json';
import { money, maskedAccount, humanize, dateLabel } from '@/lib/banking-format';
import type { AccountType, ResolvedAccount } from '@/lib/banking-types';

export function AccountOpening({ productTypeId, onDone }: { productTypeId: number; onDone: () => void }) {
  const { workspace, reloadWorkspace } = useClient();
  const [currency, setCurrency] = useState('CAD');
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  // Registered
  const [registrationType, setRegistrationType] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  // GIC
  const [principal, setPrincipal] = useState('');
  const [term, setTerm] = useState('1 year');
  const [interestRate, setInterestRate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [opened, setOpened] = useState<ResolvedAccount | null>(null);

  const currentProduct = (accountTypes as unknown as AccountType[]).find(item => item.id === productTypeId) ?? null;

  if (!workspace) return null;
  const client = workspace.client;

  if (!currentProduct) {
    return <section className="panel inline-empty"><h2>Product not found</h2><button className="button-secondary" type="button" onClick={onDone}>Back to products</button></section>;
  }

  const isRegistered = currentProduct.category === 'REGISTERED';
  const isGic = currentProduct.category === 'INVESTMENT';

  async function submit() {
    setError(null);
    if (!currentProduct) return;
    if (!termsConfirmed) { setError('Confirm the product terms to continue.'); return; }
    if (!branchId) { setError('Select a branch.'); return; }
    const deposit = initialDeposit ? Number(initialDeposit) : 0;
    if (initialDeposit && (!Number.isFinite(deposit) || deposit < 0)) { setError('Enter a valid initial deposit.'); return; }

    setSubmitting(true);
    try {
      let input: Parameters<typeof openAccount>[0] = {
        clientId: client.id,
        accountTypeId: currentProduct.id,
        currency,
        branchId,
        initialDeposit: deposit,
      };
      if (isGic) {
        const principalValue = Number(principal);
        if (!Number.isFinite(principalValue) || principalValue <= 0) { setError('Enter a positive GIC principal.'); setSubmitting(false); return; }
        if (!interestRate || Number(interestRate) <= 0) { setError('Enter a fictional interest rate.'); setSubmitting(false); return; }
        if (!maturityDate) { setError('Select a maturity date.'); setSubmitting(false); return; }
        input = {
          ...input,
          initialDeposit: principalValue,
          principal: principalValue,
          term,
          annualInterestRate: Number(interestRate),
          maturityDate,
        };
      } else if (isRegistered) {
        input = {
          ...input,
          registrationType: registrationType || currentProduct.name,
          beneficiary: beneficiary || null,
        };
      }
      const account = await openAccount(input);
      await reloadWorkspace();
      setOpened(account);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the account.');
    } finally {
      setSubmitting(false);
    }
  }

  if (opened) {
    return (
      <section className="panel issuance-success">
        <div className="transfer-success-head">
          <span className="transfer-success-icon"><Check size={24} /></span>
          <div><h2>Account opened</h2><p>The new account is active and appears in Customer Overview and Accounts.</p></div>
        </div>
        <div className="transfer-result-grid">
          <div className="transfer-result-card"><small>Product</small><strong>{opened.product.name}</strong></div>
          <div className="transfer-result-card"><small>Account number</small><strong>{maskedAccount(opened.accountNumber)}</strong></div>
          <div className="transfer-result-card"><small>Account type</small><strong>{humanize(opened.product.category)}</strong></div>
          <div className="transfer-result-card"><small>Branch</small><strong>{opened.branch.name}</strong></div>
          {!isGic && <div className="transfer-result-card"><small>Initial deposit</small><strong>{money(opened.balance, opened.currency)}</strong></div>}
          {isGic && <div className="transfer-result-card"><small>Maturity date</small><strong>{dateLabel(opened.maturityDate ?? '')}</strong></div>}
          <div className="transfer-result-card"><small>Date opened</small><strong>{dateLabel(opened.dateOpened)}</strong></div>
        </div>
        <div className="transfer-actions"><button className="button-secondary" type="button" onClick={onDone}><ArrowLeft size={15} />Back to products</button></div>
      </section>
    );
  }

  return (
    <section className="panel issuance-form">
      <div className="panel-heading"><div><h2><Landmark size={20} />Open {currentProduct.name}</h2><p>{currentProduct.terms}</p></div><button className="icon-button" type="button" onClick={onDone} aria-label="Back to products"><ArrowLeft size={18} /></button></div>
      <div className="transfer-form">
        <div className="transfer-row">
          <label><span>Customer</span><input className="profile-input" value={`${client.firstName} ${client.lastName} · Client #${client.id}`} readOnly /></label>
          <label><span>Account product</span><input className="profile-input" value={currentProduct.name} readOnly /></label>
        </div>
        <div className="transfer-row">
          <label><span>Currency</span>
            <select className="profile-input" value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="CAD">CAD</option><option value="USD">USD</option>
            </select>
          </label>
          <label><span>Branch</span>
            <select className="profile-input" value={branchId} onChange={e => setBranchId(e.target.value)}>
              {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name} · {branch.city}</option>)}
            </select>
          </label>
        </div>

        {!isGic && (
          <div className="transfer-row">
            <label><span>Initial deposit (optional)</span><input className="profile-input" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={initialDeposit} onChange={e => setInitialDeposit(e.target.value)} /></label>
            <label><span>Monthly fee</span><input className="profile-input" value={money(currentProduct.monthlyFee, currentProduct.currency)} readOnly /></label>
          </div>
        )}

        {isRegistered && (
          <>
            <div className="transfer-row">
              <label><span>Registration type</span><input className="profile-input" placeholder={currentProduct.name} value={registrationType} onChange={e => setRegistrationType(e.target.value)} /></label>
              <label><span>Beneficiary (optional)</span><input className="profile-input" placeholder="e.g. Spouse" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} /></label>
            </div>
            <p className="transfer-note">Registered accounts are subject to fictional contribution limits. No real tax eligibility or contribution room is calculated.</p>
          </>
        )}

        {isGic && (
          <>
            <div className="transfer-row">
              <label><span>Principal</span><input className="profile-input" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={principal} onChange={e => setPrincipal(e.target.value)} /></label>
              <label><span>Term</span>
                <select className="profile-input" value={term} onChange={e => setTerm(e.target.value)}>
                  <option value="1 year">1 year</option><option value="2 years">2 years</option><option value="3 years">3 years</option><option value="5 years">5 years</option>
                </select>
              </label>
            </div>
            <div className="transfer-row">
              <label><span>Fictional interest rate (%)</span><input className="profile-input" type="number" min="0" step="0.01" inputMode="decimal" placeholder="e.g. 4.5" value={interestRate} onChange={e => setInterestRate(e.target.value)} /></label>
              <label><span>Maturity date</span><input className="profile-input" type="date" value={maturityDate} onChange={e => setMaturityDate(e.target.value)} /></label>
            </div>
            <p className="transfer-note">GICs are non-redeemable fictional fixed-term investments. No actual interest accrues in this demo.</p>
          </>
        )}

        <label className="terms-confirm">
          <input type="checkbox" checked={termsConfirmed} onChange={e => setTermsConfirmed(e.target.checked)} />
          <span>I confirm the customer has reviewed and accepted the product terms.</span>
        </label>

        {error && <p className="filter-error" role="alert">{error}</p>}
        <div className="transfer-actions">
          <button className="button-secondary" type="button" onClick={onDone}>Cancel</button>
          <button className="button-primary" type="button" onClick={submit} disabled={submitting}>{submitting ? 'Opening…' : 'Open account'}</button>
        </div>
      </div>
    </section>
  );
}
