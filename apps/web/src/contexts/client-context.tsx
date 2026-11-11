import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigation } from 'react-router';
import { getClientWorkspace, updateClientProfile } from '@/services/clientService';
import { setCardStatus } from '@/services/cardService';
import { createDispute as createDisputeService, type CreateDisputeInput } from '@/services/disputeService';
import { respondToOffer as respondToOfferService } from '@/services/offerService';
import { addNote as addNoteService, type AddNoteInput } from '@/services/noteService';
import { clientProfile } from '@/config/client-profile';
import type { CardStatus, CardType, Client, ClientWorkspace, OfferStatus } from '@/lib/banking-types';

type ClientState = {
  workspace: ClientWorkspace | null;
  loading: boolean;
  error: string | null;
  selectClient: (id: number) => Promise<void>;
  reloadWorkspace: () => Promise<void>;
  updateClient: (updates: Partial<Client>) => Promise<void>;
  updateCardStatus: (cardId: number, cardType: CardType, status: CardStatus) => Promise<void>;
  createDispute: (input: CreateDisputeInput) => Promise<void>;
  respondToOffer: (offerId: number, status: OfferStatus) => Promise<void>;
  addNote: (input: AddNoteInput) => Promise<void>;
};
const ClientContext = createContext<ClientState | null>(null);

export function ClientProvider({ initialWorkspace, initialError, children }: { initialWorkspace: ClientWorkspace | null; initialError: string | null; children: ReactNode }) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  async function loadWorkspace(id: number, showLoading: boolean) {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      setWorkspace(await getClientWorkspace(id));
    } catch {
      setWorkspace(null);
      setError('We could not load this customer. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  // Re-hydrate from localStorage after mount so saved profile edits and card
  // status changes appear without a full reload. Runs once on mount.
  useEffect(() => {
    void loadWorkspace(clientProfile.clientId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectClient(id: number) {
    await loadWorkspace(id, true);
  }

  async function reloadWorkspace() {
    await loadWorkspace(clientProfile.clientId, false);
  }

  async function updateClient(updates: Partial<Client>) {
    if (!workspace) return;
    try {
      const updated = await updateClientProfile(workspace.client.id, updates);
      setWorkspace(prev => (prev ? { ...prev, client: updated } : prev));
    } catch {
      setError('We could not save the customer changes. Please try again.');
    }
  }

  async function updateCardStatus(cardId: number, cardType: CardType, status: CardStatus) {
    if (!workspace) return;
    const override = await setCardStatus(workspace.client.id, cardId, cardType, status);
    setWorkspace(prev => (prev
      ? { ...prev, cards: prev.cards.map(card => (card.id === cardId && card.cardType === cardType ? { ...card, ...override } : card)) }
      : prev));
  }

  async function createDispute(input: CreateDisputeInput) {
    if (!workspace) return;
    try {
      const dispute = await createDisputeService({ ...input, clientId: workspace.client.id });
      setWorkspace(prev => (prev ? { ...prev, disputes: [dispute, ...prev.disputes] } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not create the dispute. Please try again.');
    }
  }

  async function respondToOffer(offerId: number, status: OfferStatus) {
    if (!workspace) return;
    try {
      const updated = await respondToOfferService(workspace.client.id, offerId, status);
      setWorkspace(prev => (prev ? { ...prev, offers: prev.offers.map(offer => (offer.id === offerId ? updated : offer)) } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not update the offer. Please try again.');
    }
  }

  async function addNote(input: AddNoteInput) {
    if (!workspace) return;
    try {
      const note = await addNoteService({ ...input, clientId: workspace.client.id });
      setWorkspace(prev => (prev ? { ...prev, notes: [note, ...prev.notes] } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not save the note. Please try again.');
    }
  }

  return (
    <ClientContext.Provider value={{ workspace, error, loading: loading || navigation.state === 'loading', selectClient, reloadWorkspace, updateClient, updateCardStatus, createDispute, respondToOffer, addNote }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) throw new Error('Customer components must be inside ClientProvider.');
  return context;
}
