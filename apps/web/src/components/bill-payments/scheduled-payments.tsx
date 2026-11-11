import { useState, useEffect } from 'react';
import { CalendarClock, Ban } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { getScheduledPaymentsByClientId, cancelScheduledPayment } from '@/services/billPaymentService';
import { money, maskedAccount, dateLabel } from '@/lib/banking-format';
import { StatusBadge } from '@/components/customer/status-badge';
import type { ResolvedBillPayment } from '@/lib/banking-types';

export function ScheduledPayments() {
  const { workspace } = useClient();
  const [payments, setPayments] = useState<ResolvedBillPayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const clientId = workspace?.client.id ?? 0;
  async function reload() { setPayments(await getScheduledPaymentsByClientId(clientId)); }
  useEffect(() => { if (clientId) void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  if (!workspace) return null;

  async function handleCancel(id: number) {
    setError(null);
    try {
      await cancelScheduledPayment(id);
      await reload();
      setCancellingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel the payment.');
      setCancellingId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading"><div><h2><CalendarClock size={18} />Scheduled payments</h2><p>Future-dated payments remain SCHEDULED and can be cancelled before completion.</p></div></div>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Scheduled date</th><th>Payee</th><th>Bill account</th><th>Source account</th><th className="amount-cell">Amount</th><th>Reference</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{dateLabel(payment.scheduledDate ?? payment.paymentDate)}</td>
                <td><strong>{payment.biller.name}</strong></td>
                <td>{payment.payee ? maskedAccount(payment.payee.billAccountNumber) : '—'}</td>
                <td>{payment.sourceAccount ? payment.sourceAccount.product.name : '—'}</td>
                <td className="amount-cell">{money(payment.amount, payment.currency)}</td>
                <td><span className="account-reference">{payment.confirmationReference}</span></td>
                <td><StatusBadge status={payment.status} /></td>
                <td>
                  {cancellingId === payment.id
                    ? <span className="inline-edit"><button className="button-secondary card-action" type="button" onClick={() => handleCancel(payment.id)}>Confirm</button><button className="icon-button" type="button" onClick={() => setCancellingId(null)} aria-label="Cancel">✕</button></span>
                    : <button className="button-secondary card-action" type="button" onClick={() => setCancellingId(payment.id)}><Ban size={13} />Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <div className="inline-empty">No scheduled payments for this customer.</div>}
      </div>
      {error && <p className="filter-error" role="alert">{error}</p>}
      <div className="table-footer"><span>{payments.length} scheduled</span><span>Balances are not deducted when scheduling</span></div>
    </section>
  );
}
