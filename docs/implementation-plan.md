# Dollkin2 Implementation Plan

This document outlines the step-by-step implementation plan for developing the Dollkin2 game MVP.

## Phase 1: Core Setup (1-2 days)

### Day 1: Project Initialization
- [x] Set up project directory structure
- [ ] Initialize SvelteKit project with TypeScript
- [ ] Configure ESLint and Prettier
- [ ] Initialize Git repository
- [ ] Create initial documentation

### Day 2: Basic Game Engine
- [ ] Set up main Canvas component
- [ ] Implement basic game loop with requestAnimationFrame
- [ ] Create utility functions for common operations
- [ ] Set up game state management with Svelte stores
- [ ] Implement basic logging and debugging tools

## Phase 2: Basic Gameplay (3-5 days)

### Day 3: Player Implementation
- [ ] Create player entity class
- [ ] Implement basic player movement
- [ ] Add player sprite rendering
- [ ] Implement basic collision detection
- [ ] Create player state (health, position)

### Day 4: Input System
- [ ] Implement keyboard controls for development
- [ ] Create touch input system for mobile
- [ ] Add virtual joystick for movement
- [ ] Implement action buttons
- [ ] Add support for multi-touch

### Day 5-6: Enemy Implementation
- [ ] Create base enemy class
- [ ] Implement basic AI for following player
- [ ] Add enemy sprite rendering
- [ ] Create collision handling for enemies
- [ ] Implement basic combat (player attacks enemy)

### Day 7: Combat System
- [ ] Add health and damage system
- [ ] Implement attack mechanics
- [ ] Create hit detection system
- [ ] Add basic visual feedback for combat
- [ ] Implement enemy death and respawn

## Phase 3: Game Structure (2-3 days)

### Day 8: Level Generation
- [ ] Implement simple procedural room generation
- [ ] Create basic tilemap system
- [ ] Add walls and obstacles with collision
- [ ] Implement camera following player
- [ ] Create level exit/entrance mechanics

### Day 9: Game State
- [ ] Implement game state machine (menu, playing, paused, game over)
- [ ] Create level progression
- [ ] Add score and progress tracking
- [ ] Implement game reset functionality
- [ ] Create game over condition

### Day 10: Basic UI
- [ ] Create health bar display
- [ ] Add score/progress display
- [ ] Implement basic menus (start, pause)
- [ ] Create game over screen
- [ ] Add basic instructions for controls

## Phase 4: Polish for MVP (2-3 days)

### Day 11: Visual Feedback
- [ ] Add basic animations for player
- [ ] Implement simple particle effects for hits
- [ ] Create visual feedback for player damage
- [ ] Improve level visuals with basic decorations
- [ ] Add screen transitions

### Day 12: Audio and Performance
- [ ] Add basic sound effects for actions
- [ ] Implement simple background music
- [ ] Optimize rendering for performance
- [ ] Add mobile-specific optimizations
- [ ] Implement audio controls

### Day 13: Testing and Bug Fixing
- [ ] Test on multiple devices and browsers
- [ ] Fix critical gameplay bugs
- [ ] Address performance issues
- [ ] Improve control responsiveness
- [ ] Final balance adjustments

## Implementation Details

### Game Canvas Component
```html
<!-- src/lib/components/game/GameCanvas.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gameState } from '$lib/stores/gameStore';
  
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationId: number;
  let lastTimestamp = 0;
  
  onMount(() => {
    ctx = canvas.getContext('2d');
    startGameLoop();
    
    // Handle canvas resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  });
  
  onDestroy(() => {
    cancelAnimationFrame(animationId);
  });
  
  function startGameLoop() {
    const loop = (timestamp: number) => {
      // Calculate delta time
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Skip frames if tab is not focused
      if (deltaTime > 100) {
        animationId = requestAnimationFrame(loop);
        return;
      }
      
      // Update game state
      update(deltaTime);
      
      // Render game
      render();
      
      // Continue loop
      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
  }
  
  function update(deltaTime: number) {
    // Update game logic
    if ($gameState.paused || $gameState.gameOver) return;
    
    // Update player, enemies, etc.
  }
  
  function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render game elements
    if ($gameState.paused) {
      renderPauseScreen();
      return;
    }
    
    if ($gameState.gameOver) {
      renderGameOverScreen();
      return;
    }
    
    // Render game world, player, enemies, etc.
  }
  
  function renderPauseScreen() {
    // Render pause menu
  }
  
  function renderGameOverScreen() {
    // Render game over screen
  }
</script>

<canvas 
  bind:this={canvas}
  class="game-canvas"
></canvas>

<style>
  .game-canvas {
    width: 100%;
    height: 100%;
    touch-action: none;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
```

### Game State Store
```typescript
// src/lib/stores/gameStore.ts
import { writable } from 'svelte/store';

export interface GameState {
  playerHealth: number;
  maxPlayerHealth: number;
  score: number;
  level: number;
  gameOver: boolean;
  paused: boolean;
  victory: boolean;
}

const initialState: GameState = {
  playerHealth: 100,
  maxPlayerHealth: 100,
  score: 0,
  level: 1,
  gameOver: false,
  paused: false,
  victory: false
};

export const gameState = writable<GameState>(initialState);

export function resetGame() {
  gameState.set(initialState);
}

export function damagePlayer(amount: number) {
  gameState.update(state => {
    const newHealth = Math.max(0, state.playerHealth - amount);
    const gameOver = newHealth <= 0;
    
    return {
      ...state,
      playerHealth: newHealth,
      gameOver
    };
  });
}

export function healPlayer(amount: number) {
  gameState.update(state => {
    return {
      ...state,
      playerHealth: Math.min(state.maxPlayerHealth, state.playerHealth + amount)
    };
  });
}

export function addScore(points: number) {
  gameState.update(state => {
    return {
      ...state,
      score: state.score + points
    };
  });
}

export function togglePause() {
  gameState.update(state => {
    return {
      ...state,
      paused: !state.paused
    };
  });
}

export function nextLevel() {
  gameState.update(state => {
    return {
      ...state,
      level: state.level + 1
    };
  });
}
```

