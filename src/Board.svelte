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
    boardSize,
    bringToFront,
    clipboard,
    createNote,
    deleteConnections,
    deleteNotes,
    duplicateNotes,
    lines,
    makeConnection,
    notes,
    sendToBack,
  } from './store';
  import { contextMenu } from './context-menu';
  import type { MenuItem } from './context-menu';
  import {
    fixNegativeRectangle,
    lineRectCollision,
    rectCentre,
    rectCollision,
    rectInside,
  } from './rectangle';
  import type { Rect } from './rectangle';
  import Line from './Line.svelte';

  let selected: string[] = [];
  let selectedLines: [string, string][] = [];
  let selectedStart: { x: number; y: number }[] = [];

  let dragging: Dragging | null = null;
  let dragStart: { x: number; y: number } | null = null;
  let dragEnd: { x: number; y: number } | null = null;
  let dragNote: string | null = null;
  let scrollStart: { x: number; y: number } | null = null;
  let selectionBox: Rect | null = null;

  let boardEl: HTMLElement;
  let containerWidth = 0;
  let containerHeight = 0;
  $: boardWidth = Math.max(containerWidth, $boardSize.x);
  $: boardHeight = Math.max(containerHeight, $boardSize.y);

  function getOffsetX() {
    return -boardEl.offsetLeft + boardEl.scrollLeft;
  }
  function getOffsetY() {
    return -boardEl.offsetTop + boardEl.scrollTop;
  }

  function deselect() {
    selected = [];
    selectedLines = [];
  }

  function onDoubleClick(e: MouseEvent) {
    deselect();
    selected = [
      createNote(e.clientX + getOffsetX(), e.clientY + getOffsetY()).id,
    ];
  }

  function onMouseDown(e: MouseEvent) {
    if (e.buttons === 1) {
      deselect();
      dragging = Dragging.SelectionBox;
      dragStart = {
        x: e.clientX + getOffsetX(),
        y: e.clientY + getOffsetY(),
      };
    }
  }

  function onMiddleMouseDown(e: MouseEvent) {
    if (e.buttons === 4) {
      e.preventDefault();
      dragStart = { x: e.clientX, y: e.clientY };
      scrollStart = { x: boardEl.scrollLeft, y: boardEl.scrollTop };
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (e.buttons === 1) {
      if (dragging === Dragging.SelectionBox) {
        selectionBox = fixNegativeRectangle({
          ...dragStart,
          width: e.clientX + getOffsetX() - dragStart.x,
          height: e.clientY + getOffsetY() - dragStart.y,
        });
        selected = $notes.order.filter((id) =>
          rectCollision($notes.store[id], selectionBox)
        );
        selectedLines = $lines
          .filter((line) => lineRectCollision(line, selectionBox))
          .map(({ id1, id2 }) => [id1, id2]);
      } else if (dragging === Dragging.Note) {
        selected.forEach((id, i) => {
          $notes.store[id] = {
            ...$notes.store[id],
            x: Math.max(0, selectedStart[i].x + e.clientX - dragStart.x),
            y: Math.max(0, selectedStart[i].y + e.clientY - dragStart.y),
          };
        });
      } else if (dragging === Dragging.Line) {
        dragEnd = {
          x: e.clientX + getOffsetX(),
          y: e.clientY + getOffsetY(),
        };
        let found = false;
        for (let id of $notes.order) {
          const note = $notes.store[id];
          if (rectInside(dragEnd, note)) {
            selected = [selected[0], id];
            found = true;
            break;
          }
        }
        if (!found) {
          selected = [selected[0]];
        }
      }
    } else if (e.buttons === 4 && scrollStart) {
      boardEl.scrollLeft = -e.clientX + dragStart.x + scrollStart.x;
      boardEl.scrollTop = -e.clientY + dragStart.y + scrollStart.y;
    }
  }

  function onMouseUp() {
    selectionBox = null;
    dragging = null;
    dragStart = null;
    scrollStart = null;

    if (dragNote && selected.length === 2) {
      makeConnection([selected[0], selected[1]]);
    }

    dragNote = null;
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
      deselect();
      selected = [id];
      selectedStart = [{ x: $notes.store[id].x, y: $notes.store[id].y }];
    }
  }

  function selectNote(id: string, style: SelStyle = SelStyle.Normal) {
    switch (style) {
      case SelStyle.Normal: {
        deselect();
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
          deselect();
          selected = [id];
        }
        break;
      }
    }
  }

  function selectLine(con: [string, string], style: SelStyle) {
    switch (style) {
      case SelStyle.Normal: {
        deselect();
        selectedLines = [con];
        break;
      }
      case SelStyle.Toggle: {
        if (selectedLines.some((c) => c[0] === con[0] && c[1] === con[1])) {
          selectedLines = selectedLines.filter(
            (c) => !(c[0] === con[0] && c[1] === con[1])
          );
        } else {
          selectedLines = [...selectedLines, con];
        }
        break;
      }
      case SelStyle.NoOverride: {
        if (!selectedLines.some((c) => c[0] === con[0] && c[1] === con[1])) {
          deselect();
          selectedLines = [con];
        }
        break;
      }
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if ((document.activeElement as HTMLElement).isContentEditable) {
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
      deleteConnections(selectedLines);
      deleteNotes(selected);
      deselect();
    }
  }

  // Context Menu
  const menu: MenuItem[][] = [
    [
      {
        name: 'New Note',
        callback: () => {
          deselect();
          selected = [createNote($contextMenu.x, $contextMenu.y).id];
        },
      },
    ],
    [
      {
        name: 'Paste',
        shortcut: 'Ctrl+V',
        callback: () => {
          if ($clipboard) {
            selected = duplicateNotes($clipboard, {
              x: $contextMenu.x + getOffsetX(),
              y: $contextMenu.y + getOffsetY(),
            });
          }
        },
      },
    ],
  ];
  function onContextMenu(e: MouseEvent) {
    e.preventDefault();
    menu[1][0].disabled = !$clipboard;
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
        deselect();
      }
      case 'delete': {
        deleteConnections(selectedLines);
        deleteNotes(selected);
        deselect();
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
    dragNote = id;
    dragStart = dragEnd = rectCentre($notes.store[id]);
    dragging = Dragging.Line;
  }
</script>

<div
  class="board"
  class:is-dragging={scrollStart}
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
  bind:this={boardEl}
  on:mousemove={onMouseMove}>
  <div
    class="inner"
    style="width: {boardWidth}px; height: {boardHeight}px;"
    on:mousedown={onMiddleMouseDown}>
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
    <svg
      class="connections"
      on:dblclick|self={onDoubleClick}
      on:mousedown|self={onMouseDown}
      on:contextmenu|self={onContextMenu}
      width={boardWidth}
      height={boardHeight}>
      {#each $lines as line}
        <Line
          selected={selectedLines.some((c) => c[0] === line.id1 && c[1] === line.id2)}
          on:operation={onOperation}
          on:select={(e) => selectLine([line.id1, line.id2], e.detail)}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2} />
      {/each}
      {#if dragNote}
        <Line x1={dragStart.x} y1={dragStart.y} x2={dragEnd.x} y2={dragEnd.y} />
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
    position: absolute;
  }

  .board.is-dragging :global(*) {
    cursor: grabbing !important;
  }
</style>
