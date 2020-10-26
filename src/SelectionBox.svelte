<script lang="ts">
  export let x: number;
  export let y: number;
  export let width: number;
  export let height: number;
</script>

<div
  class="selection-box"
  style="left: {x}px; top: {y}px; width: {width}px; height: {height}px;" />

<style>
  .selection-box {
    position: absolute;
    z-index: 1000;
    border: 1px solid var(--selection);
    background: var(--selection-transparent);
  }
</style>
