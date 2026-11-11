import { useState } from 'react';
import { Form, Link, useSearchParams } from 'react-router';
import { SlidersHorizontal, Search, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { transactionTypes } from '@/data/transaction-types';
import { humanize, maskedAccount } from '@/lib/banking-format';
import { isDisputeEligible, DISPUTE_CATEGORIES } from '@/services/disputeService';
import type { DisputeCategory } from '@/lib/banking-types';

export function TransactionHistory() {
  const { workspace, createDispute } = useClient();
  const [params] = useSearchParams();
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<DisputeCategory | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!workspace) return null;
  const account = params.get('account') ?? 'all';
  const type = params.get('type') ?? 'all';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const invalidDates = Boolean(from && to && from > to);
  const filtered = invalidDates ? [] : workspace.transactions.filter(transaction => (account === 'all' || transaction.accountId === Number(account)) && (type === 'all' || transaction.type === type) && (!from || transaction.date.slice(0, 10) >= from) && (!to || transaction.date.slice(0, 10) <= to));

  function toggleSelect(id: number) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }
  function startSelectionMode() {
    setSelecting(true);
    setSelectedIds([]);
    setSuccess(null);
    setError(null);
  }
  function cancelSelection() {
    setSelecting(false);
    setSelectedIds([]);
  }
  function openModal() {
    setError(null);
    setReason('');
    setCategory('');
    setModalOpen(true);
  }
  async function submitDispute() {
    if (!selectedIds.length) { setError('Select at least one eligible transaction.'); return; }
    if (!reason.trim()) { setError('Provide a reason for the dispute.'); return; }
    if (!category) { setError('Select a dispute category.'); return; }
    try {
      await createDispute({ clientId: workspace!.client.id, transactionIds: selectedIds, reason, category: category as DisputeCategory });
      const count = selectedIds.length;
      setModalOpen(false);
      setSelecting(false);
      setSelectedIds([]);
      setSuccess(`Dispute created for ${count} transaction${count > 1 ? 's' : ''}. View it under Fraud & Security.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not create the dispute.');
    }
  }

  return <section className="panel"><div className="panel-heading"><div><h2>Transaction history</h2><p>All activity for the selected customer, newest first</p></div><div className="dispute-actions">{!selecting ? <button className="button-dispute" type="button" onClick={startSelectionMode}><ShieldAlert size={15} />Dispute transaction</button> : <button className="button-secondary" type="button" onClick={cancelSelection}><X size={14} />Cancel</button>}</div></div><Form method="get" key={params.toString()} className="transaction-filters"><label>Account<select name="account" defaultValue={account}><option value="all">All accounts</option>{workspace.accounts.map(item => <option value={item.id} key={item.id}>{item.product.name} · {maskedAccount(item.accountNumber)}</option>)}</select></label><label>Transaction type<select name="type" defaultValue={type}><option value="all">All transaction types</option>{transactionTypes.map(item => <option key={item} value={item}>{humanize(item)}</option>)}</select></label><label>From date<input aria-label="From date" type="date" name="from" defaultValue={from} /></label><label>To date<input aria-label="To date" type="date" name="to" defaultValue={to} /></label><button className="button-primary" type="submit"><Search size={15} />Apply</button><Link to="/transactions" className="icon-button reset-filter" aria-label="Reset filters"><RotateCcw size={17} /></Link></Form>{selecting && <div className="dispute-bar"><span><strong>{selectedIds.length}</strong> selected · Only pre-authorized debits, online, ATM and in-store purchases are eligible</span><button className="button-dispute" type="button" onClick={openModal} disabled={!selectedIds.length}><ShieldAlert size={14} />Start dispute</button></div>}{success && <p className="dispute-success" role="status">{success}</p>}{invalidDates && <p className="filter-error" role="alert">The end date must be on or after the start date.</p>}<div className="results-heading"><span><strong>{filtered.length}</strong> matching transactions</span><span>Incoming <i className="legend-dot" /> Outgoing <i className="legend-dot outgoing-dot" /></span></div><TransactionTable transactions={filtered} accounts={workspace.accounts} showStatus selectable={selecting} selectedIds={selectedIds} onToggleSelect={toggleSelect} isEligible={t => isDisputeEligible(t.type)} /><div className="table-footer"><span>Showing {filtered.length} of {workspace.transactions.length} transactions</span><span>Sample history · Not used to calculate balances</span></div>{modalOpen && <div className="modal-overlay" role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}><div className="modal-panel dispute-modal"><div className="modal-head"><span className="modal-icon dispute-modal-icon"><ShieldAlert size={20} /></span><div><h2>Start a dispute</h2><p>{selectedIds.length} transaction{selectedIds.length > 1 ? 's' : ''} selected</p></div><button className="icon-button" aria-label="Close" type="button" onClick={() => setModalOpen(false)}><X size={18} /></button></div><div className="dispute-modal-body"><label className="dispute-field">Dispute category<select className="profile-input" value={category} onChange={e => setCategory(e.target.value as DisputeCategory)}><option value="">Select a category</option>{DISPUTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label><label className="dispute-field">Reason<textarea className="dispute-textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe the reason for this dispute..." rows={4} /></label>{error && <p className="field-error" role="alert">{error}</p>}</div><div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="button-dispute" type="button" onClick={submitDispute}>Submit dispute</button></div></div></div>}</section>;
}
