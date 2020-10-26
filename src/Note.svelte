<script lang="ts" context="module">
  function callback(dispatch: (type: string, detail?: any) => void) {
    dispatch('operation', this.operation);
  }

  const noteMenu = [
    [
      {
        name: 'Cut',
        shortcut: 'Ctrl+X',
        operation: 'cut',
        callback,
      },
      {
        name: 'Copy',
        shortcut: 'Ctrl+C',
        operation: 'copy',
        callback,
      },
      {
        name: 'Duplicate',
        operation: 'duplicate',
        callback,
      },
      {
        name: 'Delete',
        operation: 'delete',
        callback,
      },
    ],
    [
      {
        name: 'Bring to front',
        operation: 'front',
        callback,
      },
      {
        name: 'Send to back',
        operation: 'back',
        callback,
      },
    ],
  ];
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { contextMenu } from './context-menu';
  import { SelStyle } from './Board.svelte';
  const dispatch = createEventDispatcher();

  import type { Note } from './store';

  export let selected: boolean;
  export let dragging: boolean;
  export let note: Note;

  let el: HTMLElement;
  let textareaEl: HTMLTextAreaElement;
  let focused: boolean = false;

  let mouseDownPos: { x: number; y: number } | null = null;

  function onMouseDown(e: MouseEvent) {
    if (document.activeElement !== textareaEl) {
      e.preventDefault();
    }

    if (e.buttons !== 1) return;
    mouseDownPos = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: MouseEvent) {
    if (
      e.buttons === 1 &&
      mouseDownPos &&
      document.activeElement !== textareaEl
    ) {
      dispatch('startdrag', { pos: mouseDownPos, alt: e.altKey });
      mouseDownPos = null;
    }
  }

  function onMouseUp(e: MouseEvent) {
    if (
      mouseDownPos &&
      mouseDownPos.x === e.clientX &&
      mouseDownPos.y === e.clientY
    ) {
      dispatch('select', e.shiftKey ? SelStyle.Toggle : SelStyle.Normal);
      if (!e.shiftKey) {
        textareaEl.focus();
        focused = true;
      }
    }
    mouseDownPos = null;
  }

  function onContextMenu(e: MouseEvent) {
    if (document.activeElement !== textareaEl) {
      e.preventDefault();

      dispatch('select', SelStyle.NoOverride);

      $contextMenu = {
        menu: noteMenu,
        arg: dispatch,
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
  class:dragging={selected && dragging}
  class:focused
  style={`left: ${note.x}px; top: ${note.y}px`}
  on:contextmenu={onContextMenu}
  on:mousedown={onMouseDown}
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}>
  <textarea
    bind:this={textareaEl}
    tabindex="-1"
    on:blur={() => (focused = false)}
    style={`width: ${note.width}px; height: ${note.height}px`}
    bind:value={note.content} />
  {#if focused}
    <div
      class="connect-start"
      on:mousedown|preventDefault={() => dispatch('startconnection')} />
  {/if}
</div>

<style>
  .note {
    display: flex;
    position: absolute;
    z-index: 1;
    box-shadow: 1px 2px 2px var(--shadow);
    transition: box-shadow 0.2s;

    user-select: none;
  }

  .note.selected {
    outline: var(--selection) solid 2px;
  }

  .note.dragging {
    box-shadow: 4px 8px 24px var(--heavy-shadow);
  }

  .connect-start {
    position: absolute;
    cursor: pointer;
    z-index: 2;
    width: 16px;
    height: 16px;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 50%;
    left: 0;
    right: 0;
    bottom: -8px;
    margin: auto;
  }

  .note textarea {
    background: var(--background);
    width: 100%;
    height: 100%;
    border: 0;
    resize: none;
    padding: 1em;
    outline: 0;
    cursor: default;
  }

  .note.focused textarea {
    cursor: text;
  }
</style>
