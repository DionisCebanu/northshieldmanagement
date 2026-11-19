import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type CallStatus = 'idle' | 'connected' | 'hold' | 'consulting' | 'after-call';
type CallSession = { status: CallStatus; customerId: number | null; customerName: string; startedAt: number | null; endedAt: number | null; department: string | null; secondLineStartedAt: number | null };
const empty: CallSession = { status: 'idle', customerId: null, customerName: '', startedAt: null, endedAt: null, department: null, secondLineStartedAt: null };
const key = 'northshield-call-session-v1';
const departments = ['Fraud & Security', 'Credit Cards', 'Mortgages', 'Investments', 'Digital Banking Support', 'Loans & Lines of Credit'] as const;
type CallActions = { session: CallSession; startCall: (id: number, name: string) => void; hold: () => void; resume: () => void; consult: (department: string) => void; endConsult: () => void; transfer: (department: string) => void; disconnect: () => void; finishAfterCall: () => void };
const Context = createContext<CallActions | null>(null);
export { departments };
export function CallSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CallSession>(empty);
  useEffect(() => { try { const raw = sessionStorage.getItem(key); if (raw) { const saved = JSON.parse(raw) as CallSession; if (saved && ['idle','connected','hold','consulting','after-call'].includes(saved.status)) setSession(saved); } } catch { /* ignore corrupt demo data */ } }, []);
  useEffect(() => { sessionStorage.setItem(key, JSON.stringify(session)); }, [session]);
  const startCall = (customerId: number, customerName: string) => setSession(prev => prev.status !== 'idle' ? prev : { ...empty, status: 'connected', customerId, customerName, startedAt: Date.now() });
  const hold = () => setSession(prev => prev.status === 'connected' ? { ...prev, status: 'hold' } : prev);
  const resume = () => setSession(prev => prev.status === 'hold' ? { ...prev, status: 'connected' } : prev);
  const consult = (department: string) => setSession(prev => (prev.status === 'connected' || prev.status === 'hold') ? { ...prev, status: 'consulting', department, secondLineStartedAt: Date.now() } : prev);
  const endConsult = () => setSession(prev => prev.status === 'consulting' ? { ...prev, status: 'connected', department: null, secondLineStartedAt: null } : prev);
  const transfer = (department: string) => setSession(prev => (prev.status === 'connected' || prev.status === 'hold' || prev.status === 'consulting') ? { ...prev, status: 'after-call', department, secondLineStartedAt: null, endedAt: Date.now() } : prev);
  const disconnect = () => setSession(prev => (prev.status === 'connected' || prev.status === 'hold' || prev.status === 'consulting') ? { ...prev, status: 'after-call', secondLineStartedAt: null, endedAt: Date.now() } : prev);
  const finishAfterCall = () => setSession(prev => prev.status === 'after-call' ? empty : prev);
  return <Context.Provider value={{ session, startCall, hold, resume, consult, endConsult, transfer, disconnect, finishAfterCall }}>{children}</Context.Provider>;
}
export function useCallSession() { const context = useContext(Context); if (!context) throw new Error('useCallSession must be inside CallSessionProvider'); return context; }
