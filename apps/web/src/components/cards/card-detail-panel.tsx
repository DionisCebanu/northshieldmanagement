import { X, CreditCard, Snowflake, ShieldAlert, Ban, Lock, Unlock } from 'lucide-react';
import type { ResolvedCard } from '@/lib/banking-types';
import { money, maskedCardNumber, expiryLabel, dateLabel, humanize } from '@/lib/banking-format';
import { StatusBadge } from '@/components/customer/status-badge';
import { availableActions, type CardAction } from '@/lib/card-actions';

const ACTION_ICONS: Record<string, typeof Snowflake> = {
  FROZEN: Snowflake,
  ACTIVE: Unlock,
  LOST: ShieldAlert,
  STOLEN: ShieldAlert,
  FRAUD: ShieldAlert,
  CLOSED: Ban,
};

export function CardDetailPanel({ card, onClose, onAction }: { card: ResolvedCard; onClose: () => void; onAction: (action: CardAction) => void }) {
  const isDebit = card.cardType === 'DEBIT';
  const actions = availableActions(card.status);

  const fields = [
    { label: 'Cardholder name', value: card.cardholderName },
    { label: 'Card number', value: maskedCardNumber(card.cardNumber) },
    { label: 'Card type', value: humanize(card.cardType) },
    { label: 'Currency', value: card.currency },
    { label: 'Expiration date', value: expiryLabel(card.expiryDate) },
    { label: 'Date opened', value: dateLabel(card.dateOpened) },
    { label: 'Date closed', value: card.dateClosed ? dateLabel(card.dateClosed) : 'Not applicable — active card' },
    { label: 'Status', value: <StatusBadge status={card.status} /> },
  ];

  return (
    <section className="panel card-detail">
      <div className="panel-heading">
        <div><h2><CreditCard size={20} />{card.product.name}</h2><p>{card.product.description}</p></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close card details"><X size={20} /></button>
      </div>
      <dl className="profile-fields account-detail-fields">
        {fields.map(field => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}
      </dl>

      {isDebit ? (
        <div className="card-financials">
          <div className="card-financial-row">
            <small>Linked account</small>
            <strong>{card.linkedAccount.product.name}</strong>
            <span>{maskedCardNumber(card.linkedAccount.accountNumber)} · {humanize(card.linkedAccount.product.category)}</span>
          </div>
          <div className="card-financial-row">
            <small>Linked account balance</small>
            <strong>{money(card.linkedAccount.balance, card.linkedAccount.currency)}</strong>
            <span>Debit card uses the linked account balance</span>
          </div>
        </div>
      ) : (
        <div className="card-financials">
          <div className="card-financial-row">
            <small>Credit limit</small>
            <strong>{money(card.creditLimit, card.currency)}</strong>
          </div>
          <div className="card-financial-row">
            <small>Outstanding balance</small>
            <strong>{money(card.outstandingBalance, card.currency)}</strong>
          </div>
          <div className="card-financial-row">
            <small>Available credit</small>
            <strong className="positive-amount">{money(card.creditLimit - card.outstandingBalance, card.currency)}</strong>
          </div>
          <div className="card-financial-row">
            <small>Annual fee</small>
            <strong>{money(card.annualFee, card.currency)}</strong>
            <span>Inherited from {card.product.name}</span>
          </div>
        </div>
      )}

      <div className="card-actions">
        <div className="card-actions-label">
          {card.status === 'CLOSED' ? <Lock size={15} /> : <ShieldAlert size={15} />}
          <span>{card.status === 'CLOSED' ? 'This card is closed and cannot be reactivated.' : 'Card servicing'}</span>
        </div>
        <div className="card-actions-grid">
          {actions.map(action => {
            const Icon = ACTION_ICONS[action.status] ?? Ban;
            return (
              <button key={action.status} type="button" className={`button-${action.tone} card-action`} onClick={() => onAction(action)}>
                <Icon size={14} />{action.label}
              </button>
            );
          })}
          {actions.length === 0 && <span className="card-actions-empty">No actions available for this card.</span>}
        </div>
      </div>
    </section>
  );
}
