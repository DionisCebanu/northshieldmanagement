import { useState } from 'react';
import { Check, ArrowLeft, CreditCard } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { issueCreditCard } from '@/services/cardService';
import creditCardProducts from '@/data/creditcards.json';
import { AddressConfirmation } from '@/components/products/address-confirmation';
import { money, maskedCardNumber } from '@/lib/banking-format';
import type { ResolvedCard } from '@/lib/banking-types';

export function CreditCardIssuance({ onDone }: { onDone: () => void }) {
  const { workspace, reloadWorkspace } = useClient();
  const [productId, setProductId] = useState<number>(creditCardProducts[0].id);
  const [creditLimit, setCreditLimit] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [paymentAccountId, setPaymentAccountId] = useState<number | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState('MAIL');
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [issued, setIssued] = useState<ResolvedCard | null>(null);

  if (!workspace) return null;
  const client = workspace.client;
  const product = creditCardProducts.find(item => item.id === productId) ?? creditCardProducts[0];
  const paymentAccounts = workspace.accounts.filter(account => account.status === 'ACTIVE' && account.currency === currency && (account.product.category === 'CHEQUING' || account.product.category === 'SAVINGS'));

  async function submit() {
    setError(null);
    if (!addressConfirmed) { setError('Confirm the customer mailing address before issuing the card.'); return; }
    const limit = Number(creditLimit);
    if (!Number.isFinite(limit) || limit <= 0) { setError('Enter a positive credit limit.'); return; }
    setSubmitting(true);
    try {
      const card = await issueCreditCard({
        clientId: client.id,
        productId,
        cardholderName: `${client.firstName} ${client.lastName}`,
        currency,
        creditLimit: limit,
        deliveryMethod,
      });
      await reloadWorkspace();
      setIssued(card);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not issue the credit card.');
    } finally {
      setSubmitting(false);
    }
  }

  if (issued) {
    const credit = issued as ResolvedCard & { creditLimit: number; product: { name: string } };
    return (
      <section className="panel issuance-success">
        <div className="transfer-success-head">
          <span className="transfer-success-icon"><Check size={24} /></span>
          <div><h2>Credit card issued</h2><p>The new credit card is active with a $0 outstanding balance.</p></div>
        </div>
        <div className="transfer-result-grid">
          <div className="transfer-result-card"><small>Card product</small><strong>{credit.product.name}</strong></div>
          <div className="transfer-result-card"><small>Card number</small><strong>{maskedCardNumber(issued.cardNumber)}</strong></div>
          <div className="transfer-result-card"><small>Credit limit</small><strong>{money(credit.creditLimit, issued.currency)}</strong></div>
          <div className="transfer-result-card"><small>Available credit</small><strong className="positive-amount">{money(credit.creditLimit, issued.currency)}</strong></div>
          <div className="transfer-result-card"><small>Annual fee</small><strong>{money(product.annualFee, issued.currency)}</strong></div>
          <div className="transfer-result-card"><small>Rewards</small><strong>{product.rewardType}</strong></div>
        </div>
        <div className="transfer-actions"><button className="button-secondary" type="button" onClick={onDone}><ArrowLeft size={15} />Back to products</button></div>
      </section>
    );
  }

  return (
    <section className="panel issuance-form">
      <div className="panel-heading"><div><h2><CreditCard size={20} />Issue credit card</h2><p>Available credit equals the credit limit. Outstanding balance starts at $0.</p></div><button className="icon-button" type="button" onClick={onDone} aria-label="Back to products"><ArrowLeft size={18} /></button></div>
      <div className="transfer-form">
        <div className="transfer-row">
          <label><span>Customer</span><input className="profile-input" value={`${client.firstName} ${client.lastName} · Client #${client.id}`} readOnly /></label>
          <label><span>Credit card product</span>
            <select className="profile-input" value={productId} onChange={e => setProductId(Number(e.target.value))}>
              {creditCardProducts.map(item => <option key={item.id} value={item.id}>{item.name} · {money(item.annualFee, item.currency)}/yr</option>)}
            </select>
          </label>
        </div>
        <div className="transfer-row">
          <label><span>Credit limit ({currency})</span><input className="profile-input" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} /></label>
          <label><span>Currency</span>
            <select className="profile-input" value={currency} onChange={e => { setCurrency(e.target.value); setPaymentAccountId(null); }}>
              <option value="CAD">CAD</option><option value="USD">USD</option>
            </select>
          </label>
        </div>
        <div className="transfer-row">
          <label><span>Delivery method</span>
            <select className="profile-input" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)}>
              <option value="MAIL">Mail</option><option value="BRANCH_PICKUP">Branch pickup</option>
            </select>
          </label>
          <label><span>Linked payment account (optional)</span>
            <select className="profile-input" value={paymentAccountId ?? ''} onChange={e => setPaymentAccountId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">No linked payment account</option>
              {paymentAccounts.map(account => <option key={account.id} value={account.id}>{account.product.name} · {money(account.balance, account.currency)}</option>)}
            </select>
          </label>
        </div>

        <div className="product-terms-note">
          <strong>{product.name}</strong>
          <span>{product.description}</span>
          <span>Annual fee {money(product.annualFee, product.currency)} · {product.rewardType}</span>
        </div>

        <AddressConfirmation client={client} confirmed={addressConfirmed} onStateChange={setAddressConfirmed} />

        {error && <p className="filter-error" role="alert">{error}</p>}
        <div className="transfer-actions">
          <button className="button-secondary" type="button" onClick={onDone}>Cancel</button>
          <button className="button-primary" type="button" onClick={submit} disabled={submitting}>{submitting ? 'Issuing…' : 'Issue credit card'}</button>
        </div>
        <p className="transfer-note">No CVV, PIN or real payment card information is stored. A fictional masked card number is generated.</p>
      </div>
    </section>
  );
}