### Touch Controller
```typescript
// src/lib/game/systems/inputSystem.ts
import { writable } from 'svelte/store';

export interface InputState {
  direction: { x: number, y: number };
  action: boolean;
  special: boolean;
}

export const inputState = writable<InputState>({
  direction: { x: 0, y: 0 },
  action: false,
  special: false
});

export class TouchController {
  private joystickStartX = 0;
  private joystickStartY = 0;
  private joystickCurrentX = 0;
  private joystickCurrentY = 0;
  private joystickActive = false;
  private actionActive = false;
  private specialActive = false;
  
  constructor(element: HTMLElement) {
    // Add touch event listeners
    element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    element.addEventListener('touchmove', this.handleTouchMove.bind(this));
    element.addEventListener('touchend', this.handleTouchEnd.bind(this));
    element.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
  }
  
  private handleTouchStart(event: TouchEvent) {
    event.preventDefault();
    
    // Check for existing touch
    if (this.joystickActive) return;
    
    const touch = event.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // Determine if this is a joystick or action touch
    if (x < window.innerWidth / 2) {
      // Left side - joystick
      this.joystickStartX = x;
      this.joystickStartY = y;
      this.joystickCurrentX = x;
      this.joystickCurrentY = y;
      this.joystickActive = true;
    } else {
      // Right side - action button
      this.actionActive = true;
      
      // Update input state
      inputState.update(state => ({
        ...state,
        action: true
      }));
    }
  }
  
  private handleTouchMove(event: TouchEvent) {
    event.preventDefault();
    
    // Find the joystick touch
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      
      // Is this the joystick touch?
      if (this.joystickActive && touch.clientX < window.innerWidth / 2) {
        this.joystickCurrentX = touch.clientX;
        this.joystickCurrentY = touch.clientY;
        
        // Calculate direction vector
        const dx = this.joystickCurrentX - this.joystickStartX;
        const dy = this.joystickCurrentY - this.joystickStartY;
        
        // Normalize
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        const maxRadius = 50; // Maximum joystick radius
        
        if (magnitude > 0) {
          const normalizedX = dx / magnitude;
          const normalizedY = dy / magnitude;
          
          // Apply deadzone and limit radius
          if (magnitude > 10) { // Deadzone of 10px
            const limitedMagnitude = Math.min(magnitude, maxRadius);
            const factor = limitedMagnitude / maxRadius;
            
            // Update input state
            inputState.update(state => ({
              ...state,
              direction: { 
                x: normalizedX * factor, 
                y: normalizedY * factor 
              }
            }));
          } else {
            // Inside deadzone
            inputState.update(state => ({
              ...state,
              direction: { x: 0, y: 0 }
            }));
          }
        }
      }
    }
  }
  
  private handleTouchEnd(event: TouchEvent) {
    event.preventDefault();
    
    // Check if all touches are gone
    if (event.touches.length === 0) {
      this.joystickActive = false;
      this.actionActive = false;
      this.specialActive = false;
      
      // Reset input state
      inputState.update(state => ({
        ...state,
        direction: { x: 0, y: 0 },
        action: false,
        special: false
      }));
      return;
    }
    
    // Check remaining touches
    let joystickTouchFound = false;
    let actionTouchFound = false;
    
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      
      if (touch.clientX < window.innerWidth / 2) {
        joystickTouchFound = true;
      } else {
        actionTouchFound = true;
      }
    }
    
    if (!joystickTouchFound) {
      this.joystickActive = false;
      inputState.update(state => ({
        ...state,
        direction: { x: 0, y: 0 }
      }));
    }
    
    if (!actionTouchFound) {
      this.actionActive = false;
      inputState.update(state => ({
        ...state,
        action: false
      }));
    }
  }
  
  public destroy() {
    // Remove event listeners when component is destroyed
  }
}
```

## Testing Strategy

### Functional Testing
- Test player movement in all directions
- Verify collision detection works properly
- Ensure enemies behave as expected
- Test combat system functionality
- Verify level generation creates valid layouts

### Performance Testing
- Test frame rate on low-end devices
- Monitor memory usage during extended play
- Verify touch input responsiveness
- Test with various screen sizes and resolutions

### Compatibility Testing
- Test on different mobile browsers (Chrome, Safari, Firefox)
- Verify functionality on both Android and iOS devices
- Test on desktop browsers with touch emulation
- Check for resolution-specific issues

## Asset Requirements

### Sprites
- Player character (idle, walk, attack animations)
- Enemy types (at least 2 different enemies)
- Environment tiles (floor, walls, obstacles)
- Interactive objects (doors, treasure)

### Audio
- Background music
- Player movement sounds
- Attack sounds
- Enemy sounds
- UI interaction sounds

## Final Deliverables
- Functioning game that runs in mobile browsers
- Source code with documentation
- Asset attribution and licenses
- Instructions for building and deploying
- Known issues and limitations 