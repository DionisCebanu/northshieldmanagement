import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { CardTile } from '@/components/cards/card-tile';
import { CardDetailPanel } from '@/components/cards/card-detail-panel';
import { PinManagementModal } from '@/components/cards/pin-management-modal';
import { CardStatusModal } from '@/components/cards/card-status-modal';
import type { CardType, ResolvedCard } from '@/lib/banking-types';
import type { CardAction } from '@/lib/card-actions';

type Tab = CardType;

export function CardsWorkspace() {
  const { workspace, updateCardStatus } = useClient();
  const [tab, setTab] = useState<Tab>('DEBIT');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [modal, setModal] = useState<{ card: ResolvedCard; action: CardAction } | null>(null);
  const [pinCardId, setPinCardId] = useState<number | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  if (!workspace) return null;
  const cards = workspace.cards.filter(card => card.cardType === tab);
  const selectedCard = workspace.cards.find(card => card.id === selectedCardId) ?? null;

  function selectTab(next: Tab) {
    setTab(next);
    setSelectedCardId(null);
    setPinCardId(null);
  }

  async function confirmAction() {
    if (!modal) return;
    try {
      await updateCardStatus(modal.card.id, modal.card.cardType, modal.action.status);
      setModal(null);
      setModalError(null);
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Could not update the card status.');
    }
  }

  return (
    <section className="cards-workspace">
      <div className="cards-tabs" role="tablist" aria-label="Card types">
        <button role="tab" aria-selected={tab === 'DEBIT'} className={`cards-tab ${tab === 'DEBIT' ? 'cards-tab-active' : ''}`} onClick={() => selectTab('DEBIT')}><CreditCard size={15} />Debit cards <span className="count-badge">{workspace.cards.filter(c => c.cardType === 'DEBIT').length}</span></button>
        <button role="tab" aria-selected={tab === 'CREDIT'} className={`cards-tab ${tab === 'CREDIT' ? 'cards-tab-active' : ''}`} onClick={() => selectTab('CREDIT')}><CreditCard size={15} />Credit cards <span className="count-badge">{workspace.cards.filter(c => c.cardType === 'CREDIT').length}</span></button>
      </div>

      {cards.length === 0 ? (
        <div className="inline-empty"><strong>No {tab.toLowerCase()} cards</strong><p>This customer does not own any {tab.toLowerCase()} cards.</p></div>
      ) : (
        <div className="card-tile-grid">
          {cards.map(card => <CardTile key={card.id} card={card} selected={card.id === selectedCardId} onSelect={() => setSelectedCardId(card.id)} />)}
        </div>
      )}

      {selectedCard && <CardDetailPanel card={selectedCard} onClose={() => setSelectedCardId(null)} onPinManagement={() => setPinCardId(selectedCard.id)} onAction={action => { setModalError(null); setModal({ card: selectedCard, action }); }} />}

      {pinCardId !== null && workspace.cards.find(card => card.id === pinCardId) && (
        <PinManagementModal
          key={`${workspace.client.id}:${pinCardId}`}
          card={workspace.cards.find(card => card.id === pinCardId)!}
          client={workspace.client}
          onClose={() => setPinCardId(null)}
        />
      )}
      {modal && <CardStatusModal card={modal.card} action={modal.action} error={modalError} onConfirm={confirmAction} onCancel={() => { setModal(null); setModalError(null); }} />}
    </section>
  );
}
