<script lang="ts" context="module">
  export const enum SelStyle {
    Normal,
    Toggle,
    NoOverride,
  }

  const enum Dragging {
    Note,
    SelectionBox,
    Line,
  }
</script>

<script lang="ts">
  import NoteComponent from './Note.svelte';
  import SelectionBox from './SelectionBox.svelte';

  import {
    bringToFront,
    clipboard,
    connections,
    createNote,
    deleteNotes,
    duplicateNotes,
    makeConnection,
    notes,
    sendToBack,
  } from './store';
  import type { Note } from './store';
  import { contextMenu } from './context-menu';
  import { fixNegativeRectangle, rectCollision, rectInside } from './rectangle';
  import type { Rect } from './rectangle';
  import Line from './Line.svelte';

  let selected: string[] = [];
  let selectedStart: { x: number; y: number }[] = [];

  let dragging: Dragging | null = null;
  let dragStart: { x: number; y: number } | null = null;
  let selectionBox: Rect | null = null;
  let connectionNote: Note | null = null;
  let connectionEnd: Rect | null = null;

  let boardWidth;
  let boardHeight;

  function onDoubleClick(e: MouseEvent) {
    createNote(e.clientX, e.clientY);
  }

  function onMouseDown(e: MouseEvent) {
    selected = [];
    dragging = Dragging.SelectionBox;
    dragStart = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: MouseEvent) {
    if (e.buttons === 1) {
      if (dragging === Dragging.SelectionBox) {
        selectionBox = fixNegativeRectangle({
          ...dragStart,
          width: e.clientX - dragStart.x,
          height: e.clientY - dragStart.y,
        });
        selected = $notes.order.filter((id) =>
          rectCollision($notes.store[id], selectionBox)
        );
      } else if (dragging === Dragging.Note) {
        selected.forEach((id, i) => {
          $notes.store[id] = {
            ...$notes.store[id],
            x: selectedStart[i].x + e.clientX - dragStart.x,
            y: selectedStart[i].y + e.clientY - dragStart.y,
          };
        });
      } else if (dragging === Dragging.Line) {
        connectionEnd = { x: e.clientX, y: e.clientY, width: 0, height: 0 };
        let found = false;
        for (let id of $notes.order) {
          const note = $notes.store[id];
          if (rectInside(connectionEnd, note)) {
            selected = [selected[0], id];
            found = true;
            break;
          }
        }
        if (!found) {
          selected = [selected[0]];
        }
      }
    }
    if (e.buttons === 4) {
      // Drag scrolling
    }
  }

  function onMouseUp() {
    selectionBox = null;
    dragging = null;
    dragStart = null;

    if (connectionNote && selected.length === 2) {
      makeConnection([selected[0], selected[1]]);
    }

    connectionNote = null;
  }

  function startDrag(
    { pos, alt }: { pos: { x: number; y: number }; alt: boolean },
    id: string
  ) {
    dragging = Dragging.Note;
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
    if (document.activeElement.nodeName === 'TEXTAREA') {
      return;
    }

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

  // Context Menu
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

  function startConnection(id: string) {
    connectionNote = connectionEnd = $notes.store[id];
    dragging = Dragging.Line;
  }
</script>

<div class="board">
  <div
    class="inner"
    bind:clientWidth={boardWidth}
    bind:clientHeight={boardHeight}
    on:dblclick|self={onDoubleClick}
    on:mousedown|self={onMouseDown}
    on:contextmenu|self={onContextMenu}
    on:mousemove={onMouseMove}>
    {#if selectionBox}
      <SelectionBox {...selectionBox} />
    {/if}
    {#each $notes.order as id}
      <NoteComponent
        selected={selected.includes(id)}
        dragging={dragging === Dragging.Note}
        on:startdrag={(e) => startDrag(e.detail, id)}
        on:select={(e) => selectNote(id, e.detail)}
        on:startconnection={() => startConnection(id)}
        on:operation={onOperation}
        bind:note={$notes.store[id]} />
    {/each}
    <svg class="connections" width={boardWidth} height={boardHeight}>
      {#each Object.entries($connections) as [id1, ids]}
        {#each ids as id2}
          <Line rect1={$notes.store[id1]} rect2={$notes.store[id2]} />
        {/each}
      {/each}
      {#if connectionNote}
        <Line rect1={connectionNote} rect2={connectionEnd} />
      {/if}
    </svg>
  </div>
</div>

<svelte:window on:mouseup={onMouseUp} on:keydown={onKeydown} />

<style>
  .board {
    width: 100vw;
    height: 100vh;
    overflow: scroll;
    background: var(--graph-background);
  }

  .inner {
    min-width: 100%;
    min-height: 100%;
    overflow: hidden;
  }

  .connections {
    pointer-events: none;
    position: absolute;
  }
</style>
