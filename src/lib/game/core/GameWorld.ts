import { EntityManager } from './EntityManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import type { inputState } from '../systems/inputSystem';
import { get, type Readable } from 'svelte/store';
import { Enemy } from '../entities/Enemy';
import { PowerUp, PowerUpType } from '../entities/PowerUp';
import { Vector2 } from '$lib/utils/Vector2';
import type { Entity } from './Entity';

/**
 * GameWorld options
 */
export interface GameWorldOptions {
  /** Width of the game world */
  width: number;
  /** Height of the game world */
  height: number;
  /** Debug mode */
  debug?: boolean;
}

/**
 * GameWorld class
 * Manages the game world, entities, and systems
 */
export class GameWorld {
  /** Entity manager */
  private entityManager: EntityManager;
  
  /** Collision system */
  private collisionSystem: CollisionSystem;
  
  /** Width of the game world */
  private width: number;
  
  /** Height of the game world */
  private height: number;
  
  /** Debug mode */
  private debug: boolean;
  
  /** Last update timestamp */
  private lastUpdateTime = 0;
  
  /** Whether the game is paused */
  private paused = false;
  
  /** Input state store */
  private inputState: Readable<unknown> | null = null;
  
  /** Systems to update */
  private systems: Array<{ update: (deltaTime: number) => void }> = [];
  
  /**
   * Constructor
   * @param options Game world options
   */
  constructor(options: GameWorldOptions) {
    // Set properties
    this.width = options.width;
    this.height = options.height;
    this.debug = options.debug || false;
    
    // Create entity manager
    this.entityManager = new EntityManager();
    
    // Create collision system
    this.collisionSystem = new CollisionSystem(this.entityManager, {
      debug: this.debug
    });
    
    // Add collision system to systems list
    this.systems.push(this.collisionSystem);
  }
  
  /**
   * Initialize the game world
   * @param inputState Input state store
   */
  public initialize(inputState: Readable<unknown>): void {
    this.inputState = inputState;
    this.lastUpdateTime = performance.now();
  }
  
  /**
   * Update the game world
   * @param timestamp Current timestamp
   */
  public update(timestamp: number): void {
    // Skip if paused
    if (this.paused) return;
    
    // Calculate delta time (in seconds)
    const deltaTime = (timestamp - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = timestamp;
    
    // Cap delta time to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
    // Update all systems
    for (const system of this.systems) {
      system.update(cappedDeltaTime);
    }
    
    // Update all entities
    this.entityManager.update(cappedDeltaTime);
  }
  
  /**
   * Render the game world
   * @param ctx Rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Clear the canvas
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Render all entities
    this.entityManager.render(ctx);
    
    // Render debug info if enabled
    if (this.debug) {
      this.renderDebugInfo(ctx);
    }
  }
  
  /**
   * Render debug information
   * @param ctx Rendering context
   */
  private renderDebugInfo(ctx: CanvasRenderingContext2D): void {
    // Set debug text style
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Entity count
    const entityCount = this.entityManager.getAll().length;
    ctx.fillText(`Entities: ${entityCount}`, 10, 10);
    
    // Input state
    if (this.inputState) {
      const input = get(this.inputState);
      ctx.fillText(`Input: ${JSON.stringify(input)}`, 10, 30);
    }
    
    // FPS (based on delta time)
    const fps = Math.round(1000 / (performance.now() - this.lastUpdateTime));
    ctx.fillText(`FPS: ${fps}`, 10, 50);
  }
  
  /**
   * Add a system to the game world
   * @param system System to add
   */
  public addSystem(system: { update: (deltaTime: number) => void }): void {
    this.systems.push(system);
  }
  
  /**
   * Get the entity manager
   * @returns Entity manager
   */
  public getEntityManager(): EntityManager {
    return this.entityManager;
  }
  
  /**
   * Get the collision system
   * @returns Collision system
   */
  public getCollisionSystem(): CollisionSystem {
    return this.collisionSystem;
  }
  
  /**
   * Get the width of the game world
   * @returns Width
   */
  public getWidth(): number {
    return this.width;
  }
  
  /**
   * Get the height of the game world
   * @returns Height
   */
  public getHeight(): number {
    return this.height;
  }
  
  /**
   * Set the size of the game world
   * @param width New width
   * @param height New height
   */
  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  /**
   * Pause the game world
   */
  public pause(): void {
    this.paused = true;
  }
  
  /**
   * Resume the game world
   */
  public resume(): void {
    this.paused = false;
    this.lastUpdateTime = performance.now();
  }
  
  /**
   * Toggle pause state
   * @returns New pause state
   */
  public togglePause(): boolean {
    this.paused = !this.paused;
    
    if (!this.paused) {
      this.lastUpdateTime = performance.now();
    }
    
    return this.paused;
  }
  
  /**
   * Check if the game is paused
   * @returns Whether the game is paused
   */
  public isPaused(): boolean {
    return this.paused;
  }
  
  /**
   * Set debug mode
   * @param debug Whether to enable debug mode
   */
  public setDebug(debug: boolean): void {
    this.debug = debug;
    this.collisionSystem.setDebug(debug);
  }
  
  /**
   * Check if debug mode is enabled
   * @returns Whether debug mode is enabled
   */
  public isDebug(): boolean {
    return this.debug;
  }
  
  /**
   * Spawn an enemy at a random position
   * @returns The spawned enemy
   */
  spawnEnemy(): Enemy {
    // Calculate a random position outside the screen but within the world bounds
    const padding = 100; // Distance from edge of screen
    const playerPos = this.getPlayer()?.position || new Vector2(this.width / 2, this.height / 2);
    
    // Choose a random side (0: top, 1: right, 2: bottom, 3: left)
    const side = Math.floor(Math.random() * 4);
    
    let x = 0;
    let y = 0;
    
    switch (side) {
      case 0: // Top
        x = Math.random() * this.width;
        y = -padding;
        break;
      case 1: // Right
        x = this.width + padding;
        y = Math.random() * this.height;
        break;
      case 2: // Bottom
        x = Math.random() * this.width;
        y = this.height + padding;
        break;
      case 3: // Left
        x = -padding;
        y = Math.random() * this.height;
        break;
    }
    
    // Create the enemy
    const enemy = new Enemy({
      position: new Vector2(x, y),
      health: 10,
      speed: 50 + Math.random() * 30 // Random speed between 50-80
    }, this);
    
    // Add to entity manager
    this.entityManager.add(enemy);
    
    return enemy;
  }
  
  /**
   * Spawn a power-up at a random position
   * @returns The spawned power-up
   */
  spawnPowerUp(): PowerUp {
    // Calculate a random position within the world bounds
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;
    
    // Choose a random power-up type
    const types = [
      PowerUpType.Health,
      PowerUpType.Speed,
      PowerUpType.Damage,
      PowerUpType.FireRate
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Create the power-up
    const powerUp = new PowerUp({
      position: new Vector2(x, y),
      type,
      value: 1 + Math.floor(Math.random() * 3) // Random value between 1-3
    });
    
    // Add to entity manager
    this.entityManager.add(powerUp);
    
    return powerUp;
  }
  
  /**
   * Get the player entity
   * @returns The player entity, or null if not found
   */
  getPlayer(): Entity | null {
    const players = this.entityManager.getByTag('player');
    return players.length > 0 ? players[0] : null;
  }
} 