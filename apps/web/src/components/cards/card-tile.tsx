import { CreditCard, ChevronRight } from 'lucide-react';
import type { ResolvedCard } from '@/lib/banking-types';
import { maskedCardNumber, expiryLabel } from '@/lib/banking-format';
import { StatusBadge } from '@/components/customer/status-badge';

export function CardTile({ card, selected, onSelect }: { card: ResolvedCard; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" className={`card-tile ${selected ? 'card-tile-selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
      <div className="card-tile-top">
        <span className="card-tile-icon"><CreditCard size={20} /></span>
        <StatusBadge status={card.status} />
      </div>
      <h3>{card.product.name}</h3>
      <span className="masked-number">{maskedCardNumber(card.cardNumber)}</span>
      <div className="card-tile-meta">
        <span>{card.cardholderName}</span>
        <span>Expires {expiryLabel(card.expiryDate)}</span>
      </div>
      <div className="card-tile-foot">
        <span>{card.currency}</span>
        <ChevronRight size={15} />
      </div>
    </button>
  );
}
