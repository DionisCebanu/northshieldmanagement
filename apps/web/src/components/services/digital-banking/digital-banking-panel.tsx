import { useEffect, useState } from 'react';
import { useClient } from '@/contexts/client-context';
import { useCallSession } from '@/contexts/call-session-context';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
import loginHistory from '@/data/digitalLoginHistory.json';
import {
  applyDigitalAction,
  readDigitalProfile,
  type DigitalAction,
  type DigitalProfile,
} from '@/services/digitalBankingService';

const labels: Record<DigitalAction, string> = {
  password: 'Request password reset',
  otp: 'Unlock OTP',
  suspend: 'Suspend digital access',
  restore: 'Restore digital access',
};

export function DigitalBankingPanel({ initialService }: { initialService: string }) {
  const { workspace } = useClient();
  const customerId = workspace?.client.id;

  if (customerId === undefined) {
    return <p>Select a customer to continue.</p>;
  }

  return (
    <CustomerDigitalPanel
      key={`${customerId}-${initialService}`}
      customerId={customerId}
      initialService={initialService}
    />
  );
}

function CustomerDigitalPanel({ customerId, initialService }: {
  customerId: number;
  initialService: string;
}) {
  const { session } = useCallSession();
  const { auth } = useCustomerAuth();
  const [profile, setProfile] = useState<DigitalProfile | null>(null);
  const [action, setAction] = useState<DigitalAction | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    try {
      setProfile(readDigitalProfile(customerId));
    } catch {
      setError('Unable to load digital banking data.');
    }
  }, [customerId]);

  useEffect(() => {
    if (!verified) {
      setAction(null);
      setReason('');
    }
  }, [verified]);

  function submit() {
    if (!verified || !action || !reason.trim()) return;

    try {
      const updated = applyDigitalAction(customerId, action, reason);
      setProfile(updated);
      setMessage(`${labels[action]} completed in the demo.`);
      setError('');
      setAction(null);
      setReason('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed.');
    }
  }

  if (!profile) return <p role="status">{error || 'Loading digital banking…'}</p>;

  const actions: DigitalAction[] = [
    'password',
    'otp',
    profile.suspended ? 'restore' : 'suspend',
  ];

  return (
    <section className="ns-db" aria-label="Digital banking services">
      <header className="ns-db-header">
        <div>
          <h2>Digital banking</h2>
          <p>Customer #{customerId} · {initialService}</p>
        </div>
        <span className="ns-db-status">
          {profile.suspended ? 'Suspended' : 'Active'}
        </span>
      </header>
      <p className="ns-db-notice">
        {verified ? 'Customer verified for this call.' : 'Authenticate the selected customer on the active call to continue.'}
      </p>
      <div className="ns-db-grid">
        {actions.map(item => (
          <article className="ns-db-card" key={item}>
            <h3>{labels[item]}</h3>
            <p>{item === 'otp' ? `Failed attempts: ${profile.otpAttempts}` : item === 'password' ? 'Simulate a secure reset request. No password is displayed.' : 'Manage online and mobile banking access.'}</p>
            <button
              type="button"
              disabled={!verified || (item === 'otp' && !profile.otpAttempts) || (item === 'password' && profile.suspended)}
              onClick={() => {
                setAction(item);
                setReason('');
                setMessage('');
                setError('');
              }}
            >
              Select
            </button>
          </article>
        ))}
      </div>
      {action && verified && (
        <div className="ns-db-confirm">
          <h3>{labels[action]}</h3>
          <label htmlFor="ns-db-reason">Servicing reason</label>
          <textarea id="ns-db-reason" value={reason} onChange={event => setReason(event.target.value)} />
          <div className="ns-db-buttons">
            <button type="button" disabled={!reason.trim()} onClick={submit}>Confirm request</button>
            <button type="button" onClick={() => setAction(null)}>Cancel</button>
          </div>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      <h3>Login history</h3>
      {verified ? (
        <div className="ns-db-table">
          <table>
            <thead><tr><th>Date</th><th>Device</th><th>Channel</th><th>Outcome</th></tr></thead>
            <tbody>
              {loginHistory.filter(entry => entry.customerId === customerId).map(entry => (
                <tr key={entry.at}>
                  <td>{new Date(entry.at).toLocaleString()}</td>
                  <td>{entry.device}</td>
                  <td>{entry.channel}</td>
                  <td>{entry.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p>Verification required to view login history.</p>}
      <h3>Servicing history</h3>
      {verified && profile.history.length > 0 ? (
        <ul>
          {profile.history.map(entry => (
            <li key={entry.id}>
              {labels[entry.action]} · {new Date(entry.at).toLocaleString()} · {entry.employee} · {entry.reason}
            </li>
          ))}
        </ul>
      ) : <p>{verified ? 'No requests recorded.' : 'Verification required.'}</p>}
      <small>Fictional demo only. No real access changes or notifications.</small>
    </section>
  );
}
