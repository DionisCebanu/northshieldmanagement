import { useEffect, useState } from 'react';
import { ShieldCheck, Smartphone, MessageSquare, ChevronDown } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { useCallSession } from '@/contexts/call-session-context';
import { useCustomerAuth } from '@/contexts/customer-auth-context';
function mask(phone: string) { return `••• ••• ${phone.replace(/\D/g, '').slice(-4)}`; }
export function CustomerAuthBar() {
  const { session } = useCallSession();
  const { workspace } = useClient();
  const { auth, history, sendApp, sendSms, verifySms, respondToApp } = useCustomerAuth();
  const [expanded, setExpanded] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [now, setNow] = useState(Date.now());
  const active = ['connected', 'hold', 'consulting'].includes(session.status) && session.customerId !== null;
  const matching = workspace?.client.id === session.customerId ? workspace.client : null;
  const phones = matching ? [matching.contact.mobilePhone, matching.contact.homePhone].filter((p): p is string => !!p) : [];
  useEffect(() => { setPhone(''); setCode(''); setExpanded(false); }, [session.customerId]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!active) return null;
  const seconds = auth.startedAt ? Math.max(0, 300 - Math.floor((now - auth.startedAt) / 1000)) : 0;

  return <>
    <section className="ns-auth-bar" aria-label="Customer authentication">
    <div className="ns-auth-heading"><span><ShieldCheck size={18} /> Customer authentication <strong className={`ns-auth-status ns-auth-${auth.status}`}>{auth.status === 'verified' ? 'Verified' : auth.status === 'pending' ? 'Pending' : 'Not verified'}</strong></span><button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>Authentication options <ChevronDown size={16}/></button></div>
    {expanded && <div className="ns-auth-body">
      <p>Authenticate the active caller: <strong>{session.customerName}</strong>. Demo only — no real SMS or push request is sent.</p>
      <div className="ns-auth-actions">
        <div className="ns-auth-card"><h4><Smartphone size={17}/> Mobile app approval</h4><p>Send an approval request to the registered banking app.</p><button type="button" disabled={auth.status === 'pending' || auth.status === 'verified'} onClick={sendApp}>Send approval request</button></div>
        <div className="ns-auth-card"><h4><MessageSquare size={17}/> SMS passcode</h4><label htmlFor="ns-auth-phone">Registered phone</label><select id="ns-auth-phone" value={phone} onChange={e => setPhone(e.target.value)}><option value="">Select a phone</option>{phones.map(p => <option key={p} value={p}>{mask(p)}</option>)}</select><button type="button" disabled={!phone || auth.status === 'pending' || auth.status === 'verified'} onClick={() => { sendSms(phone); setCode(''); }}>Send SMS passcode</button></div>
      </div>
      {auth.status === 'pending' && <div className="ns-auth-pending"><strong>Pending {auth.method === 'app' ? 'app approval' : 'SMS verification'}</strong> · Expires in {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}
        {auth.method === 'app' ? <div className="ns-auth-inline"><button type="button" onClick={() => respondToApp(true)}>Simulate customer approval</button><button type="button" onClick={() => respondToApp(false)}>Simulate decline</button></div> : <div className="ns-auth-inline"><label htmlFor="ns-auth-code">Demo OTP: 123456</label><input id="ns-auth-code" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,6))}/><button type="button" disabled={code.length !== 6} onClick={() => { verifySms(code); setCode(''); }}>Verify code</button><small>Attempts: {auth.attempts}/3</small></div>}
      </div>}
      {auth.status !== 'idle' && auth.status !== 'pending' && <p role="status">Result: <strong>{auth.status}</strong>. {auth.status !== 'verified' ? 'You may send another request.' : 'Caller authenticated for this simulated call.'}</p>}
      {history.length > 0 && <details><summary>Authentication history ({history.length})</summary><ul>{history.slice(0,8).map(h => <li key={h.id}>{new Date(h.at).toLocaleString()} — {h.method === 'app' ? 'App approval' : 'SMS OTP'}: {h.outcome}</li>)}</ul></details>}
    </div>}
  </section>;
  </>
}