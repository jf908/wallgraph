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
      item.callback($contextMenu.arg);
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
        <div
          class="menu-item"
          class:disabled={item.disabled}
          on:mouseup={() => activate(item)}>
          {item.name}
          {#if item.shortcut}<span class="shortcut">{item.shortcut}</span>{/if}
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
    background: var(--background);
    border: 1px solid var(--border);
    user-select: none;
  }

  .menu-item {
    padding: 4px 1em;
    display: flex;
  }

  .menu-item.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .menu-item:hover {
    background: var(--selection);
    color: white;
  }

  .divider {
    width: 100%;
    background: var(--border);
    height: 1px;
    margin: 4px 0;
  }

  .shortcut {
    text-align: right;
    padding-left: 3em;
    margin-left: auto;
  }
</style>
