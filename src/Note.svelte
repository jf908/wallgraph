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
  import { createEventDispatcher, tick } from 'svelte';
  import { contextMenu } from './context-menu';
  import { SelStyle } from './Board.svelte';
  import { notes } from './store';
  import type { Note } from './store';
  import { onMount } from 'svelte/internal';

  export let selected: boolean;
  export let dragging: boolean;
  export let note: Note;

  const dispatch = createEventDispatcher();

  let el: HTMLElement;
  let textareaEl: HTMLElement | undefined;
  let focused: boolean = false;
  let mouseDownPos: { x: number; y: number } | null = null;

  async function focus() {
    focused = true;
    await tick();
    if (textareaEl) {
      textareaEl.focus();
      // Put selection at end of text
      const range = document.createRange();
      range.selectNodeContents(textareaEl);
      range.collapse();
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  function onMouseDown(e: MouseEvent) {
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
      if (!e.shiftKey && !focused) {
        focus();
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

  function onBlur() {
    $notes.store[note.id].height = textareaEl.offsetHeight;
    focused = false;
  }

  function startConnection() {
    if (textareaEl) {
      textareaEl.blur();
    }
    dispatch('startconnection');
  }

  onMount(() => {
    if (selected) {
      focus();
    }
  });
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
  {#if focused}
    <div
      class="textarea"
      contenteditable
      tabindex="-1"
      bind:this={textareaEl}
      on:blur={onBlur}
      style={`width: ${note.width}px;`}
      bind:innerHTML={note.content} />
  {:else}
    <div
      class="textarea"
      style={`width: ${note.width}px; ${note.height !== 0 && `height: ${note.height}px;`}`}>
      {@html note.content}
    </div>
  {/if}
  {#if focused}
    <div
      class="connect-start"
      on:mousedown|preventDefault|stopPropagation={startConnection} />
  {/if}
</div>

<style>
  .note {
    display: flex;
    position: absolute;
    z-index: 1;
    box-shadow: 1px 2px 4px var(--shadow);
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

  .note .textarea {
    background: var(--background);
    width: 100%;
    min-height: 51px;
    height: 100%;
    border: 0;
    resize: none;
    padding: 1em;
    outline: 0;
    cursor: default;
    user-select: none;
  }

  .note.focused .textarea {
    cursor: text;
  }
</style>
