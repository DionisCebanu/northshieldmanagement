import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, MessageSquareText, Plus, X } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { demoEmployee } from '@/config/employee-session';
import { dateLabel, humanize } from '@/lib/banking-format';
import { isNoteActive } from '@/services/noteService';
import type { CustomerNote, NoteCategory } from '@/lib/banking-types';

const categories: { value: NoteCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'COMPLAINT', label: 'Complaint' },
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'CARD', label: 'Card' },
  { value: 'ACCOUNT', label: 'Account' },
];

function lodgedLabel(value: string): string {
  if (value.length === 10) return `${dateLabel(value)} (time not recorded)`;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(date);
}

function NoteCard({ note }: { note: CustomerNote }) {
  const active = isNoteActive(note.expiresAt);
  return <article className={`note-item ${active ? '' : 'note-item-expired'}`}>
    <div className="note-item-head"><span className="note-category">{humanize(note.category)}</span><span className="note-author">{note.author}</span></div>
    <p className="note-comment">{note.comment}</p>
    <div className="customer-note-dates">
      <span><strong>Date lodged:</strong> {lodgedLabel(note.createdAt)}</span>
      <span><strong>Expiry date:</strong> {dateLabel(note.expiresAt)}</span>
      <span className={active ? 'customer-note-active' : 'customer-note-expired'}>{active ? 'Active' : 'Expired'}</span>
    </div>
  </article>;
}

export function CustomerNotesModal({ onClose }: { onClose: () => void }) {
  const { workspace, addNote } = useClient();
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState<NoteCategory>('GENERAL');
  const [comment, setComment] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const customerId = workspace?.client.id;

  useEffect(() => { closeButton.current?.focus(); }, []);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape' && !saving) onClose(); }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);
  // Never allow an open modal to show notes for a different customer.
  useEffect(() => { if (!workspace || workspace.client.id !== customerId) onClose(); }, [workspace, customerId, onClose]);
  if (!workspace) return null;

  const notes = [...workspace.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
  const active = notes.filter(note => isNoteActive(note.expiresAt));
  const history = notes.filter(note => !isNoteActive(note.expiresAt));
  const visible = tab === 'active' ? active : history;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerId || saving) return;
    setError(null);
    setSaving(true);
    try {
      await addNote({ clientId: customerId, author: demoEmployee.displayName, comment, category, expiresAt });
      setComment(''); setExpiresAt(''); setCategory('GENERAL'); setAdding(false); setTab('active');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save note.');
    } finally { setSaving(false); }
  }

  return <div className="modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <section className="modal-panel customer-notes-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-notes-title">
      <div className="modal-head"><div className="modal-icon"><MessageSquareText size={19} /></div><div><h2 id="customer-notes-title">Customer notes & alerts</h2><p>{workspace.client.firstName} {workspace.client.lastName} · Client ID {workspace.client.id}</p></div><button ref={closeButton} type="button" className="icon-button" aria-label="Close customer notes" onClick={onClose} disabled={saving}><X size={20}/></button></div>
      <div className="customer-notes-toolbar"><div className="customer-notes-tabs" role="tablist" aria-label="Note status"><button type="button" role="tab" aria-selected={tab === 'active'} className={tab === 'active' ? 'selected' : ''} onClick={() => setTab('active')}>Active ({active.length})</button><button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'selected' : ''} onClick={() => setTab('history')}>History ({history.length})</button></div><button className="button-secondary" type="button" onClick={() => { setAdding(value => !value); setError(null); }}><Plus size={14}/> {adding ? 'Hide form' : 'Add note'}</button></div>
      {adding && <form className="customer-notes-form" onSubmit={submit}>
        <div className="customer-notes-fields"><label className="dispute-field">Author<input className="profile-input" readOnly value={demoEmployee.displayName}/></label><label className="dispute-field">Date lodged<input className="profile-input" readOnly value="Automatically recorded on save"/></label><label className="dispute-field">Category<select className="profile-input" value={category} onChange={event => setCategory(event.target.value as NoteCategory)}>{categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="dispute-field">Expiry date<input className="profile-input" type="date" required value={expiresAt} onChange={event => setExpiresAt(event.target.value)}/></label></div>
        <label className="dispute-field">Comment<textarea className="dispute-textarea" rows={4} required maxLength={4000} value={comment} onChange={event => setComment(event.target.value)} placeholder="Enter a factual customer servicing note..."/></label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="transfer-actions"><button type="button" className="button-secondary" onClick={() => setAdding(false)} disabled={saving}>Cancel</button><button type="submit" className="button-primary" disabled={saving || !comment.trim() || !expiresAt}>{saving ? 'Saving...' : 'Save note'}</button></div>
      </form>}
      <div className="customer-notes-list" role="tabpanel">
        {visible.length ? visible.map(note => <NoteCard key={note.id} note={note}/>) : <div className="inline-empty"><AlertTriangle size={18}/><strong>{tab === 'active' ? 'No active notes' : 'No expired notes'}</strong><p>{tab === 'active' ? 'This customer has no current notes.' : 'Expired customer notes will be retained here.'}</p></div>}
      </div>
    </section>
  </div>;
}
