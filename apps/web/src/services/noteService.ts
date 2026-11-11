import notesSeed from '@/data/customerNotes.json';
import { readStore, writeStore, nextId, todayISO } from '@/lib/mock-storage';
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
  return expiresAt >= new Date().toISOString().slice(0, 10);
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
  if (input.expiresAt < todayISO()) throw new Error('Expiration date must be today or later.');

  const stored = loadAddedNotes();
  const id = nextId(seedNotes, stored);
  const note: CustomerNote = {
    id,
    clientId: input.clientId,
    author: input.author.trim(),
    comment: input.comment.trim(),
    category: input.category,
    createdAt: todayISO(),
    expiresAt: input.expiresAt,
  };
  stored.push(note);
  writeStore(NOTE_STORE_KEY, stored);
  return note;
}
