<script lang="ts">
  import GameCanvas from '$lib/components/GameCanvas.svelte';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  // Game settings
  let debug = false;
  let fullscreen = false;
  
  // Toggle debug mode
  function toggleDebug() {
    debug = !debug;
  }
  
  // Toggle fullscreen
  function toggleFullscreen() {
    if (!browser) return;
    
    try {
      if (!document.fullscreenElement) {
        // Request fullscreen on the game container
        const gameContainer = document.querySelector('.game-wrapper');
        if (gameContainer) {
          if (gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen();
          } 
          // For Safari
          else if ((gameContainer as any).webkitRequestFullscreen) {
            (gameContainer as any).webkitRequestFullscreen();
          }
          // For Firefox
          else if ((gameContainer as any).mozRequestFullScreen) {
            (gameContainer as any).mozRequestFullScreen();
          }
          // For IE/Edge
          else if ((gameContainer as any).msRequestFullscreen) {
            (gameContainer as any).msRequestFullscreen();
          }
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        // For Safari
        else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        // For Firefox
        else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        }
        // For IE/Edge
        else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  }
  
  // Handle fullscreen change
  function handleFullscreenChange() {
    fullscreen = !!document.fullscreenElement;
    console.log("Fullscreen state changed:", fullscreen);
  }
  
  // Lifecycle hooks
  onMount(() => {
    if (!browser) return;
    
    // Add fullscreen change listeners for all browser variants
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  });
</script>

<svelte:head>
  <title>Dollkin2 - Game</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<div class="game-page" class:fullscreen>
  <div class="game-wrapper">
    {#if browser}
      <GameCanvas {debug} />
    {/if}
  </div>
  
  <div class="controls">
    <button on:click={toggleDebug} class="control-btn">
      {debug ? 'Disable Debug' : 'Enable Debug'}
    </button>
    
    <button on:click={toggleFullscreen} class="control-btn fullscreen-btn">
      {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
    </button>
  </div>
</div>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    touch-action: none;
  }
  
  .game-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background-color: #000;
    color: #fff;
    position: relative;
    touch-action: none;
  }
  
  .game-wrapper {
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    touch-action: none;
  }
  
  .controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.5);
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    transition: opacity 0.3s ease;
  }
  
  .fullscreen .controls {
    opacity: 0.3;
  }
  
  .fullscreen .controls:hover {
    opacity: 1;
  }
  
  .control-btn {
    padding: 0.75rem 1.5rem;
    background-color: rgba(50, 50, 50, 0.8);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: background-color 0.2s;
  }
  
  .control-btn:hover {
    background-color: rgba(70, 70, 70, 0.8);
  }
  
  .fullscreen-btn {
    background-color: rgba(0, 100, 200, 0.6);
  }
  
  .fullscreen-btn:hover {
    background-color: rgba(0, 120, 220, 0.8);
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