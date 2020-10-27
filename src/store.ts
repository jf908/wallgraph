import { derived, writable } from 'svelte/store';
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
  [id: string]: string[];
};

export const notes = writable<{
  store: { [id: string]: Note };
  order: string[];
}>({ store: {}, order: [] });

const padding = 300;
export const boardSize = derived(notes, ($notes) =>
  $notes.order.reduce(
    (acc, id) => {
      const note = $notes.store[id];
      return {
        x: Math.max(acc.x, note.x + note.width + padding),
        y: Math.max(acc.y, note.y + note.height + padding),
      };
    },
    { x: 0, y: 0 }
  )
);

export function createNote(x: number, y: number): Note {
  const note = {
    id: v4(),
    x,
    y,
    width: 300,
    height: 80,
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

  let offset;
  if (relative) {
    offset = oldNotes.reduce(
      (acc, n) => ({ x: Math.min(acc.x, n.x), y: Math.min(acc.y, n.y) }),
      { x: Infinity, y: Infinity }
    );
  }

  notes.update(({ store, order }) => {
    oldNotes.map((oldNote, i) => {
      const id = newIds[i];
      if (relative) {
        store[id] = {
          ...oldNote,
          id,
          x: relative.x - offset.x + oldNote.x,
          y: relative.y - offset.y + oldNote.y,
        };
      } else {
        store[id] = { ...oldNote, id, x: oldNote.x + 10, y: oldNote.y + 10 };
      }
      return id;
    });
    return { store, order: [...order, ...newIds] };
  });
  return newIds;
}

export function deleteNotes(deletedNotes: string[]) {
  connections.update((cons) =>
    Object.entries(cons).reduce((acc, [id, ids]) => {
      if (deletedNotes.includes(id)) {
        return acc;
      } else {
        const newIds = ids.filter((i) => !deletedNotes.includes(i));
        if (newIds.length > 0) {
          return { ...acc, [id]: newIds };
        } else {
          return acc;
        }
      }
    }, {})
  );
  notes.update(({ store, order }) => {
    const newOrder = order.filter((n) => !deletedNotes.includes(n));
    return {
      store: newOrder.reduce((acc, id) => ({ ...acc, [id]: store[id] }), {}),
      order: newOrder,
    };
  });
}

export function bringToFront(ids: string[]) {
  notes.update(({ store, order }) => {
    return {
      store,
      order: [...order.filter((id) => !ids.includes(id)), ...ids],
    };
  });
}

export function sendToBack(ids: string[]) {
  notes.update(({ store, order }) => {
    return {
      store,
      order: [...ids, ...order.filter((id) => !ids.includes(id))],
    };
  });
}

export const connections = writable<Connections>({});

export const lines = derived([connections, notes], ([$connections, $notes]) => {
  return Object.entries($connections).reduce(
    (acc, [id1, ids]) => [
      ...acc,
      ...ids.map((id2) => {
        const rect1 = $notes.store[id1];
        const rect2 = $notes.store[id2];
        return {
          id1,
          id2,
          x1: rect1.x + rect1.width / 2,
          y1: rect1.y + rect1.height / 2,
          x2: rect2.x + rect2.width / 2,
          y2: rect2.y + rect2.height / 2,
        };
      }),
    ],
    []
  );
});

export function makeConnection([id1, id2]: [string, string]) {
  // No self loop
  if (id1 === id2) return;
  connections.update((cons) => {
    if (!cons[id1]) {
      return { ...cons, [id1]: [id2] };
    }
    if (!cons[id1].includes(id2)) {
      return { ...cons, [id1]: [...cons[id1], id2] };
    }
    return cons;
  });
}

export function deleteConnections(deletedCons: [string, string][]) {
  connections.update((cons) =>
    deletedCons.reduce((acc, [id1, id2]) => {
      if (cons[id1]) {
        if (cons[id1].length > 1) {
          return { ...acc, [id1]: acc[id1].filter((c) => c !== id2) };
        } else {
          const { [id1]: _, ...newAcc } = acc;
          return newAcc;
        }
      }
      return acc;
    }, cons)
  );
}

export const clipboard = writable<Note[] | null>(null);

if (localStorage.getItem('notes')) {
  notes.set(JSON.parse(localStorage.getItem('notes')));
}
if (localStorage.getItem('connections')) {
  connections.set(JSON.parse(localStorage.getItem('connections')));
}

notes.subscribe((notes) => {
  localStorage.setItem('notes', JSON.stringify(notes));
});

connections.subscribe((cons) => {
  localStorage.setItem('connections', JSON.stringify(cons));
});
