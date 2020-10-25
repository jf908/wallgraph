<script lang="ts">
  import Note from './Note.svelte';
  import SelectionBox from './SelectionBox.svelte';

  import { createNote, duplicateNotes, notes } from './store';
  import { contextMenu } from './context-menu';
  import { fixNegativeRectangle, rectCollision } from './rectangle';

  let selected: { [id: string]: { x: number; y: number } } = {};

  let selectionBox: { width: number; height: number } | null = null;
  let selectionStart: { x: number; y: number } | null = null;

  let dragStart: { x: number; y: number } | null = null;

  function onDoubleClick(e: MouseEvent) {
    createNote(e.clientX, e.clientY);
  }

  function onMouseDown(e: MouseEvent) {
    selected = {};
    selectionStart = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: MouseEvent) {
    if (e.buttons === 1) {
      if (selectionStart) {
        selectionBox = {
          width: e.clientX - selectionStart.x,
          height: e.clientY - selectionStart.y,
        };
        const box = fixNegativeRectangle({
          ...selectionStart,
          ...selectionBox,
        });
        selected = $notes.reduce((acc, n) => {
          if (rectCollision(n, box)) {
            console.log('add!');
            return { ...acc, [n.id]: { x: 0, y: 0 } };
          }
          return acc;
        }, {});
      }
      if (dragStart) {
        $notes = $notes.map((note) => {
          if (selected[note.id]) {
            return {
              ...note,
              x: selected[note.id].x + e.clientX - dragStart.x,
              y: selected[note.id].y + e.clientY - dragStart.y,
            };
          } else {
            return note;
          }
        });
      }
    }
  }

  function onMouseUp() {
    selectionStart = null;
    selectionBox = null;
    dragStart = null;
  }

  function startDrag({ x, y }: { x: number; y: number }, id: string) {
    dragStart = { x, y };

    if (selected[id]) {
      Object.keys(selected).forEach((id) => {
        const note = $notes.find((x) => x.id === id);
        selected[id] = { x: note.x, y: note.y };
      });
    } else {
      const note = $notes.find((x) => x.id === id);
      selected = { [id]: { x: note.x, y: note.y } };
    }
  }

  function selectNote(id, add: boolean) {
    if (!add) {
      selected = {};
    }
    selected[id] = { x: 0, y: 0 };

    if (document.activeElement.nodeName === 'TEXTAREA') {
      (document.activeElement as HTMLTextAreaElement).blur();
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.code === 'KeyA' && e.ctrlKey) {
      e.preventDefault();
      selected = $notes.reduce(
        (acc, x) => ({ ...acc, [x.id]: { x: 0, y: 0 } }),
        {}
      );
    }

    if (e.code === 'Delete') {
      if (document.activeElement.nodeName !== 'TEXTAREA') {
        $notes = $notes.filter((note) => !selected[note.id]);
        selected = {};
      }
    }
  }

  const menu = [
    [
      {
        name: 'New Note',
        callback: () => {
          createNote($contextMenu.x, $contextMenu.y);
        },
      },
    ],
  ];
  function onContextMenu(e: MouseEvent) {
    e.preventDefault();
    $contextMenu = {
      menu,
      x: e.pageX - window.scrollX,
      y: e.pageY - window.scrollY,
    };
  }

  function onOperation(operation: { detail: string }) {
    switch (operation.detail) {
      case 'delete': {
        $notes = $notes.filter((note) => !selected[note.id]);
        break;
      }
      case 'duplicate': {
        break;
      }
    }
  }
</script>

<div class="board">
  <div
    class="inner"
    on:dblclick|self={onDoubleClick}
    on:mousedown|self={onMouseDown}
    on:contextmenu|self={onContextMenu}
    on:mousemove={onMouseMove}>
    {#if selectionBox}
      <SelectionBox {...selectionStart} {...selectionBox} />
    {/if}
    {#each $notes as note}
      <Note
        selected={!!selected[note.id]}
        on:startdrag={(e) => startDrag(e.detail, note.id)}
        on:select={(e) => selectNote(note.id, e.detail)}
        on:operation={onOperation}
        bind:note />
    {/each}
  </div>
</div>

<svelte:window on:mouseup={onMouseUp} on:keydown={onKeydown} />

<style>
  .board {
    width: 100vw;
    height: 100vh;
    overflow: scroll;
    background: #f0f0f0;
  }

  .inner {
    min-width: 100%;
    min-height: 100%;
    overflow: hidden;
  }
</style>
