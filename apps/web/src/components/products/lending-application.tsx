import { useState } from 'react';
import { Check, ArrowLeft, Banknote } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { submitLendingApplication } from '@/services/lendingService';
import { money, humanize, dateLabel } from '@/lib/banking-format';
import type { LendingApplication, LendingCategory } from '@/lib/banking-types';

export function LendingApplication({ productType, onDone }: { productType: LendingCategory; onDone: () => void }) {
  const { workspace } = useClient();
  const [requestedAmount, setRequestedAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [annualInterestRate, setAnnualInterestRate] = useState('');
  const [repaymentTermMonths, setRepaymentTermMonths] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<LendingApplication | null>(null);

  if (!workspace) return null;
  const client = workspace.client;
  const isLoan = productType === 'PERSONAL_LOAN';

  async function submit() {
    setError(null);
    const amount = Number(requestedAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setError('Enter a positive requested amount.'); return; }
    if (!purpose.trim()) { setError('A purpose is required.'); return; }
    const rate = Number(annualInterestRate);
    if (!Number.isFinite(rate) || rate <= 0) { setError('Enter a positive fictional annual interest rate.'); return; }
    let termMonths: number | null = null;
    if (isLoan) {
      const term = Number(repaymentTermMonths);
      if (!Number.isFinite(term) || term <= 0) { setError('Enter a repayment term in months.'); return; }
      termMonths = term;
    }
    setSubmitting(true);
    try {
      const application = await submitLendingApplication({
        clientId: client.id,
        productType,
        requestedAmount: amount,
        purpose,
        annualInterestRate: rate,
        repaymentTermMonths: termMonths,
        employmentStatus: client.employment.status,
        employer: client.employment.employer,
        occupation: client.employment.occupation,
        notes: notes || null,
      });
      setSubmitted(application);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit the application.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="panel issuance-success">
        <div className="transfer-success-head">
          <span className="transfer-success-icon"><Check size={24} /></span>
          <div><h2>Application submitted</h2><p>Application submitted to Personal Lending Department for review.</p></div>
        </div>
        <div className="transfer-result-grid">
          <div className="transfer-result-card"><small>Application ID</small><strong>#{submitted.id}</strong></div>
          <div className="transfer-result-card"><small>Product</small><strong>{humanize(submitted.productType)}</strong></div>
          <div className="transfer-result-card"><small>Requested amount</small><strong>{money(submitted.requestedAmount, 'CAD')}</strong></div>
          <div className="transfer-result-card"><small>Interest rate</small><strong>{submitted.annualInterestRate.toFixed(2)}%</strong></div>
          {submitted.repaymentTermMonths && <div className="transfer-result-card"><small>Repayment term</small><strong>{submitted.repaymentTermMonths} months</strong></div>}
          <div className="transfer-result-card"><small>Status</small><strong>{humanize(submitted.status)}</strong></div>
          <div className="transfer-result-card"><small>Application date</small><strong>{dateLabel(submitted.applicationDate)}</strong></div>
        </div>
        <p className="transfer-note">This application remains pending approval. No loan or line of credit has been issued. Approved applications will appear as active accounts in a future phase.</p>
        <div className="transfer-actions"><button className="button-secondary" type="button" onClick={onDone}><ArrowLeft size={15} />Back to products</button></div>
      </section>
    );
  }

  return (
    <section className="panel issuance-form">
      <div className="panel-heading"><div><h2><Banknote size={20} />Apply for {humanize(productType)}</h2><p>Applications are submitted for review and do not issue credit immediately.</p></div><button className="icon-button" type="button" onClick={onDone} aria-label="Back to products"><ArrowLeft size={18} /></button></div>
      <div className="transfer-form">
        <div className="transfer-row">
          <label><span>Customer</span><input className="profile-input" value={`${client.firstName} ${client.lastName} · Client #${client.id}`} readOnly /></label>
          <label><span>Product type</span><input className="profile-input" value={humanize(productType)} readOnly /></label>
        </div>
        <div className="transfer-row">
          <label><span>Requested amount (CAD)</span><input className="profile-input" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={requestedAmount} onChange={e => setRequestedAmount(e.target.value)} /></label>
          <label><span>Fictional annual interest rate (%)</span><input className="profile-input" type="number" min="0" step="0.01" inputMode="decimal" placeholder="e.g. 7.5" value={annualInterestRate} onChange={e => setAnnualInterestRate(e.target.value)} /></label>
        </div>
        <div className="transfer-row">
          <label><span>Purpose</span><input className="profile-input" placeholder="e.g. Home renovation" value={purpose} onChange={e => setPurpose(e.target.value)} /></label>
          {isLoan
            ? <label><span>Repayment term (months)</span><input className="profile-input" type="number" min="1" step="1" inputMode="numeric" placeholder="e.g. 60" value={repaymentTermMonths} onChange={e => setRepaymentTermMonths(e.target.value)} /></label>
            : <label><span>Application date</span><input className="profile-input" value={dateLabel(new Date().toISOString().slice(0, 10))} readOnly /></label>}
        </div>
        <div className="transfer-row">
          <label><span>Employment status</span><input className="profile-input" value={humanize(client.employment.status)} readOnly /></label>
          <label><span>Employer</span><input className="profile-input" value={client.employment.employer ?? 'Not provided'} readOnly /></label>
        </div>
        <label className="full-width-field"><span>Notes (optional)</span><textarea className="profile-input" rows={3} placeholder="Additional context for the lending review" value={notes} onChange={e => setNotes(e.target.value)} /></label>

        {error && <p className="filter-error" role="alert">{error}</p>}
        <div className="transfer-actions">
          <button className="button-secondary" type="button" onClick={onDone}>Cancel</button>
          <button className="button-primary" type="button" onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit application'}</button>
        </div>
        <p className="transfer-note">No real credit eligibility, contribution room or regulatory suitability is assessed in this fictional simulation.</p>
      </div>
    </section>
  );
}
