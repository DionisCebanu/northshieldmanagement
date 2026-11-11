import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { getPaymentsByClientId } from '@/services/billPaymentService';
import { money, maskedAccount, dateLabel } from '@/lib/banking-format';
import { StatusBadge } from '@/components/customer/status-badge';
import type { ResolvedBillPayment, PaymentStatus } from '@/lib/banking-types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'POSTED', label: 'Posted' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

export function PaymentHistory() {
  const { workspace } = useClient();
  const [payments, setPayments] = useState<ResolvedBillPayment[]>([]);
  const [payeeFilter, setPayeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const clientId = workspace?.client.id ?? 0;
  useEffect(() => { if (clientId) void getPaymentsByClientId(clientId).then(setPayments); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  if (!workspace) return null;

  const payeeIds = Array.from(new Set(payments.map(p => p.payeeId)));
  const filtered = payments.filter(payment => {
    if (statusFilter !== 'all' && payment.status !== statusFilter) return false;
    if (payeeFilter !== 'all' && String(payment.payeeId) !== payeeFilter) return false;
    if (fromDate && payment.paymentDate < fromDate) return false;
    if (toDate && payment.paymentDate > toDate) return false;
    return true;
  });

  return (
    <section className="panel">
      <div className="panel-heading"><div><h2><History size={18} />Payment history</h2><p>All bill payment records for this customer. Historical records are kept when payees are deleted.</p></div></div>
      <div className="transaction-filters">
        <label><span>Payee</span>
          <select value={payeeFilter} onChange={e => setPayeeFilter(e.target.value)}>
            <option value="all">All payees</option>
            {payeeIds.map(id => { const p = payments.find(x => x.payeeId === id); return <option key={id} value={String(id)}>{p?.biller.name ?? `Payee #${id}`}</option>; })}
          </select>
        </label>
        <label><span>Status</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label><span>From date</span><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
        <label><span>To date</span><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></label>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>Payment ID</th><th>Date</th><th>Payee</th><th>Bill account</th><th>Source account</th><th className="amount-cell">Amount</th><th>Status</th><th>Reference</th></tr></thead>
          <tbody>
            {filtered.map(payment => (
              <tr key={payment.id}>
                <td>#{payment.id}</td>
                <td>{dateLabel(payment.paymentDate)}</td>
                <td><strong>{payment.biller.name}</strong></td>
                <td>{payment.payee ? maskedAccount(payment.payee.billAccountNumber) : 'Payee deleted'}</td>
                <td>{payment.sourceAccount ? payment.sourceAccount.product.name : '—'}</td>
                <td className="amount-cell">{money(payment.amount, payment.currency)}</td>
                <td><StatusBadge status={payment.status as PaymentStatus} /></td>
                <td><span className="account-reference">{payment.confirmationReference}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="inline-empty">No payments match the selected filters.</div>}
      </div>
      <div className="table-footer"><span>{filtered.length} of {payments.length} payments</span><span>History is isolated per customer</span></div>
    </section>
  );
}
