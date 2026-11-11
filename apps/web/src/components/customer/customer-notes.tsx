import { useState } from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { useClient } from '@/contexts/client-context';
import { dateLabel, humanize } from '@/lib/banking-format';
import { isNoteActive } from '@/services/noteService';
import type { NoteCategory } from '@/lib/banking-types';

const NOTE_CATEGORIES: { value: NoteCategory; label: string }[] = [
  { value: 'COMPLAINT', label: 'Complaint' },
  { value: 'FRAUD', label: 'Fraud' },
  { value: 'CARD', label: 'Card' },
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'GENERAL', label: 'General' },
];

export function CustomerNotes({ allowAdd = true }: { allowAdd?: boolean }) {
  const { workspace, addNote } = useClient();
  const [adding, setAdding] = useState(false);
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<NoteCategory>('GENERAL');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!workspace) return null;
  const active = workspace.notes.filter(note => isNoteActive(note.expiresAt));
  const expired = workspace.notes.filter(note => !isNoteActive(note.expiresAt));

  function reset() {
    setAuthor('');
    setComment('');
    setCategory('GENERAL');
    setExpiresAt('');
    setError(null);
    setAdding(false);
  }
  async function submit() {
    try {
      await addNote({ clientId: workspace!.client.id, author, comment, category, expiresAt });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the note.');
    }
  }

  return <section className="panel"><div className="panel-heading"><div><h2>Customer notes</h2><p>Active notes are visible until they expire</p></div>{allowAdd && !adding && <button className="button-secondary section-action" type="button" onClick={() => setAdding(true)}><Plus size={14} />Add note</button>}</div>{adding && <div className="note-form"><label className="dispute-field">Author<input className="profile-input" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Employee name" /></label><label className="dispute-field">Category<select className="profile-input" value={category} onChange={e => setCategory(e.target.value as NoteCategory)}>{NOTE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label><label className="dispute-field">Comment<textarea className="dispute-textarea" value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Note details..." /></label><label className="dispute-field">Expires on<input className="profile-input" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></label>{error && <p className="field-error" role="alert">{error}</p>}<div className="transfer-actions"><button className="button-secondary" type="button" onClick={reset}><X size={14} />Cancel</button><button className="button-primary" type="button" onClick={submit}>Save note</button></div></div>}{!active.length && !expired.length && !adding && <div className="inline-empty"><strong>No notes</strong><p>There are no notes for this customer.</p></div>}{active.length > 0 && <div className="notes-list">{active.map(note => <div key={note.id} className="note-item"><div className="note-item-head"><span className="note-category">{humanize(note.category)}</span><span className="note-author">{note.author}</span></div><p className="note-comment">{note.comment}</p><div className="note-meta">Added {dateLabel(note.createdAt)} · Expires {dateLabel(note.expiresAt)}</div></div>)}</div>}{expired.length > 0 && <div className="notes-expired"><div className="notes-expired-head"><AlertTriangle size={15} />Expired notes</div>{expired.map(note => <div key={note.id} className="note-item note-item-expired"><div className="note-item-head"><span className="note-category">{humanize(note.category)}</span><span className="note-author">{note.author}</span></div><p className="note-comment">{note.comment}</p><div className="note-meta">Added {dateLabel(note.createdAt)} · Expired {dateLabel(note.expiresAt)}</div></div>)}</div>}</section>;
}
