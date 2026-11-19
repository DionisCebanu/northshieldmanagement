import type { CardType } from '@/lib/banking-types';

export type PinAction = 'MAIL_NEW_PIN' | 'RESET_ATTEMPTS';
export type PinRequest = {
  id: string; clientId: number; cardId: number; cardType: CardType;
  action: PinAction; status: 'REQUESTED' | 'COMPLETED';
  createdAt: string; requestedBy: string;
};
type PinState = { incorrectAttempts: number; history: PinRequest[] };
const KEY = 'northshield:pin-management:v1:';
const storageKey = (clientId: number, cardType: CardType, cardId: number) => `${KEY}${clientId}:${cardType}:${cardId}`;
function read(clientId: number, cardType: CardType, cardId: number): PinState {
  if (typeof window === 'undefined') return { incorrectAttempts: 0, history: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(clientId, cardType, cardId)) || 'null') as Partial<PinState> | null;
    return { incorrectAttempts: Number.isInteger(parsed?.incorrectAttempts) && (parsed?.incorrectAttempts ?? 0) >= 0 ? parsed!.incorrectAttempts! : 0, history: Array.isArray(parsed?.history) ? parsed.history : [] };
  } catch { return { incorrectAttempts: 0, history: [] }; }
}
export function getPinState(clientId: number, cardType: CardType, cardId: number): PinState { return read(clientId, cardType, cardId); }
export function submitPinAction(clientId: number, cardType: CardType, cardId: number, action: PinAction, requestedBy = 'Demo agent'): PinRequest {
  if (typeof window === 'undefined') throw new Error('PIN management is only available in the browser demo.');
  const state = read(clientId, cardType, cardId);
  if (action === 'MAIL_NEW_PIN' && state.history.some(item => item.action === 'MAIL_NEW_PIN' && item.status === 'REQUESTED')) {
    throw new Error('A replacement PIN mailer is already pending for this card.');
  }
  const request: PinRequest = { id: `PIN-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`, clientId, cardId, cardType, action, status: action === 'RESET_ATTEMPTS' ? 'COMPLETED' : 'REQUESTED', createdAt: new Date().toISOString(), requestedBy };
  const next: PinState = { incorrectAttempts: action === 'RESET_ATTEMPTS' ? 0 : state.incorrectAttempts, history: [request, ...state.history] };
  window.localStorage.setItem(storageKey(clientId, cardType, cardId), JSON.stringify(next));
  return request;
}
