<script lang="ts">
  import UploadIcon from './icons/upload.svg';
  import DownloadIcon from './icons/download.svg';
  import LightIcon from './icons/light.svg';
  import DarkIcon from './icons/dark.svg';
  import { deserialize, serialize } from './store';

  let dark = false;
  // let dark: boolean = !!(
  //   window.matchMedia &&
  //   window.matchMedia('(prefers-color-scheme: dark)').matches
  // );

  function saveFile(filename: string, data: BlobPart, type = 'text/plain') {
    const a = document.createElement('a');
    const file = new Blob([data], { type });
    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();
  }

  let fileInput = document.createElement('input');
  fileInput.type = 'file';
  function openFile(multiple = false) {
    return new Promise((res, rej) => {
      fileInput.onchange = null;
      fileInput.value = null;
      fileInput.multiple = multiple;
      fileInput.click();

      fileInput.onchange = () => {
        res(fileInput.files);
      };
    });
  }

  function loadJSON(file: File) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.addEventListener('load', (e) => {
        try {
          res(JSON.parse(e.target.result as string));
        } catch (e) {
          rej(e);
        }
      });
      reader.addEventListener('error', (e) => {
        rej(e);
      });
      reader.readAsText(file);
    });
  }

  function upload() {
    openFile()
      .then(([json]) => loadJSON(json))
      .then((data) => {
        deserialize(data);
      })
      .catch((err) => {
        alert('There was an error loading the file\n' + err);
      });
  }

  $: changeTheme(dark);
  function changeTheme(dark: boolean) {
    if (dark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
</script>

<nav>
  <h1>Wallgraph</h1>
  <div class="right-side">
    <button on:click={upload}>{@html UploadIcon}</button>
    <button
      on:click={() => saveFile('wallgraph.json', serialize(), 'application/json')}>{@html DownloadIcon}</button>
    <button on:click={() => (dark = !dark)}>
      {#if dark}
        {@html LightIcon}
      {:else}
        {@html DarkIcon}
      {/if}</button>
  </div>
</nav>

<svelte:body class:dark-theme={dark} />

<style>
  nav {
    display: flex;
    align-items: center;
    background: var(--background);
    position: relative;
    z-index: 2;
    padding: 0 2em;
    box-shadow: 0 2px 3px var(--shadow);
  }

  .right-side {
    margin-left: auto;
    display: flex;
  }

  h1 {
    margin: 18px 0;
  }

  button {
    color: var(--faded-text);
    border: 0;
    outline: 0;
    border-radius: 5px;
    padding: 4px;
    cursor: pointer;
    /* font-size: 0; */
  }

  button:hover {
    color: var(--text);
    background: var(--graph-background);
  }

  nav button :global(svg) {
    display: block;
  }
</style>
