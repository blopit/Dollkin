<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gameState } from '$lib/stores/gameStore';
  
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let lastTimestamp = 0;
  
  // Canvas dimensions
  let width: number;
  let height: number;
  
  onMount(() => {
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    resizeCanvas();
    startGameLoop();
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  });
  
  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
  
  function resizeCanvas() {
    if (!canvas) return;
    
    // Set canvas to full window size
    width = window.innerWidth;
    height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    // Apply any necessary scaling or adjustments
    // ...
  }
  
  function startGameLoop() {
    const loop = (timestamp: number) => {
      // Calculate delta time in seconds
      const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.1); // Cap at 100ms
      lastTimestamp = timestamp;
      
      // Skip updates if game is paused
      if (!$gameState.paused) {
        update(deltaTime);
      }
      
      // Always render (to show pause screen, etc.)
      render();
      
      // Continue loop
      animationId = requestAnimationFrame(loop);
    };
    
    // Start the loop
    animationId = requestAnimationFrame(loop);
  }
  
  function update(deltaTime: number) {
    // Update game state
    if ($gameState.gameOver) return;
    
    // Update player, enemies, etc.
    // ...
  }
  
  function render() {
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    if ($gameState.gameOver) {
      renderGameOver();
      return;
    }
    
    if ($gameState.paused) {
      renderPaused();
      return;
    }
    
    // Main game rendering
    renderGame();
  }
  
  function renderGame() {
    // Render world
    // ...
    
    // Render entities
    // ...
    
    // Render UI
    renderUI();
  }
  
  function renderUI() {
    if (!ctx) return;
    
    // Draw health bar
    const healthBarWidth = 150;
    const healthBarHeight = 20;
    const healthBarX = 20;
    const healthBarY = 20;
    
    // Health bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Health bar fill
    const fillWidth = ($gameState.playerHealth / $gameState.maxPlayerHealth) * healthBarWidth;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(healthBarX, healthBarY, fillWidth, healthBarHeight);
    
    // Health bar border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Score display
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.fillText(`Score: ${$gameState.score}`, 20, 60);
    ctx.fillText(`Level: ${$gameState.level}`, 20, 85);
  }
  
  function renderPaused() {
    if (!ctx) return;
    
    // First render the game in the background
    renderGame();
    
    // Overlay with semi-transparent dark layer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    // Display pause message
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', width / 2, height / 2 - 24);
    ctx.font = '24px Arial';
    ctx.fillText('Tap to resume', width / 2, height / 2 + 24);
    ctx.textAlign = 'left';
  }
  
  function renderGameOver() {
    if (!ctx) return;
    
    // First render the game in the background
    renderGame();
    
    // Overlay with semi-transparent dark layer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    // Display game over message
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 24);
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${$gameState.score}`, width / 2, height / 2 + 24);
    ctx.fillText('Tap to restart', width / 2, height / 2 + 64);
    ctx.textAlign = 'left';
  }
  
  function handleCanvasClick() {
    if ($gameState.gameOver) {
      // Restart game
      gameState.resetGame();
      return;
    }
    
    if ($gameState.paused) {
      // Unpause game
      gameState.set({ ...$gameState, paused: false });
      return;
    }
  }
</script>

<canvas 
  bind:this={canvas}
  width={width}
  height={height}
  on:click={handleCanvasClick}
  class="game-canvas"
></canvas>

<style>
  .game-canvas {
    width: 100%;
    height: 100%;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    touch-action: none; /* Prevent default touch actions */
    background-color: #111; /* Dark background */
  }
</style> 