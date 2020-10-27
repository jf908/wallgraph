<script>
  import Board from './Board.svelte';
  import ContextMenu from './ContextMenu.svelte';
  import Nav from './Nav.svelte';
</script>

<ContextMenu />

<main>
  <Nav />
  <Board />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>
