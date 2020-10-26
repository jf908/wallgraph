<script lang="ts" context="module">
  export const enum SelStyle {
    Normal,
    Toggle,
    NoOverride,
  }
</script>

<script lang="ts">
  import Note from './Note.svelte';
  import SelectionBox from './SelectionBox.svelte';

  import {
    bringToFront,
    clipboard,
    createNote,
    deleteNotes,
    duplicateNotes,
    notes,
    sendToBack,
  } from './store';
  import { contextMenu } from './context-menu';
  import { fixNegativeRectangle, rectCollision } from './rectangle';

  let selected: string[] = [];
  let selectedStart: { x: number; y: number }[] = [];

  let selectionBox: { width: number; height: number } | null = null;
  let selectionStart: { x: number; y: number } | null = null;

  let dragStart: { x: number; y: number } | null = null;

  function onDoubleClick(e: MouseEvent) {
    createNote(e.clientX, e.clientY);
  }

  function onMouseDown(e: MouseEvent) {
    selected = [];
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
        selected = $notes.order.filter((id) =>
          rectCollision($notes.store[id], box)
        );
      }
      if (dragStart) {
        selected.forEach((id, i) => {
          $notes.store[id] = {
            ...$notes.store[id],
            x: selectedStart[i].x + e.clientX - dragStart.x,
            y: selectedStart[i].y + e.clientY - dragStart.y,
          };
        });
      }
    }
  }

  function onMouseUp() {
    selectionStart = null;
    selectionBox = null;
    dragStart = null;
  }

  function startDrag(
    { pos, alt }: { pos: { x: number; y: number }; alt: boolean },
    id: string
  ) {
    dragStart = pos;

    if (selected.includes(id)) {
      if (alt) {
        selected = duplicateNotes(selected.map((id) => $notes.store[id]));
      }
      selectedStart = selected.map((id) => ({
        x: $notes.store[id].x,
        y: $notes.store[id].y,
      }));
    } else {
      if (alt) {
        id = duplicateNotes([$notes.store[id]])[0];
      }
      selected = [id];
      selectedStart = [{ x: $notes.store[id].x, y: $notes.store[id].y }];
    }
  }

  function selectNote(id, style: SelStyle = SelStyle.Normal) {
    switch (style) {
      case SelStyle.Normal: {
        selected = [id];
        break;
      }
      case SelStyle.Toggle: {
        if (selected.includes(id)) {
          selected = selected.filter((i) => i !== id);
        } else {
          selected = [...selected, id];
        }
        break;
      }
      case SelStyle.NoOverride: {
        if (!selected.includes(id)) {
          selected = [id];
        }
        break;
      }
    }

    if (document.activeElement.nodeName === 'TEXTAREA') {
      (document.activeElement as HTMLTextAreaElement).blur();
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.code === 'KeyA' && e.ctrlKey) {
      e.preventDefault();
      selected = $notes.order;
    }

    if (e.code === 'KeyC' && e.ctrlKey) {
      e.preventDefault();
      $clipboard = selected.map((id) => $notes.store[id]);
    }

    if (e.code === 'KeyX' && e.ctrlKey) {
      e.preventDefault();
      $clipboard = selected.map((id) => $notes.store[id]);
      deleteNotes(selected);
    }

    if (e.code === 'KeyV' && e.ctrlKey) {
      e.preventDefault();
      selected = duplicateNotes($clipboard);
    }

    if (e.code === 'Delete') {
      if (document.activeElement.nodeName !== 'TEXTAREA') {
        deleteNotes(selected);
        selected = [];
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
    [
      {
        name: 'Paste',
        shortcut: 'Ctrl+V',
        callback: () => {
          if ($clipboard) {
            selected = duplicateNotes($clipboard, $contextMenu);
          }
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
      case 'cut': {
        $clipboard = selected.map((id) => $notes.store[id]);
        deleteNotes(selected);
        selected = [];
      }
      case 'delete': {
        deleteNotes(selected);
        selected = [];
        break;
      }
      case 'duplicate': {
        selected = duplicateNotes(selected.map((id) => $notes.store[id]));
        break;
      }
      case 'copy': {
        $clipboard = selected.map((id) => $notes.store[id]);
        break;
      }
      case 'front': {
        bringToFront(selected);
        break;
      }
      case 'back': {
        sendToBack(selected);
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
    {#each $notes.order as id}
      <Note
        selected={selected.includes(id)}
        on:startdrag={(e) => startDrag(e.detail, id)}
        on:select={(e) => selectNote(id, e.detail)}
        on:operation={onOperation}
        bind:note={$notes.store[id]} />
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
