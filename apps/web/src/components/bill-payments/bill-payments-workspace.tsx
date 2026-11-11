import { useState } from 'react';
import { Receipt, Users, CalendarClock, History } from 'lucide-react';
import { PayBill } from '@/components/bill-payments/pay-bill';
import { PayeesManager } from '@/components/bill-payments/payees-manager';
import { ScheduledPayments } from '@/components/bill-payments/scheduled-payments';
import { PaymentHistory } from '@/components/bill-payments/payment-history';

type Tab = 'pay' | 'payees' | 'scheduled' | 'history';

const TABS: { key: Tab; label: string; icon: typeof Receipt }[] = [
  { key: 'pay', label: 'Pay Bills', icon: Receipt },
  { key: 'payees', label: 'Manage Payees', icon: Users },
  { key: 'scheduled', label: 'Scheduled Payments', icon: CalendarClock },
  { key: 'history', label: 'Payment History', icon: History },
];

export function BillPaymentsWorkspace() {
  const [tab, setTab] = useState<Tab>('pay');
  return (
    <section className="cards-workspace">
      <div className="cards-tabs" role="tablist" aria-label="Bill payments">
        {TABS.map(t => { const Icon = t.icon; return (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`cards-tab ${tab === t.key ? 'cards-tab-active' : ''}`} onClick={() => setTab(t.key)}><Icon size={15} />{t.label}</button>
        ); })}
      </div>
      {tab === 'pay' && <PayBill />}
      {tab === 'payees' && <PayeesManager />}
      {tab === 'scheduled' && <ScheduledPayments />}
      {tab === 'history' && <PaymentHistory />}
    </section>
  );
}
