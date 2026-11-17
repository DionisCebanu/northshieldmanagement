import notesSeed from '@/data/customerNotes.json';
import { readStore, nextId } from '@/lib/mock-storage';
import type { CustomerNote, NoteCategory } from '@/lib/banking-types';

const NOTE_STORE_KEY = 'northshield:notes:added';
const seedNotes = notesSeed as unknown as CustomerNote[];

function loadAddedNotes(): CustomerNote[] {
  return readStore<CustomerNote>(NOTE_STORE_KEY);
}

/** All notes: read-only seed records merged with locally added notes. */
function allNotes(): CustomerNote[] {
  return [...seedNotes, ...loadAddedNotes()];
}

export async function getNotesByClientId(clientId: number): Promise<CustomerNote[]> {
  if (!Number.isInteger(clientId)) return [];
  return allNotes()
    .filter(note => note.clientId === clientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
}

export function isNoteActive(expiresAt: string): boolean {
  return expiresAt >= localDate(new Date());
}

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type AddNoteInput = {
  clientId: number;
  author: string;
  comment: string;
  category: NoteCategory;
  expiresAt: string;
};

/**
 * Adds a customer note with an expiration date. Persisted to localStorage
 * keyed separately from the read-only seed notes.
 * Prepared for a future REST API: replace the localStorage write with a
 * `POST /api/notes` call.
 */
export async function addNote(input: AddNoteInput): Promise<CustomerNote> {
  if (!input.author.trim()) throw new Error('Author is required.');
  if (!input.comment.trim()) throw new Error('Note comment is required.');
  if (!input.category) throw new Error('Select a note category.');
  if (!input.expiresAt) throw new Error('Select an expiration date.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expiresAt) || Number.isNaN(Date.parse(`${input.expiresAt}T00:00:00`))) throw new Error('Enter a valid expiry date.');
  if (input.expiresAt <= localDate(new Date())) throw new Error('Expiry date must be later than the date lodged.');

  const stored = loadAddedNotes();
  const id = nextId(seedNotes, stored);
  const note: CustomerNote = {
    id,
    clientId: input.clientId,
    author: input.author.trim(),
    comment: input.comment.trim(),
    category: input.category,
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
  };
  stored.push(note);
  // The shared mock-storage helper silently ignores write failures.
  // Verify persistence so the UI never reports a false success.
  if (typeof window === 'undefined') throw new Error('Notes can only be saved in the browser.');
  try {
    window.localStorage.setItem(NOTE_STORE_KEY, JSON.stringify(stored));
  } catch {
    throw new Error('Unable to save note in browser storage.');
  }
  return note;
}
