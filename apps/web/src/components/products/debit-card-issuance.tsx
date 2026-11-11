import { useState } from 'react';
import { Check, ArrowLeft, CreditCard } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { issueDebitCard } from '@/services/cardService';
import debitCardProducts from '@/data/debitcards.json';
import { AddressConfirmation } from '@/components/products/address-confirmation';
import { money, maskedCardNumber, humanize } from '@/lib/banking-format';
import type { ResolvedCard } from '@/lib/banking-types';

export function DebitCardIssuance({ onDone }: { onDone: () => void }) {
  const { workspace, reloadWorkspace } = useClient();
  const [productId, setProductId] = useState<number>(debitCardProducts[0].id);
  const [currency, setCurrency] = useState('CAD');
  const [primaryId, setPrimaryId] = useState<number | null>(null);
  const [additionalIds, setAdditionalIds] = useState<number[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState('MAIL');
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [issued, setIssued] = useState<ResolvedCard | null>(null);

  if (!workspace) return null;
  const client = workspace.client;

  // Eligible accounts: active chequing/savings owned by the customer, matching currency.
  const eligibleAccounts = workspace.accounts.filter(account =>
    account.status === 'ACTIVE' &&
    account.currency === currency &&
    (account.product.category === 'CHEQUING' || account.product.category === 'SAVINGS'),
  );

  const selectedIds = primaryId ? Array.from(new Set([primaryId, ...additionalIds])) : [];

  function toggleAdditional(id: number) {
    setError(null);
    setAdditionalIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function changeCurrency(next: string) {
    setCurrency(next);
    setPrimaryId(null);
    setAdditionalIds([]);
    setError(null);
  }

  async function submit() {
    setError(null);
    if (!addressConfirmed) { setError('Confirm the customer mailing address before issuing the card.'); return; }
    if (!primaryId) { setError('Select a primary linked account.'); return; }
    if (!selectedIds.length) { setError('Select at least one eligible linked account.'); return; }
    const invalid = selectedIds.find(id => !eligibleAccounts.some(account => account.id === id));
    if (invalid) { setError('Every linked account must be active, owned by the customer and in the same currency as the card.'); return; }
    setSubmitting(true);
    try {
      const card = await issueDebitCard({
        clientId: client.id,
        productId,
        cardholderName: `${client.firstName} ${client.lastName}`,
        currency,
        linkedAccountIds: selectedIds,
        deliveryMethod,
      });
      await reloadWorkspace();
      setIssued(card);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not issue the debit card.');
    } finally {
      setSubmitting(false);
    }
  }

  if (issued) {
    return (
      <section className="panel issuance-success">
        <div className="transfer-success-head">
          <span className="transfer-success-icon"><Check size={24} /></span>
          <div><h2>Debit card issued</h2><p>The new debit card is active and appears on the Cards page.</p></div>
        </div>
        <div className="transfer-result-grid">
          <div className="transfer-result-card"><small>Card product</small><strong>{(issued as ResolvedCard & { product: { name: string } }).product.name}</strong></div>
          <div className="transfer-result-card"><small>Card number</small><strong>{maskedCardNumber(issued.cardNumber)}</strong></div>
          <div className="transfer-result-card"><small>Cardholder</small><strong>{issued.cardholderName}</strong></div>
          <div className="transfer-result-card"><small>Currency</small><strong>{issued.currency}</strong></div>
          <div className="transfer-result-card"><small>Linked accounts</small><strong>{selectedIds.length}</strong></div>
          <div className="transfer-result-card"><small>Annual fee</small><strong>{money(0, issued.currency)}</strong></div>
        </div>
        <div className="transfer-actions"><button className="button-secondary" type="button" onClick={onDone}><ArrowLeft size={15} />Back to products</button></div>
      </section>
    );
  }

  return (
    <section className="panel issuance-form">
      <div className="panel-heading"><div><h2><CreditCard size={20} />Issue debit card</h2><p>Link one or more eligible chequing or savings accounts. Debit cards have no annual fee.</p></div><button className="icon-button" type="button" onClick={onDone} aria-label="Back to products"><ArrowLeft size={18} /></button></div>
      <div className="transfer-form">
        <div className="transfer-row">
          <label><span>Customer</span><input className="profile-input" value={`${client.firstName} ${client.lastName} · Client #${client.id}`} readOnly /></label>
          <label><span>Debit card product</span>
            <select className="profile-input" value={productId} onChange={e => setProductId(Number(e.target.value))}>
              {debitCardProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>
        </div>
        <div className="transfer-row">
          <label><span>Currency</span>
            <select className="profile-input" value={currency} onChange={e => changeCurrency(e.target.value)}>
              <option value="CAD">CAD</option><option value="USD">USD</option>
            </select>
          </label>
          <label><span>Delivery method</span>
            <select className="profile-input" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}>
              <option value="MAIL">Mail</option><option value="BRANCH_PICKUP">Branch pickup</option>
            </select>
          </label>
        </div>

        <div className="linked-accounts-block">
          <div className="card-actions-label"><span>Primary linked account</span></div>
          {eligibleAccounts.length === 0 ? (
            <p className="inline-empty">No active {currency} chequing or savings accounts are available for this customer.</p>
          ) : (
            <div className="account-pick-list">
              {eligibleAccounts.map(account => (
                <label key={account.id} className={`account-pick ${primaryId === account.id ? 'account-pick-selected' : ''}`}>
                  <input type="radio" name="primary-account" checked={primaryId === account.id} onChange={() => { setPrimaryId(account.id); setError(null); }} />
                  <div><strong>{account.product.name}</strong><span>{humanize(account.product.category)} · {money(account.balance, account.currency)}</span></div>
                </label>
              ))}
            </div>
          )}
        </div>

        {primaryId && eligibleAccounts.length > 1 && (
          <div className="linked-accounts-block">
            <div className="card-actions-label"><span>Additional linked accounts (optional)</span></div>
            <div className="account-pick-list">
              {eligibleAccounts.filter(account => account.id !== primaryId).map(account => (
                <label key={account.id} className={`account-pick ${additionalIds.includes(account.id) ? 'account-pick-selected' : ''}`}>
                  <input type="checkbox" checked={additionalIds.includes(account.id)} onChange={() => toggleAdditional(account.id)} />
                  <div><strong>{account.product.name}</strong><span>{humanize(account.product.category)} · {money(account.balance, account.currency)}</span></div>
                </label>
              ))}
            </div>
          </div>
        )}

        <AddressConfirmation client={client} confirmed={addressConfirmed} onStateChange={setAddressConfirmed} />

        {error && <p className="filter-error" role="alert">{error}</p>}
        <div className="transfer-actions">
          <button className="button-secondary" type="button" onClick={onDone}>Cancel</button>
          <button className="button-primary" type="button" onClick={submit} disabled={submitting}>{submitting ? 'Issuing…' : 'Issue debit card'}</button>
        </div>
        <p className="transfer-note">No CVV, PIN or real payment card information is stored. A fictional masked card number is generated.</p>
      </div>
    </section>
  );
}
