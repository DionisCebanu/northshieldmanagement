import { humanize } from '@/lib/banking-format';
export function StatusBadge({ status }: { status: string }) {
  const danger = ['LOST', 'STOLEN', 'FRAUD', 'CLOSED'].includes(status);
  const info = status === 'FROZEN';
  const positive = status === 'ACTIVE' || status === 'POSTED';
  const cls = danger ? 'status-danger' : info ? 'status-info' : positive ? 'status-positive' : 'status-neutral';
  return <span className={`status-badge ${cls}`}><span />{humanize(status)}</span>;
}
