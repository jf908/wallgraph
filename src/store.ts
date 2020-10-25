import { writable } from 'svelte/store';
import { v4 } from 'uuid';

export type Note = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
};

export type Connections = {
  [id: string]: string;
};

export const notes = writable<Note[]>([]);

export function createNote(x: number, y: number): Note {
  const note = {
    id: v4(),
    x,
    y,
    width: 300,
    height: 50,
    content: '',
  };

  notes.update((ns) => [...ns, note]);

  return note;
}

export function duplicateNotes(
  oldNotes: Note[],
  relative?: { x: number; y: number }
) {
  notes.update((ns) => [...ns, ...oldNotes.map((n) => ({ ...n, id: v4() }))]);
}

if (localStorage.getItem('notes')) {
  notes.set(JSON.parse(localStorage.getItem('notes')));
}

notes.subscribe((notes) => {
  localStorage.setItem('notes', JSON.stringify(notes));
});
