import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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
  activeClientId: number;
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
  const [activeClientId, setActiveClientId] = useState(initialWorkspace?.client.id ?? clientProfile.clientId);
  const requestVersion = useRef(0);
  const selectedClientRef = useRef(initialWorkspace?.client.id ?? clientProfile.clientId);

  async function loadWorkspace(id: number, showLoading: boolean): Promise<void> {
    const version = ++requestVersion.current;
    if (showLoading) {
      setLoading(true);
      setWorkspace(null); // Never show the previous customer's data during a switch.
    }
    setError(null);
    try {
      const next = await getClientWorkspace(id);
      if (!next) throw new Error('Customer not found.');
      if (version !== requestVersion.current) return; // Ignore stale responses.
      selectedClientRef.current = id;
      setActiveClientId(id);
      setWorkspace(next);
    } catch (err) {
      if (version !== requestVersion.current) return;
      setWorkspace(null);
      const message = err instanceof Error ? err.message : 'Could not load the customer.';
      setError(message);
      throw err;
    } finally {
      if (version === requestVersion.current && showLoading) setLoading(false);
    }
  }

  // Read customer-specific browser overrides after SSR hydration.
  useEffect(() => {
    void loadWorkspace(selectedClientRef.current, false).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectClient(id: number): Promise<void> {
    if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid customer ID.');
    await loadWorkspace(id, true);
  }

  async function reloadWorkspace(): Promise<void> {
    await loadWorkspace(selectedClientRef.current, false);
  }

  async function updateClient(updates: Partial<Client>) {
    if (!workspace) throw new Error('No customer selected.');
    const clientId = workspace.client.id;
    try {
      const updated = await updateClientProfile(clientId, updates);
      setWorkspace(prev => (prev?.client.id === clientId ? { ...prev, client: updated } : prev));
    } catch {
      setError('We could not save the customer changes. Please try again.');
      throw new Error('We could not save the customer changes. Please try again.');
    }
  }

  async function updateCardStatus(cardId: number, cardType: CardType, status: CardStatus) {
    if (!workspace) throw new Error('No customer selected.');
    const clientId = workspace.client.id;
    const override = await setCardStatus(clientId, cardId, cardType, status);
    setWorkspace(prev => (prev?.client.id === clientId
      ? { ...prev, cards: prev.cards.map(card => (card.id === cardId && card.cardType === cardType ? { ...card, ...override } : card)) }
      : prev));
  }

  async function createDispute(input: CreateDisputeInput) {
    if (!workspace) throw new Error('No customer selected.');
    const clientId = workspace.client.id;
    try {
      const dispute = await createDisputeService({ ...input, clientId });
      setWorkspace(prev => (prev?.client.id === clientId ? { ...prev, disputes: [dispute, ...prev.disputes] } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not create the dispute. Please try again.');
      throw err;
    }
  }

  async function respondToOffer(offerId: number, status: OfferStatus) {
    if (!workspace) throw new Error('No customer selected.');
    const clientId = workspace.client.id;
    try {
      const updated = await respondToOfferService(clientId, offerId, status);
      setWorkspace(prev => (prev?.client.id === clientId ? { ...prev, offers: prev.offers.map(offer => (offer.id === offerId ? updated : offer)) } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not update the offer. Please try again.');
      throw err;
    }
  }

  async function addNote(input: AddNoteInput) {
    if (!workspace) throw new Error('No customer selected.');
    const clientId = workspace.client.id;
    try {
      const note = await addNoteService({ ...input, clientId });
      setWorkspace(prev => (prev?.client.id === clientId ? { ...prev, notes: [note, ...prev.notes] } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not save the note. Please try again.');
      throw err;
    }
  }

  return (
    <ClientContext.Provider value={{ workspace, activeClientId, error, loading: loading || navigation.state === 'loading', selectClient, reloadWorkspace, updateClient, updateCardStatus, createDispute, respondToOffer, addNote }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) throw new Error('Customer components must be inside ClientProvider.');
  return context;
}
