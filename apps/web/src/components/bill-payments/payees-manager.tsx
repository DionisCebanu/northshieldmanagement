import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, Check, Building2 } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { searchBillPaymentCompanies, addPayee, updatePayeeNickname, deletePayee, validateBillAccountNumber, getPayeesByClientId } from '@/services/billPaymentService';
import { dateLabel, maskedAccount } from '@/lib/banking-format';
import type { BillPaymentCompany, ResolvedPayee } from '@/lib/banking-types';

export function PayeesManager() {
  const { workspace } = useClient();
  const [payees, setPayees] = useState<ResolvedPayee[]>([]);
  const [query, setQuery] = useState('');
  const [selectedBiller, setSelectedBiller] = useState<BillPaymentCompany | null>(null);
  const [billAccountNumber, setBillAccountNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ResolvedPayee | null>(null);

  const clientId = workspace?.client.id ?? 0;

  async function reload() { setPayees(await getPayeesByClientId(clientId)); }
  useEffect(() => { if (clientId) void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  if (!workspace) return null;

  const results = query ? searchBillPaymentCompanies(query) : [];

  function pickBiller(biller: BillPaymentCompany) {
    setSelectedBiller(biller);
    setQuery(biller.name);
    setFieldError(null);
  }

  async function handleAdd() {
    setError(null);
    setFieldError(null);
    if (!selectedBiller) { setError('Search and select a biller.'); return; }
    const validation = validateBillAccountNumber(selectedBiller.id, billAccountNumber);
    if (validation) { setFieldError(validation); return; }
    try {
      await addPayee({ clientId, billerId: selectedBiller.id, billAccountNumber, nickname: nickname || null });
      await reload();
      setSelectedBiller(null);
      setQuery('');
      setBillAccountNumber('');
      setNickname('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the payee.');
    }
  }

  async function handleSaveNickname(payee: ResolvedPayee) {
    try {
      await updatePayeeNickname(payee.id, editNickname || null);
      await reload();
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the payee.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletePayee(deleteTarget.id);
      await reload();
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the payee.');
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Manage payees</h2><p>Register a biller for this customer. Payees are saved locally.</p></div></div>

      <div className="bill-form">
        <div className="biller-search-field">
          <label><span>Search biller</span></label>
          <div className="biller-search">
            <Search size={16} />
            <input className="biller-search-input" placeholder="Type a company name" value={query} onChange={e => { setQuery(e.target.value); setSelectedBiller(null); }} />
          </div>
          {query && !selectedBiller && (
            <div className="biller-dropdown">
              {results.length === 0
                ? <span className="biller-empty">No company matches “{query}”.</span>
                : results.map(biller => (
                  <button key={biller.id} type="button" className="biller-option" onClick={() => pickBiller(biller)}>
                    <Building2 size={15} /><span>{biller.name}</span><small>{biller.category}</small>
                  </button>
                ))}
            </div>
          )}
        </div>
        <div className="transfer-row">
          <label><span>Bill account number {selectedBiller && <small className="hint">({selectedBiller.accountNumberFormat})</small>}</span><input className="profile-input" value={billAccountNumber} onChange={e => setBillAccountNumber(e.target.value)} /></label>
          <label><span>Nickname (optional)</span><input className="profile-input" value={nickname} onChange={e => setNickname(e.target.value)} /></label>
        </div>
        {fieldError && <p className="filter-error" role="alert">{fieldError}</p>}
        {error && <p className="filter-error" role="alert">{error}</p>}
        <div className="transfer-actions"><button className="button-primary" type="button" onClick={handleAdd}><Plus size={15} />Add payee</button></div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Biller</th><th>Category</th><th>Bill account number</th><th>Nickname</th><th>Date added</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {payees.map(payee => (
              <tr key={payee.id}>
                <td><strong>{payee.biller.name}</strong></td>
                <td>{payee.biller.category}</td>
                <td>{maskedAccount(payee.billAccountNumber)}</td>
                <td>
                  {editingId === payee.id
                    ? <span className="inline-edit"><input className="profile-input" value={editNickname} onChange={e => setEditNickname(e.target.value)} /><button className="icon-button" type="button" onClick={() => handleSaveNickname(payee)} aria-label="Save"><Check size={16} /></button><button className="icon-button" type="button" onClick={() => setEditingId(null)} aria-label="Cancel"><X size={16} /></button></span>
                    : (payee.nickname ?? '—')}
                </td>
                <td>{dateLabel(payee.dateAdded)}</td>
                <td>
                  <button className="icon-button" type="button" aria-label="Edit nickname" onClick={() => { setEditingId(payee.id); setEditNickname(payee.nickname ?? ''); }}><Pencil size={16} /></button>
                  <button className="icon-button" type="button" aria-label="Delete payee" onClick={() => setDeleteTarget(payee)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payees.length === 0 && <div className="inline-empty">No saved payees for this customer yet.</div>}
      </div>
      <div className="table-footer"><span>{payees.length} payees</span><span>Deleting a payee does not remove historical payments</span></div>

      {deleteTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setDeleteTarget(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span className="modal-icon"><Trash2 size={20} /></span>
              <div><h2>Delete payee</h2><p>{deleteTarget.biller.name} · {maskedAccount(deleteTarget.billAccountNumber)}</p></div>
              <button className="icon-button" type="button" onClick={() => setDeleteTarget(null)} aria-label="Cancel"><X size={18} /></button>
            </div>
            <p className="modal-body">This removes the payee from the customer's list. Historical payment records are kept.</p>
            <div className="modal-actions"><button className="button-secondary" type="button" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="button-primary" type="button" onClick={handleDelete}>Delete payee</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
