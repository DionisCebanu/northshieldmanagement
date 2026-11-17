import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Search, X } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { searchCustomers, type CustomerSearchField, type CustomerSearchResult } from '@/services/customerSearchService';

const fields: { value: CustomerSearchField; label: string }[] = [
  { value: 'name', label: 'First name / last name' },
  { value: 'dateOfBirth', label: 'Date of birth' },
  { value: 'clientId', label: 'Client ID' },
  { value: 'accountNumber', label: 'Full account number' },
  { value: 'debitCard', label: 'Full debit card number' },
  { value: 'creditCard', label: 'Full credit card number' },
];

export function CustomerSearchModal({ onClose }: { onClose: () => void }) {
  const { selectClient, activeClientId } = useClient();
  const [field, setField] = useState<CustomerSearchField>('name');
  const [value, setValue] = useState('');
  const [results, setResults] = useState<CustomerSearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => { firstInput.current?.focus(); }, []);
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) { if (event.key === 'Escape' && !busy) onClose(); }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [busy, onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = ++requestId.current;
    setError(null);
    setResults(null);
    setBusy(true);
    try {
      const matches = await searchCustomers(field, value);
      if (current === requestId.current) setResults(matches);
    } catch (cause) {
      if (current === requestId.current) setError(cause instanceof Error ? cause.message : 'Search failed.');
    } finally {
      if (current === requestId.current) setBusy(false);
    }
  }

  async function openCustomer(id: number) {
    setBusy(true);
    setError(null);
    try {
      await selectClient(id);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to open customer.');
    } finally { setBusy(false); }
  }

  return <div className="modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="modal-panel customer-search-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-search-title">
      <div className="modal-head"><div className="modal-icon"><Search size={19}/></div><div><h2 id="customer-search-title">Search customers</h2><p>Find a fictional customer by identity, account or full card number.</p></div><button className="icon-button" aria-label="Close customer search" onClick={onClose} disabled={busy}><X size={20}/></button></div>
      <form className="customer-search-form" onSubmit={submit}>
        <label htmlFor="customer-search-field">Search by</label>
        <select id="customer-search-field" value={field} onChange={event => { setField(event.target.value as CustomerSearchField); setValue(''); setResults(null); setError(null); }}>
          {fields.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label htmlFor="customer-search-value">{fields.find(option => option.value === field)?.label}</label>
        <input ref={firstInput} id="customer-search-value" type={field === 'dateOfBirth' ? 'date' : 'text'} inputMode={field === 'name' || field === 'dateOfBirth' ? 'text' : 'numeric'} autoComplete="off" value={value} onChange={event => setValue(event.target.value)} placeholder={field === 'name' ? 'Enter first name, last name or both' : 'Enter the complete value'} />
        <button className="button-primary" type="submit" disabled={busy || !value.trim()}><Search size={15}/>{busy ? 'Working…' : 'Search'}</button>
      </form>
      {error && <p className="customer-search-error" role="alert">{error}</p>}
      {results && <div className="customer-search-results" aria-live="polite">
        <h3>{results.length} {results.length === 1 ? 'customer' : 'customers'} found</h3>
        {results.length === 0 ? <p>No matching customers. Try another search.</p> : <div className="customer-search-result-list">
          {results.map(customer => <div className="customer-search-result" key={customer.id}>
            <div><strong>{customer.firstName} {customer.lastName}</strong><span>Client ID: {customer.id} · DOB: {customer.dateOfBirth} · {customer.status}</span></div>
            <button type="button" className="button-secondary" disabled={busy || customer.id === activeClientId} onClick={() => void openCustomer(customer.id)}>{customer.id === activeClientId ? 'Current customer' : 'Open customer'}</button>
          </div>)}
        </div>}
      </div>}
    </section>
  </div>;
}
