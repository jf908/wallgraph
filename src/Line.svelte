<script lang="ts">
  import type { Rect } from './rectangle';

  export let rect1: Rect;
  export let rect2: Rect;

  $: x1 = rect1.x + rect1.width / 2;
  $: y1 = rect1.y + rect1.height / 2;
  $: x2 = rect2.x + rect2.width / 2;
  $: y2 = rect2.y + rect2.height / 2;
</script>

<line {x1} {y1} {x2} {y2} />

<style>
  line {
    stroke: var(--text);
  }
</style>
