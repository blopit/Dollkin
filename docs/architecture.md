# Dollkin2 Game Architecture

This document outlines the architecture of the Dollkin2 game, detailing the system design, component structure, and interactions between different modules.

## Overview

Dollkin2 is a top-down adventure roguelite game with touch controls designed for mobile browsers. The game is built using Svelte and TypeScript, with rendering done on HTML5 Canvas.

## Core Architecture

```
+----------------+      +----------------+      +----------------+
|                |      |                |      |                |
|  Game Engine   <----->  Entity System  <----->  Render System  |
|                |      |                |      |                |
+-------^--------+      +----------------+      +----------------+
        |
        |
+-------v--------+      +----------------+      +----------------+
|                |      |                |      |                |
|  Input System  <----->  Player System  <----->  Combat System  |
|                |      |                |      |                |
+----------------+      +----------------+      +----------------+
                                |
                                |
                        +-------v--------+      +----------------+
                        |                |      |                |
                        |  Enemy System  <----->  AI System      |
                        |                |      |                |
                        +----------------+      +----------------+

```

## Core Modules

### Game Engine

The central coordinator that manages the game loop, state transitions, and interaction between systems.

**Key Responsibilities:**
- Maintaining the game loop with `requestAnimationFrame`
- Managing delta time for consistent updates
- Coordinating system updates in the correct order
- Handling game state transitions (playing, paused, game over)

### Entity System

Manages all game entities and their lifecycle.

**Key Responsibilities:**
- Entity creation, updating, and destruction
- Component management
- Collision detection
- Entity querying

### Render System

Handles all rendering operations on the canvas.

**Key Responsibilities:**
- Clearing and preparing the canvas
- Rendering entities in the correct order
- Camera management
- Visual effects
- UI rendering

### Input System

Manages user input from touch and keyboard.

**Key Responsibilities:**
- Touch input handling
- Virtual joystick implementation
- Action button detection
- Input state management

### Player System

Manages player-specific logic.

**Key Responsibilities:**
- Player movement
- Player health and state
- Player abilities and attacks
- Player animations

### Combat System

Handles all combat-related logic.

**Key Responsibilities:**
- Attack mechanics
- Damage calculation
- Hit detection
- Combat effects

### Enemy System

Manages enemy-specific logic.

**Key Responsibilities:**
- Enemy spawning
- Enemy types and behaviors
- Enemy health and state
- Enemy animations

### AI System

Controls enemy decision making and behavior.

**Key Responsibilities:**
- Pathfinding
- Target selection
- Behavior states
- Decision making

## Data Flow

```
User Input -> Input System -> Player System -> Entity System
                                 |
                                 V
                           Combat System <-> Enemy System <-> AI System
                                 |
                                 V
                           Entity System -> Render System -> Canvas
```

## State Management

The game uses Svelte stores for state management:

1. **Game State**: Overall game state including health, score, level, etc.
2. **Input State**: Current input values from touch or keyboard
3. **Entity State**: Collection of all active entities
4. **Level State**: Current level information

## Component Design

### Entity Component System (ECS)

The game uses a simplified Entity Component System approach:

```typescript
// Base entity interface
interface Entity {
  id: string;
  components: Map<string, Component>;
  position: Vector2;
  active: boolean;
  
  // Methods
  addComponent(component: Component): void;
  removeComponent(componentName: string): void;
  getComponent<T extends Component>(componentName: string): T;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

// Base component interface
interface Component {
  name: string;
  entity: Entity | null;
  
  // Methods
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  onAttach(entity: Entity): void;
  onDetach(): void;
}
```

### Core Components

1. **SpriteComponent**: Handles rendering sprites and animations
2. **ColliderComponent**: Manages collision detection
3. **MovementComponent**: Controls entity movement
4. **HealthComponent**: Manages health and damage
5. **AIComponent**: Controls enemy behavior
6. **PlayerControllerComponent**: Manages player input response

## Level Generation

Levels are procedurally generated using a room-based approach:

1. Generate rooms of varying sizes
2. Connect rooms with corridors
3. Place entrance and exit
4. Populate with enemies, obstacles, and items

## Touch Controls

```
+-----------------+                       +-----------------+
|                 |                       |                 |
|                 |                       |                 |
|                 |                       |      Action     |
|     Virtual     |                       |      Button     |
|     Joystick    |                       |                 |
|                 |                       |                 |
|                 |                       |                 |
+-----------------+                       +-----------------+
```

The screen is divided into two sections:
- Left side: Virtual joystick for movement
- Right side: Action buttons for attacks and abilities

## Performance Considerations

1. **Object Pooling**: Reuse entities to reduce garbage collection
2. **Culling**: Only render entities visible on screen
3. **Optimized Collision**: Use spatial partitioning for collision detection
4. **Asset Loading**: Preload assets and cache them
5. **Touch Input**: Optimize touch event handling for responsiveness

## Saving and Loading

Game progress is saved using browser localStorage:

1. **Game Progress**: Current level, score, unlocked abilities
2. **Player Stats**: Health, abilities, equipment
3. **Settings**: Sound volume, control preferences

## Technical Requirements

- **Browser Compatibility**: Chrome, Safari, Firefox on mobile
- **Performance Target**: 60fps on mid-range mobile devices
- **Storage Limits**: <5MB localStorage usage
- **Offline Support**: Service worker for offline play

## Implementation Considerations

1. **Canvas Scaling**: Handle different screen sizes and pixel ratios
2. **Input Responsiveness**: Ensure touch input is responsive
3. **Memory Management**: Prevent memory leaks from unused event listeners
4. **Browser Limitations**: Handle mobile browser quirks
5. **Battery Usage**: Optimize for lower power consumption

## System Interactions

### Player Movement Example

```
Input System (detects joystick movement)
        |
        v
Player System (updates player direction)
        |
        v
Movement Component (applies velocity)
        |
        v
Collision System (checks for obstacles)
        |
        v
Entity System (updates position)
        |
        v
Render System (draws player at new position)
```

### Combat Example

```
Input System (detects action button press)
        |
        v
Player System (initiates attack)
        |
        v
Combat System (calculates hit area)
        |
        v
Entity System (checks for entities in hit area)
        |
        v
Enemy System (applies damage to hit enemies)
        |
        v
Render System (displays attack animation and damage effects)
```

## Code Organization

```
/src
  /lib
    /components
      /game        # Game-specific Svelte components
      /ui          # UI components
    /game
      /core        # Core game engine
      /entities    # Entity definitions
      /components  # Component definitions
      /systems     # Game systems
      /levels      # Level generation
    /stores        # Svelte stores
    /utils         # Utility functions
  /routes          # SvelteKit routes
  /static
    /assets
      /sprites     # Game sprites
      /audio       # Game audio
      /fonts       # Game fonts
```

## Testing Approach

1. **Unit Testing**: Test individual components and systems
2. **Integration Testing**: Test interactions between systems
3. **Performance Testing**: Ensure game runs smoothly on target devices
4. **Playability Testing**: Test on actual mobile devices with touch input 