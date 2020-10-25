<script lang="ts">
  import { fixNegativeRectangle } from './rectangle';
  import type { Rect } from './rectangle';

  export let x: number;
  export let y: number;
  export let width: number;
  export let height: number;

  $: css = calcCSS({ x, y, width, height });
  function calcCSS(rect: Rect) {
    const { x, y, width, height } = fixNegativeRectangle(rect);
    return `left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;`;
  }
</script>

<div class="selection-box" style={css} />

<style>
  .selection-box {
    position: absolute;
    z-index: 1000;
    border: 1px solid var(--selection);
    background: rgba(54, 123, 252, 0.1);
  }
</style>
