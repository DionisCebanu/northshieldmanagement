import { Gift, Check, X } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { money, dateLabel } from '@/lib/banking-format';

export function CustomerOffers() {
  const { workspace, respondToOffer } = useClient();
  if (!workspace) return null;
  const offers = workspace.offers;
  if (!offers.length) return null;
  return <section className="panel"><div className="panel-heading"><div><h2>Customer offers</h2><p>Pre-approved products available for this customer</p></div></div><div className="offers-grid">{offers.map(offer => <div key={offer.id} className={`offer-card offer-${offer.status.toLowerCase()}`}><div className="offer-top"><span className="offer-icon"><Gift size={18} /></span><span className={`offer-status offer-status-${offer.status.toLowerCase()}`}>{offer.status}</span></div><h3>{offer.product}</h3><div className="offer-amount">{money(offer.amount, offer.currency)}</div><p className="offer-desc">{offer.description}</p><div className="offer-expiry">Expires {dateLabel(offer.expiry)}{offer.respondedAt ? ` · Responded ${dateLabel(offer.respondedAt)}` : ''}</div>{offer.status === 'PENDING' && <div className="offer-actions"><button className="button-primary" type="button" onClick={() => respondToOffer(offer.id, 'ACCEPTED')}><Check size={14} />Accept</button><button className="button-secondary" type="button" onClick={() => respondToOffer(offer.id, 'DECLINED')}><X size={14} />Decline</button></div>}</div>)}</div></section>;
}
