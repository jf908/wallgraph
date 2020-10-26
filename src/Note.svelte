<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { contextMenu } from './context-menu';
  import { SelStyle } from './Board.svelte';
  const dispatch = createEventDispatcher();

  import type { Note } from './store';

  export let selected: boolean;
  export let note: Note;

  let el: HTMLElement;
  let textareaEl: HTMLTextAreaElement;

  let mouseDownCoords: { x: number; y: number } | null = null;

  function onMouseDown(e: MouseEvent) {
    if (document.activeElement !== textareaEl) {
      e.preventDefault();
    }

    if (e.buttons !== 1) return;
    mouseDownCoords = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: MouseEvent) {
    if (
      e.buttons === 1 &&
      mouseDownCoords &&
      document.activeElement !== textareaEl
    ) {
      dispatch('startdrag', mouseDownCoords);
      mouseDownCoords = null;
    }
  }

  function onMouseUp(e: MouseEvent) {
    if (
      mouseDownCoords &&
      mouseDownCoords.x === e.clientX &&
      mouseDownCoords.y === e.clientY
    ) {
      dispatch('select', e.shiftKey ? SelStyle.Toggle : SelStyle.Normal);
      if (!e.shiftKey) {
        textareaEl.focus();
      }
    }
    mouseDownCoords = null;
  }

  const noteMenu = [
    [
      { name: 'Cut', callback: () => dispatch('operation', 'cut') },
      { name: 'Copy', callback: () => dispatch('operation', 'copy') },
      {
        name: 'Duplicate',
        callback: () => {
          dispatch('operation', 'duplicate');
        },
      },
      {
        name: 'Delete',
        callback: () => {
          dispatch('operation', 'delete');
        },
      },
    ],
    [
      {
        name: 'Bring to front',
        callback: () => dispatch('operation', 'front'),
      },
      {
        name: 'Send to back',
        callback: () => dispatch('operation', 'back'),
      },
    ],
  ];

  function onContextMenu(e: MouseEvent) {
    if (document.activeElement !== textareaEl) {
      e.preventDefault();

      dispatch('select', SelStyle.NoOverride);

      $contextMenu = {
        menu: noteMenu,
        x: e.pageX - window.scrollX,
        y: e.pageY - window.scrollY,
      };
    }
  }
</script>

<div
  bind:this={el}
  class="note"
  class:selected
  style={`left: ${note.x}px; top: ${note.y}px`}
  on:contextmenu={onContextMenu}
  on:mousedown={onMouseDown}
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}>
  <textarea
    bind:this={textareaEl}
    style={`width: ${note.width}px; height: ${note.height}px`}
    bind:value={note.content} />
</div>

<style>
  .note {
    display: flex;
    position: absolute;
    box-shadow: 1px 2px 2px rgba(0, 0, 0, 0.1);

    user-select: none;
  }

  .note.selected {
    outline: var(--selection) solid 2px;
  }

  .note textarea {
    width: 100%;
    height: 100%;
    border: 0;

    padding: 1em;

    outline: 0;
  }
</style>
