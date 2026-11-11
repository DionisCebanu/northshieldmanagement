import { AlertTriangle, X } from 'lucide-react';
import type { ResolvedCard } from '@/lib/banking-types';
import { actionDescription, type CardAction } from '@/lib/card-actions';
import { maskedCardNumber } from '@/lib/banking-format';

export function CardStatusModal({ card, action, error, onConfirm, onCancel }: { card: ResolvedCard; action: CardAction; error: string | null; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="card-modal-title" onClick={onCancel}>
      <div className="modal-panel" onClick={event => event.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-icon"><AlertTriangle size={20} /></span>
          <div>
            <h2 id="card-modal-title">{action.label}</h2>
            <p>{card.product.name} · {maskedCardNumber(card.cardNumber)}</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Cancel"><X size={18} /></button>
        </div>
        <p className="modal-body">{actionDescription(action.status)}</p>
        {error && <p className="filter-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button className="button-secondary" type="button" onClick={onCancel}>Cancel</button>
          <button className={`button-${action.tone}`} type="button" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
