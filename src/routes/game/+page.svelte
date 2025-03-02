<script lang="ts">
  import GameCanvas from '$lib/components/GameCanvas.svelte';
  import { onMount } from 'svelte';
  
  // Game settings
  let debug = false;
  let fullscreen = false;
  
  // Toggle debug mode
  function toggleDebug() {
    debug = !debug;
  }
  
  // Toggle fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      fullscreen = true;
    } else {
      document.exitFullscreen();
      fullscreen = false;
    }
  }
  
  // Handle fullscreen change
  function handleFullscreenChange() {
    fullscreen = !!document.fullscreenElement;
  }
  
  // Lifecycle hooks
  onMount(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  });
</script>

<svelte:head>
  <title>Dollkin2 - Game</title>
</svelte:head>

<div class="game-page" class:fullscreen>
  <div class="game-wrapper">
    <GameCanvas {debug} />
  </div>
  
  <div class="controls">
    <button on:click={toggleDebug}>
      {debug ? 'Disable Debug' : 'Enable Debug'}
    </button>
    
    <button on:click={toggleFullscreen}>
      {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
    </button>
  </div>
</div>

<style>
  .game-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background-color: #222;
    color: #fff;
  }
  
  .game-wrapper {
    flex: 1;
    width: 100%;
    overflow: hidden;
    position: relative;
  }
  
  .controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background-color: #333;
    transition: opacity 0.3s ease;
  }
  
  .fullscreen .controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    opacity: 0.3;
  }
  
  .fullscreen .controls:hover {
    opacity: 1;
  }
  
  button {
    padding: 0.5rem 1rem;
    background-color: #555;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }
  
  button:hover {
    background-color: #777;
  }
  
  .fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }
</style> 