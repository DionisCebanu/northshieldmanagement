import { useEffect, useState } from 'react';
import { PhoneOff, PhoneForwarded, PhoneCall, Pause, Play, ArrowLeftRight, Headphones } from 'lucide-react';
import { departments, useCallSession } from '@/contexts/call-session-context';

function duration(ms: number) { const seconds = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
export function CallControlBar() {
  const { session, hold, resume, consult, endConsult, transfer, disconnect, finishAfterCall } = useCallSession();
  const [now, setNow] = useState(Date.now());
  const [menu, setMenu] = useState<'none' | 'transfer' | 'contact'>('none');
  const [selected, setSelected] = useState<string>(departments[0]);
  useEffect(() => { if (session.status === 'idle' || session.status === 'after-call') return; const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, [session.status]);
  useEffect(() => { setMenu('none'); }, [session.status]);
  if (session.status === 'idle') return null;
  const active = session.status !== 'after-call';
  const elapsed = session.startedAt ? (session.endedAt ?? now) - session.startedAt : 0;
  return <section className="call-control-bar" aria-label="Simulated call controls">
    <div className="call-control-main">
      <div className="call-control-identity"><Headphones size={19}/><div><strong>{session.customerName || `Customer #${session.customerId}`}</strong><small>Inbound · {session.status === 'after-call' ? 'After-call work' : session.status === 'consulting' ? `Second line: ${session.department}` : session.status === 'hold' ? 'Customer on hold' : 'Connected'}</small></div></div>
      <div className="call-control-clock" aria-label="Call duration">{duration(elapsed)}</div>
      <div className="call-control-actions">
        {session.status === 'after-call' ? <button type="button" onClick={finishAfterCall}>Finish after-call work</button> : <>
          {session.status === 'consulting' ? <button type="button" onClick={endConsult}><PhoneCall size={16}/> Return to customer</button> : <button type="button" onClick={session.status === 'hold' ? resume : hold}>{session.status === 'hold' ? <Play size={16}/> : <Pause size={16}/>} {session.status === 'hold' ? 'Resume' : 'Hold'}</button>}
          <button type="button" onClick={() => setMenu(menu === 'transfer' ? 'none' : 'transfer')}><ArrowLeftRight size={16}/> Transfer</button>
          <button type="button" disabled={session.status === 'consulting'} onClick={() => setMenu(menu === 'contact' ? 'none' : 'contact')}><PhoneForwarded size={16}/> Contact</button>
          <button type="button" className="call-control-end" onClick={disconnect}><PhoneOff size={16}/> Disconnect</button>
        </>}
      </div>
    </div>
    {active && menu !== 'none' && <div className="call-control-menu">
      <label htmlFor="call-department">{menu === 'transfer' ? 'Transfer customer to' : 'Call department on second line'}</label>
      <select id="call-department" value={selected} onChange={event => setSelected(event.target.value)}>{departments.map(name => <option key={name} value={name}>{name}</option>)}</select>
      <button type="button" onClick={() => { if (menu === 'transfer') transfer(selected); else consult(selected); }}>{menu === 'transfer' ? 'Complete simulated transfer' : 'Start second-line consultation'}</button>
      <button type="button" onClick={() => setMenu('none')}>Cancel</button>
    </div>}
    {session.status === 'consulting' && <div className="call-control-hint">Original customer remains on the first line. End the second-line consultation to return to the customer.</div>}
    {session.status === 'after-call' && <div className="call-control-hint">Interaction ended{session.department ? ` · Transferred to ${session.department}` : ''}. Finish notes before returning to ready state.</div>}
  </section>;
}
