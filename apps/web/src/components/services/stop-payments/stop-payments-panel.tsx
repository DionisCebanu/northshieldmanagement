import { useEffect, useState } from 'react';
import { StopChequePayment } from './stop-cheque-payment';
import { PadStopPayment } from './pad-stop-payment';
import { CardStopPayment } from './card-stop-payment';
import { useClient } from '@/contexts/client-context';
import { useCallSession } from '@/contexts/call-session-context';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import type { ClientWorkspace } from '@/lib/banking-types';
import {
  readStopPayments,
  createStopPayment,
  cancelStopPayment,
  type StopPayment,
  type StopType,
} from '@/services/stopPaymentService';

const labels = {
  cheque: 'Stop cheque payment',
  pad: 'Stop pre-authorized debit',
  card: 'Online card purchase restriction',
};

export function StopPaymentsPanel({ initialService }: { initialService: string }) {
  const { workspace } = useClient();

  if (!workspace) {
    return <p>Select a customer first.</p>;
  }

  return (
    <CustomerStopPayments
      key={`${workspace.client.id}-${initialService}`}
      workspace={workspace}
      initialService={initialService}
    />
  );
}

function CustomerStopPayments({ workspace, initialService }: {
  workspace: ClientWorkspace;
  initialService: string;
}) {
  const customerId = workspace.client.id;
  const { session } = useCallSession();
  const { auth } = useCustomerAuth();
  const [type, setType] = useState<StopType>('cheque');
  const [historyOnly, setHistoryOnly] = useState(initialService === 'Stop payment history');
  const [productId, setProductId] = useState('');
  const [transactionName, setTransactionName] = useState('');
  const [payee, setPayee] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [requests, setRequests] = useState<StopPayment[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState('');
  const [loaded, setLoaded] = useState(false);

  const verified = (
    ['connected', 'hold', 'consulting'].includes(session.status) &&
    session.customerId === customerId &&
    auth.customerId === customerId &&
    auth.status === 'verified' &&
    session.startedAt !== null &&
    auth.startedAt !== null &&
    auth.startedAt >= session.startedAt
  );

  useEffect(() => {
    if (initialService === 'Stop pre-authorized debit') {
      setType('pad');
    } else if (initialService === 'Online card payment servicing') {
      setType('card');
    }
  }, [initialService]);

  useEffect(() => {
    if (!verified) {
      setRequests([]);
      setLoaded(false);
      clearForm();
      setCancelId('');
      setMessage('');
      setError('');
      return;
    }

    try {
      setRequests(readStopPayments(customerId));
      setLoaded(true);
    } catch {
      setError('Unable to load stop payment history.');
    }
  }, [customerId, verified, session.startedAt]);

  // Only show eligible products belonging to the selected customer.
  const products: { id: number; label: string; currency: string }[] = [];

  if (type === 'card') {
    for (const card of workspace.cards) {
      if (card.status === 'ACTIVE') {
        products.push({
          id: card.id,
          label: `${card.cardType} •••• ${card.cardNumber.slice(-4)}`,
          currency: card.currency,
        });
      }
    }
  } else {
    for (const account of workspace.accounts) {
      const eligible = account.product.category === 'CHEQUING' ||
        (type === 'pad' && account.product.category === 'SAVINGS');

      if (account.status === 'ACTIVE' && eligible) {
        products.push({
          id: account.id,
          label: `${account.product.name} •••• ${account.accountNumber.slice(-4)}`,
          currency: account.currency,
        });
      }
    }
  }

  function clearForm() {
    setProductId('');
    setPayee('');
    setTransactionName('');
    setChequeNumber('');
    setAmount('');
    setPaymentDate('');
    setRecurring(false);
    setReason('');
    setConfirmed(false);
  }

  function submit() {
    if (!verified || !loaded || !confirmed) {
      return;
    }

    const product = products.find(item => item.id === Number(productId));

    if (!product) {
      setError('Select an eligible product.');
      return;
    }

    try {
      const updated = createStopPayment(customerId, {
        type,
        productId: product.id,
        productLabel: product.label,
        currency: product.currency,
        payee: type === 'card' ? '' : payee.trim(),
        chequeNumber: type === 'cheque' ? chequeNumber.trim() : '',
        amount,
        transactionName: type === 'card' ? transactionName.trim() : '',
        paymentDate: type === 'card' ? '' : paymentDate,
        recurring: type === 'pad' && recurring,
        reason: reason.trim(),
      });

      setRequests(updated);
      clearForm();
      setMessage('Demo request created successfully.');
      setError('');
    } catch (cause) {
      setMessage('');
      setError(cause instanceof Error ? cause.message : 'Request failed.');
    }
  }

  function cancelRequest(id: string) {
    if (!verified || !loaded) {
      return;
    }

    try {
      setRequests(cancelStopPayment(customerId, id));
      setCancelId('');
      setMessage('Demo request cancelled.');
      setError('');
    } catch (cause) {
      setMessage('');
      setError(cause instanceof Error ? cause.message : 'Cancellation failed.');
    }
  }

  return (
    <section className="stop-payments-panel">
      <h2>Stop payments</h2>
      <p>Customer #{customerId} · Fictional banking simulation</p>
      {!verified ? (
        <p className="stop-payments-notice">Authenticate the selected customer on the active call.</p>
      ) : (
        <>
          <p className="stop-payments-notice">Customer verified for this call.</p>
          <div className="stop-payments-actions">
            <button type="button" onClick={() => setHistoryOnly(false)}>New request</button>
            <button type="button" onClick={() => setHistoryOnly(true)}>History</button>
          </div>
          {!historyOnly && (
            <div className="stop-payments-form">
              <label>Service
                <select value={type} onChange={event => {
                  setType(event.target.value as StopType);
                  clearForm();
                  setError('');
                  setMessage('');
                }}>
                  <option value="cheque">Stop cheque payment</option>
                  <option value="pad">Stop pre-authorized debit</option>
                  <option value="card">Online card purchase restriction</option>
                </select>
              </label>
              <label>{type === 'card' ? 'Card' : 'Account'}
                <select value={productId} onChange={event => setProductId(event.target.value)}>
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.label}</option>
                  ))}
                </select>
              </label>
              {products.length === 0 && <p>No eligible products.</p>}
              {type === 'cheque' && (
                <StopChequePayment
                  payee={payee}
                  setPayee={setPayee}
                  chequeNumber={chequeNumber}
                  setChequeNumber={setChequeNumber}
                  amount={amount}
                  setAmount={setAmount}
                  paymentDate={paymentDate}
                  setPaymentDate={setPaymentDate}
                />
              )}
              {type === 'pad' && (
                <PadStopPayment
                  payee={payee}
                  setPayee={setPayee}
                  amount={amount}
                  setAmount={setAmount}
                  paymentDate={paymentDate}
                  setPaymentDate={setPaymentDate}
                  recurring={recurring}
                  setRecurring={setRecurring}
                />
              )}
              {type === 'card' && (
                <CardStopPayment
                  transactionName={transactionName}
                  setTransactionName={setTransactionName}
                  amount={amount}
                  setAmount={setAmount}
                />
              )}
              <label>Servicing reason
                <textarea value={reason} onChange={event => setReason(event.target.value)} />
              </label>
              <label className="stop-payments-checkbox">
                <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
                Customer confirmed the request and understands this is a simulation.
              </label>
              <button type="button" disabled={!loaded || !confirmed || !productId || !reason.trim()} onClick={submit}>
                Submit request
              </button>
            </div>
          )}
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
          <h3>Stop payment history</h3>
          {loaded && requests.length === 0 && <p>No requests recorded.</p>}
          {requests.map(request => (
            <article className="stop-payments-history-record" key={request.id}>
              <strong>{labels[request.type]} · {request.status}</strong>
              <p>{request.productLabel}</p>
              {request.type === 'card' ? (
                <p>
                  {request.transactionName || 'Transaction name not recorded'}
                  {request.amount && ` · ${request.amount} ${request.currency}`}
                </p>
              ) : (
                <p>{request.payee}</p>
              )}
              {request.type !== 'card' && (
                <p>{request.amount} {request.currency} · {request.paymentDate} · {request.recurring ? 'Recurring' : 'One-time'}</p>
              )}
              {request.type === 'cheque' && <p>Cheque #{request.chequeNumber}</p>}
              <p>{request.reason}</p>
              <small>Created {new Date(request.createdAt).toLocaleString()} · {request.employee}</small>
              {request.cancelledAt && (
                <small>Cancelled {new Date(request.cancelledAt).toLocaleString()} · {request.cancelledBy}</small>
              )}
              {request.status === 'Active' && (
                cancelId === request.id ? (
                  <div className="stop-payments-actions">
                    <button type="button" onClick={() => cancelRequest(request.id)}>Confirm cancellation</button>
                    <button type="button" onClick={() => setCancelId('')}>Keep request</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setCancelId(request.id)}>Cancel request</button>
                )
              )}
            </article>
          ))}
        </>
      )}
      <small>Demo only. No payment network or banking system is contacted.</small>
    </section>
  );
}
