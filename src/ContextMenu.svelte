<script lang="ts">
  import { contextMenu } from './context-menu';
  import type { MenuItem } from './context-menu';

  let el: HTMLElement;

  function windowMouseDown(e: MouseEvent) {
    if (el && !el.contains(e.target as HTMLElement)) {
      $contextMenu = null;
    }
  }

  function activate(item: MenuItem) {
    if (item.callback) {
      item.callback(null);
      $contextMenu = null;
    }
  }
</script>

{#if $contextMenu}
  <div
    class="context-menu"
    bind:this={el}
    style={`left: ${$contextMenu.x}px; top: ${$contextMenu.y}px;`}>
    {#each $contextMenu.menu as itemArr, i}
      {#if i !== 0}
        <div class="divider" />
      {/if}
      {#each itemArr as item}
        <div class="menu-item" on:mouseup={() => activate(item)}>
          {item.name}
        </div>
      {/each}
    {/each}
  </div>
{/if}

<svelte:window on:mousedown={windowMouseDown} />

<style>
  .context-menu {
    position: fixed;
    padding: 4px 0;
    z-index: 100000;
    font-size: 14px;
    background: white;
    border: 1px solid #dddddd;
    user-select: none;
  }

  .menu-item {
    padding: 4px 1em;
  }

  .menu-item:hover {
    background: var(--selection);
    color: white;
  }

  .divider {
    width: 100%;
    background: #dddddd;
    height: 1px;
    margin: 4px 0;
  }
</style>
