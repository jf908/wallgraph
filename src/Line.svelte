<script lang="ts" context="module">
  function callback(dispatch: (type: string, detail?: any) => void) {
    dispatch('operation', this.operation);
  }

  const lineMenu = [
    [
      {
        name: 'Delete',
        operation: 'delete',
        callback,
      },
    ],
  ];
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SelStyle } from './Board.svelte';
  import { contextMenu } from './context-menu';

  export let x1: number;
  export let y1: number;
  export let x2: number;
  export let y2: number;
  export let selected: boolean = false;

  const dispatch = createEventDispatcher();
  let mouseDownPos: { x: number; y: number } | null = null;

  function onMouseDown(e: MouseEvent) {
    if (e.buttons !== 1) return;
    mouseDownPos = { x: e.clientX, y: e.clientY };
  }

  function onMouseUp(e: MouseEvent) {
    if (
      mouseDownPos &&
      mouseDownPos.x === e.clientX &&
      mouseDownPos.y === e.clientY
    ) {
      dispatch('select', e.shiftKey ? SelStyle.Toggle : SelStyle.Normal);
    }
    mouseDownPos = null;
  }

  function onContextMenu(e: MouseEvent) {
    e.preventDefault();

    dispatch('select', SelStyle.NoOverride);

    $contextMenu = {
      menu: lineMenu,
      arg: dispatch,
      x: e.pageX - window.scrollX,
      y: e.pageY - window.scrollY,
    };
  }
</script>

<line class="line" {x1} {y1} {x2} {y2} stroke-width="2" />

{#if selected}
  <line class="selection" {x1} {y1} {x2} {y2} stroke-width="4" />
{/if}
<line
  on:mousedown={onMouseDown}
  on:mouseup={onMouseUp}
  on:contextmenu={onContextMenu}
  {x1}
  {y1}
  {x2}
  {y2}
  stroke-width="10"
  stroke="transparent" />

<style>
  .line {
    stroke: var(--text);
  }

  .selection {
    stroke: var(--selection);
  }
</style>
