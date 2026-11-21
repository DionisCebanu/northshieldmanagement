import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useCallSession } from '@/contexts/call-session-context';

type Method = 'sms' | 'app';
type Status = 'idle' | 'pending' | 'verified' | 'declined' | 'expired' | 'failed';
type RecordItem = { id: string; customerId: number; method: Method; outcome: Status; at: number };
type AuthState = { method: Method | null; status: Status; customerId: number | null; startedAt: number | null; attempts: number; phone: string | null };
const blank: AuthState = { method: null, status: 'idle', customerId: null, startedAt: null, attempts: 0, phone: null };
const KEY = 'northshield-auth-demo-v1';
const Context = createContext<{
  auth: AuthState; history: RecordItem[]; sendApp: () => void; sendSms: (phone: string) => void;
  verifySms: (code: string) => void; respondToApp: (approved: boolean) => void; reset: () => void;
} | null>(null);
export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const { session } = useCallSession();
  const activeId = session.status === 'connected' || session.status === 'hold' || session.status === 'consulting' ? session.customerId : null;
  const [saved, setSaved] = useState<{ auth: AuthState; history: RecordItem[] }>({ auth: blank, history: [] });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { try { const value = sessionStorage.getItem(KEY); if (value) { const parsed = JSON.parse(value); if (parsed && Array.isArray(parsed.history)) setSaved({ auth: parsed.auth || blank, history: parsed.history }); } } catch { /* ignore */ } setHydrated(true); }, []);
  useEffect(() => { if (hydrated) sessionStorage.setItem(KEY, JSON.stringify(saved)); }, [saved, hydrated]);
  const auth = saved.auth.customerId === activeId && activeId !== null ? saved.auth : blank;
  const history = saved.history.filter(x => x.customerId === activeId);
  function change(next: AuthState, outcome?: Status) {
    setSaved(prev => ({ auth: next, history: outcome && next.customerId !== null && next.method ? [{ id: `${Date.now()}-${Math.random()}`, customerId: next.customerId, method: next.method, outcome, at: Date.now() }, ...prev.history].slice(0, 100) : prev.history }));
  }
  function start(method: Method, phone: string | null) {
    if (activeId === null) return;
    change({ method, status: 'pending', customerId: activeId, startedAt: Date.now(), attempts: 0, phone });
  }
  function resolve(outcome: Status, attempts = auth.attempts) {
    if (auth.status !== 'pending' || !auth.startedAt) return;
    change({ ...auth, status: outcome, attempts }, outcome);
  }
  function expired() { return auth.status === 'pending' && !!auth.startedAt && Date.now() - auth.startedAt >= 300000; }
  function verifySms(code: string) {
    if (auth.method !== 'sms' || auth.status !== 'pending') return;
    if (expired()) return resolve('expired');
    if (code === '123456') return resolve('verified', auth.attempts + 1); // Fictional demo code ONLY; never use in production
    if (auth.attempts + 1 >= 3) resolve('failed', auth.attempts + 1);
    else change({ ...auth, attempts: auth.attempts + 1 });
  }
  function respondToApp(approved: boolean) {
    if (auth.method !== 'app' || auth.status !== 'pending') return;
    resolve(expired() ? 'expired' : approved ? 'verified' : 'declined');
  }
  useEffect(() => {
    if (!hydrated || saved.auth.status === 'idle') return;
    if (saved.auth.customerId !== activeId) setSaved(prev => ({ ...prev, auth: blank }));
  }, [activeId, hydrated, saved.auth.customerId, saved.auth.status]);
  useEffect(() => {
    if (auth.status !== 'pending' || !auth.startedAt) return;
    const timer = window.setInterval(() => {
      if (Date.now() - auth.startedAt! >= 300000) resolve('expired');
    }, 1000);
    return () => clearInterval(timer);
  }, [auth.status, auth.startedAt, auth.customerId]);
  return <Context.Provider value={{ auth, history, sendApp: () => start('app', null), sendSms: phone => start('sms', phone), verifySms, respondToApp, reset: () => change(blank) }}>{children}</Context.Provider>;
}
export function useCustomerAuth() { const ctx = useContext(Context); if (!ctx) throw new Error('CustomerAuthProvider is missing'); return ctx; }
