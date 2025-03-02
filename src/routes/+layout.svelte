<script>
  import '../app.css';
</script>

<svelte:head>
  <title>Dollkin2</title>
  <meta name="description" content="A top-down adventure roguelite game" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<main>
  <slot />
</main>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  main {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
</style> 