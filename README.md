# Dollkin2

![Dollkin2 Logo](docs/images/logo.png)

A top-down adventure roguelite game with touch controls, built with SvelteKit and HTML Canvas.

## 🎮 Project Overview

Dollkin2's gameplay combines the exploration of top-down adventure games with the unpredictability of roguelite mechanics, all optimized for touch controls on mobile devices.

### MVP Features

- **Intuitive Touch Controls**: Virtual joystick for movement and action buttons for abilities
- **Procedural Level Generation**: Randomly generated rooms and corridors for endless variety
- **Combat System**: Real-time combat with different enemy types and attack patterns
- **Progression System**: Unlock new abilities and improvements as you play
- **Roguelite Elements**: Permadeath with persistent unlocks between runs

## 🔧 Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Web application framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) - For game rendering
- [Vite](https://vitejs.dev/) - Fast build tool and development server

## 📁 Project Structure

```
dollkin2/
├── docs/                 # Documentation files
│   ├── architecture.md   # Game architecture design
│   └── implementation-plan.md # Implementation roadmap
│
├── src/
│   ├── lib/              # Library code
│   │   ├── components/   # Svelte components
│   │   │   ├── game/     # Game-specific components
│   │   │   └── ui/       # User interface components
│   │   │
│   │   ├── game/         # Game logic
│   │   │   ├── core/     # Core game systems
│   │   │   ├── entities/ # Game entities
│   │   │   ├── components/ # Entity components
│   │   │   ├── systems/  # Game systems
│   │   │   └── levels/   # Level generation
│   │   │
│   │   ├── stores/       # Svelte stores for state management
│   │   └── utils/        # Utility functions
│   │
│   ├── routes/           # SvelteKit routes
│   └── app.html          # Main HTML template
│
├── static/               # Static assets
│   ├── assets/
│   │   ├── sprites/      # Game sprites
│   │   ├── audio/        # Game audio
│   │   └── fonts/        # Game fonts
│   │
│   ├── favicon.png       # Site favicon
│   └── manifest.json     # PWA manifest
│
├── package.json          # Project dependencies
├── svelte.config.js      # Svelte configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## 🚀 Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (v7 or later)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dollkin2.git
   cd dollkin2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🏗️ Game Architecture

The game is built using a modular architecture with several key systems:

### Core Systems

- **Game Engine**: Manages the game loop and coordinates other systems
- **Entity System**: Handles entity lifecycle and component management
- **Render System**: Controls all canvas rendering operations
- **Input System**: Processes touch and keyboard input
- **Level System**: Generates and manages procedural levels

See the [architecture document](docs/architecture.md) for more details.

## 📋 Implementation Plan

The game development is organized into four phases:

1. **Core Setup**: Project structure, game loop, basic systems
2. **Basic Gameplay**: Player, input, enemies, combat
3. **Game Structure**: Level generation, game states, UI
4. **Polish**: Visual feedback, audio, performance optimization

See the [implementation plan](docs/implementation-plan.md) for the detailed roadmap.

## 📱 Touch Controls

The game uses a virtual joystick for movement (left side of screen) and action buttons for abilities (right side of screen). The control system is optimized for mobile play with:

- Responsive virtual joystick with position-independent activation
- Large, easily tappable action buttons
- Multi-touch support for simultaneous movement and actions

## 🎨 Assets and Resources

The game uses a combination of custom and free/open source assets. All external assets are properly attributed in the [credits](CREDITS.md) file.

## 📊 Roadmap

### Phase 1: MVP (Current)
- Basic gameplay loop
- Core mechanics
- Simple levels
- Basic enemy types

### Phase 2: Enhanced Content
- More enemy types
- Additional player abilities
- Enhanced level generation
- Visual improvements

### Phase 3: Feature Expansion
- Special items and power-ups
- Boss encounters
- Meta-progression system
- Audio enhancements

### Phase 4: Polish and Optimization
- Performance optimization
- Mobile-specific enhancements
- Additional content
- Quality of life improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📬 Contact

For any questions or suggestions, please open an issue on GitHub or contact the project maintainers directly.

## Current Implementation Status

The game now has a basic framework implemented with the following components:

### Core Systems
- **Entity Component System**: A flexible component-based architecture for game entities
- **Game World**: Manages entities, systems, and the game loop
- **Input System**: Handles both touch and keyboard input
- **Collision System**: Detects and resolves collisions between entities

### Game Components
- **Entity**: Base class for all game objects with component support
- **SpriteComponent**: Renders sprites for entities
- **AnimationComponent**: Handles sprite animations
- **MovementComponent**: Controls entity movement with physics
- **CollisionComponent**: Provides collision detection

### Game Structure
- **Home Page**: Simple landing page with game information
- **Game Page**: Canvas-based game view with debug controls
- **Player Entity**: Basic player implementation with movement and animations

## Next Steps

To continue development, consider the following tasks:

1. **Asset Creation**:
   - Create sprite sheets for the player character
   - Design environment tiles and objects
   - Create enemy sprites and animations

2. **Game Mechanics**:
   - Implement a level/room system
   - Add enemy AI and behavior
   - Create combat mechanics
   - Implement item and inventory systems

3. **Game Progression**:
   - Design the roguelite progression system
   - Implement character upgrades
   - Create procedural level generation

4. **Polish**:
   - Add sound effects and music
   - Implement particle effects
   - Add screen transitions
   - Create UI for health, inventory, etc.

## Running the Game

To run the game in development mode:

```bash
npm run dev
```

Then open your browser to `http://localhost:5173` to play the game.

## Building for Production

To build the game for production:

```bash
npm run build
```

The built files will be in the `build` directory and can be deployed to any static hosting service. 