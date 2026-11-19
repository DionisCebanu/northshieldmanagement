import { useState } from 'react';
import { KeyRound, Mail, RotateCcw, X } from 'lucide-react';
import type { Client, ResolvedCard } from '@/lib/banking-types';
import { maskedCardNumber } from '@/lib/banking-format';
import { getPinState, submitPinAction, type PinAction, type PinRequest } from '@/services/pinManagementService';

export function PinManagementModal({ card, client, onClose }: { card: ResolvedCard; client: Client; onClose: () => void }) {
  const [action, setAction] = useState<PinAction>('MAIL_NEW_PIN');
  const [identityVerified, setIdentityVerified] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const [state, setState] = useState(() => getPinState(client.id, card.cardType, card.id));
  const [confirmation, setConfirmation] = useState<PinRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mailingAddress = [client.address.street, client.address.unit, client.address.city, client.address.province, client.address.postalCode, client.address.country].filter(Boolean).join(', ');
  const pendingMailer = state.history.some(item => item.action === 'MAIL_NEW_PIN' && item.status === 'REQUESTED');
  const canSubmit = identityVerified && (action !== 'MAIL_NEW_PIN' || addressVerified) && !(action === 'MAIL_NEW_PIN' && pendingMailer) && !saving;
  function submit() {
    if (!canSubmit) return;
    setSaving(true); setError(null);
    try {
      const result = submitPinAction(client.id, card.cardType, card.id, action);
      setState(getPinState(client.id, card.cardType, card.id));
      setConfirmation(result);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to submit request.'); }
    finally { setSaving(false); }
  }
  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-panel pin-modal" role="dialog" aria-modal="true" aria-labelledby="pin-modal-title">
        <div className="modal-head">
          <span className="modal-icon"><KeyRound size={20}/></span>
          <div><h2 id="pin-modal-title">Card PIN management</h2><p>{card.product.name} · {maskedCardNumber(card.cardNumber)}</p></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close PIN management"><X size={18}/></button>
        </div>
        {confirmation ? (
          <div className="pin-content" role="status">
            <h3>{confirmation.action === 'MAIL_NEW_PIN' ? 'PIN mailer requested' : 'Incorrect PIN attempts reset'}</h3>
            <p>{confirmation.action === 'MAIL_NEW_PIN' ? 'Demo request recorded. No physical mail was sent and no PIN was generated.' : 'Demo PIN mismatch counter reset to zero. This does not remove fraud or security restrictions.'}</p>
            <p><strong>Reference:</strong> {confirmation.id}</p>
            <button type="button" className="button-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <div className="pin-content">
            <p className="pin-disclaimer">Simulation only. Never request, display, or transmit a customer's actual PIN.</p>
            <label className="pin-option"><input type="radio" name="pin-action" checked={action === 'MAIL_NEW_PIN'} onChange={() => { setAction('MAIL_NEW_PIN'); setError(null); }}/><Mail size={17}/><span><strong>Request replacement PIN by mail</strong><small>Physical mail only · No PIN generated in this demo</small></span></label>
            <label className="pin-option"><input type="radio" name="pin-action" checked={action === 'RESET_ATTEMPTS'} onChange={() => { setAction('RESET_ATTEMPTS'); setError(null); }}/><RotateCcw size={17}/><span><strong>Reset incorrect PIN attempts</strong><small>Customer remembers the existing PIN · Counter resets to 0</small></span></label>
            {action === 'MAIL_NEW_PIN' ? <div className="pin-address"><strong>Mailing address on file</strong><p>{mailingAddress}</p>{pendingMailer && <p className="pin-warning">A replacement PIN mailer request is already pending.</p>}</div> : <div className="pin-address"><strong>Incorrect attempts in demo:</strong> {state.incorrectAttempts}<p>Resetting attempts does not unlock a card blocked for fraud, loss, or theft.</p></div>}
            <label className="pin-check"><input type="checkbox" checked={identityVerified} onChange={e => setIdentityVerified(e.target.checked)}/> I have completed the required customer identity verification.</label>
            {action === 'MAIL_NEW_PIN' && <label className="pin-check"><input type="checkbox" checked={addressVerified} onChange={e => setAddressVerified(e.target.checked)}/> I confirmed the customer's mailing address.</label>}
            {error && <p className="filter-error" role="alert">{error}</p>}
            <div className="modal-actions"><button className="button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button-primary" type="button" disabled={!canSubmit} onClick={submit}>{saving ? 'Submitting…' : action === 'MAIL_NEW_PIN' ? 'Request PIN by mail' : 'Reset attempts'}</button></div>
            <div className="pin-history"><strong>Recent PIN servicing</strong>{state.history.length === 0 ? <p>No previous requests for this card.</p> : <ul>{state.history.slice(0, 5).map(item => <li key={item.id}>{item.action === 'MAIL_NEW_PIN' ? 'PIN mailer' : 'Attempts reset'} · {item.status.toLowerCase()} · {new Date(item.createdAt).toLocaleString()}</li>)}</ul>}</div>
          </div>
        )}
      </div>
    </div>
  );
}
