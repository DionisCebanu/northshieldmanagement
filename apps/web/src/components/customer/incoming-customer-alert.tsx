import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneIncoming } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useClient } from '@/contexts/client-context';
import { demoSettings } from '@/config/demo-settings';

const sessionKey = 'northshield-demo-incoming-customer-shown';
type ConnectionStatus = 'connecting' | 'connected' | 'error';

export function IncomingCustomerAlert() {
  const { enabled, delayMs, customerId, showOncePerSession } = demoSettings.incomingCustomerAlert;
  const { selectClient } = useClient();
  const navigate = useNavigate();
  const selectClientRef = useRef(selectClient);
  selectClientRef.current = selectClient;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (showOncePerSession && window.sessionStorage.getItem(sessionKey) === '1') return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      if (showOncePerSession) window.sessionStorage.setItem(sessionKey, '1');
      setOpen(true);
      setStatus('connecting');
      setError(null);
      // The simulated call is routed automatically; no Accept/Decline action.
      void selectClientRef.current(customerId)
        .then(() => { if (!cancelled) setStatus('connected'); })
        .catch((cause: unknown) => {
          if (cancelled) return;
          setError(cause instanceof Error ? cause.message : 'Unable to load the customer.');
          setStatus('error');
        });
    }, delayMs);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [enabled, delayMs, customerId, showOncePerSession]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function openCustomerProfile() {
    if (status !== 'connected') return;
    setOpen(false);
    void navigate('/profile');
  }

  if (!open) return null;
  return (
    <div className="incoming-alert-overlay" role="presentation">
      <section className="incoming-alert-panel" role="dialog" aria-modal="true" aria-labelledby="incoming-alert-title" aria-describedby="incoming-alert-description">
        <div className="incoming-alert-top"><span>NorthShield · Agent Workspace</span><span className="incoming-alert-demo">SIMULATED INTERACTION</span></div>
        <div className="incoming-alert-icon"><PhoneIncoming size={30} /></div>
        <h2 id="incoming-alert-title">Incoming customer interaction</h2>
        <p id="incoming-alert-description">This fictional inbound interaction is automatically routed to your workspace.</p>
        <div className="incoming-alert-details">
          <div><span>Customer</span>
            <strong>{customerId === 1 ? 'Dionis Cebanu' : 'Not Authenticated Customer'}</strong>
          </div>
          <div><span>Client ID</span><strong>{customerId}</strong></div>
          <div><span>Channel</span><strong>Inbound · Demo</strong></div>
          <div><span>Status</span><strong aria-live="polite">{status === 'connecting' ? 'Connecting…' : status === 'connected' ? 'Connected automatically' : 'Customer unavailable'}</strong></div>
        </div>
        {error && <p className="incoming-alert-error" role="alert">{error}</p>}
        <div className="incoming-alert-actions">
          <button type="button" className="incoming-alert-open" onClick={openCustomerProfile} disabled={status !== 'connected'}><Phone size={17} />{status === 'connecting' ? 'Connecting customer…' : 'Open customer profile'}</button>
        </div>
        <small>Portfolio demonstration · No real calls or customer information</small>
      </section>
    </div>
  );
}
