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

export const notes = writable<{
  store: { [id: string]: Note };
  order: string[];
}>({ store: {}, order: [] });

export const clipboard = writable<Note[] | null>(null);

export function createNote(x: number, y: number): Note {
  const note = {
    id: v4(),
    x,
    y,
    width: 300,
    height: 50,
    content: '',
  };

  notes.update(({ store, order }) => ({
    store: { ...store, [note.id]: note },
    order: [...order, note.id],
  }));

  return note;
}

export function duplicateNotes(
  oldNotes: Note[],
  relative?: { x: number; y: number }
): string[] {
  const newIds = Array.from({ length: oldNotes.length }).map(() => v4());
  notes.update(({ store, order }) => {
    oldNotes.map((oldNote, i) => {
      const id = newIds[i];
      store[id] = { ...oldNote, id, x: oldNote.x + 10, y: oldNote.y + 10 };
      return id;
    });
    return { store, order: [...order, ...newIds] };
  });
  return newIds;
}

export function deleteNotes(deletedNotes: string[]) {
  notes.update(({ store, order }) => {
    const newOrder = order.filter((n) => !deletedNotes.includes(n));
    return {
      store: newOrder.reduce((acc, id) => ({ ...acc, [id]: store[id] }), {}),
      order: newOrder,
    };
  });
}

export function bringToFront(id: string) {
  notes.update(({ store, order }) => {
    return { store, order: [...order, ...order.splice(order.indexOf(id), 1)] };
  });
}

export function sendToBack(id: string) {
  notes.update(({ store, order }) => {
    return { store, order: [...order.splice(order.indexOf(id), 1), ...order] };
  });
}

if (localStorage.getItem('notes')) {
  notes.set(JSON.parse(localStorage.getItem('notes')));
}

notes.subscribe((notes) => {
  localStorage.setItem('notes', JSON.stringify(notes));
});
