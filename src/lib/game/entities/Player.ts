import { Entity } from '../core/Entity';
import { Vector2 } from '$lib/utils/Vector2';
import { SpriteComponent } from '../components/SpriteComponent';
import { MovementComponent } from '../components/MovementComponent';
import { CollisionComponent, CollisionShape, CollisionLayer } from '../components/CollisionComponent';
import { AnimationComponent } from '../components/AnimationComponent';
import type { InputState } from '../systems/inputSystem';
import type { Readable } from 'svelte/store';
import { Projectile } from './Projectile';
import type { GameWorld } from '../core/GameWorld';

export class Player extends Entity {
  private inputState: Readable<InputState>;
  private movementComponent: MovementComponent;
  private spriteComponent: SpriteComponent;
  private animationComponent: AnimationComponent;
  private collisionComponent: CollisionComponent;
  private currentInputState: InputState = {
    direction: { x: 0, y: 0 },
    action: false,
    special: false
  };
  
  // Trail effect for creature-like movement
  public trail: Array<{
    x: number;
    y: number;
    size: number;
    alpha: number;
    age: number;
    offsetX?: number;
    offsetY?: number;
  }> = [];
  
  // Vampire Survivors-like auto-attack properties
  private autoAttackTimer = 0;
  private autoAttackInterval = 1.0; // Attack every 1 second
  private projectileCount = 3; // Start with 3 projectiles
  private projectileSpeed = 200;
  private projectileDamage = 10;
  
  // Reference to the game world
  private gameWorld: GameWorld;
  
  constructor(position: Vector2, inputState: Readable<InputState>, gameWorld: GameWorld) {
    super(position);
    
    this.inputState = inputState;
    this.gameWorld = gameWorld;
    this.addTag('player');
    
    // Add sprite component with larger size
    this.spriteComponent = new SpriteComponent({
      source: 'assets/sprites/player.png', // Path to player sprite sheet
      width: 64, // Increased from 32 to 64
      height: 64, // Increased from 32 to 64
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 32,
      sourceHeight: 32,
      centered: true
    });
    this.addComponent(this.spriteComponent);
    
    // Add animation component
    this.animationComponent = new AnimationComponent({
      spriteComponentName: 'sprite'
    });
    
    // Add idle animation sequence
    this.animationComponent.addSequence({
      name: 'idle',
      frames: [
        { x: 0, y: 0, width: 32, height: 32, duration: 0.125 },
        { x: 32, y: 0, width: 32, height: 32, duration: 0.125 },
        { x: 64, y: 0, width: 32, height: 32, duration: 0.125 },
        { x: 96, y: 0, width: 32, height: 32, duration: 0.125 }
      ],
      loop: true
    });
    
    // Add walk animation sequence
    this.animationComponent.addSequence({
      name: 'walk',
      frames: [
        { x: 0, y: 32, width: 32, height: 32, duration: 0.1 },
        { x: 32, y: 32, width: 32, height: 32, duration: 0.1 },
        { x: 64, y: 32, width: 32, height: 32, duration: 0.1 },
        { x: 96, y: 32, width: 32, height: 32, duration: 0.1 }
      ],
      loop: true
    });
    
    this.animationComponent.setSequence('idle');
    this.addComponent(this.animationComponent);
    
    // Add movement component with increased speed
    this.movementComponent = new MovementComponent({
      maxSpeed: 200, // Increased from 150 to 200
      acceleration: 1000, // Increased from 800 to 1000
      friction: 400,
      // Creature-like movement settings
      turnRate: 0.7, // Slightly slower turning for more organic feel
      oscillationAmount: 0.12, // Subtle bobbing while moving
      oscillationSpeed: 6, // Moderate oscillation speed
      movementRandomness: 0.03 // Very slight randomness for natural imperfection
    });
    this.addComponent(this.movementComponent);
    
    // Add collision component with increased size
    this.collisionComponent = new CollisionComponent({
      shape: CollisionShape.Rectangle,
      width: 32, // Increased from 16 to 32
      height: 32, // Increased from 16 to 32
      offset: new Vector2(16, 32),
      layer: CollisionLayer.Player,
      debug: true
    });
    this.addComponent(this.collisionComponent);
    
    // Subscribe to input state
    const unsubscribe = this.inputState.subscribe(value => {
      this.currentInputState = value;
    });
  }
  
  update(deltaTime: number): void {
    // Handle movement based on input
    const direction = new Vector2(0, 0);
    
    if (this.currentInputState.direction.x !== 0 || this.currentInputState.direction.y !== 0) {
      // Use the joystick/directional input directly
      direction.x = this.currentInputState.direction.x;
      direction.y = this.currentInputState.direction.y;
      
      // Set walking animation
      this.animationComponent.setSequence('walk');
      
      // Adjust animation speed based on movement speed
      const speed = Math.sqrt(
        this.currentInputState.direction.x * this.currentInputState.direction.x + 
        this.currentInputState.direction.y * this.currentInputState.direction.y
      );
      // Scale animation speed with movement speed (faster movement = faster animation)
      const animSpeed = 0.8 + (speed * 0.4); // Range from 0.8 to 1.2
      this.animationComponent.setPlaybackSpeed(animSpeed);
    } else {
      // Set idle animation
      this.animationComponent.setSequence('idle');
      // Reset animation speed
      this.animationComponent.setPlaybackSpeed(1.0);
    }
    
    // Update movement direction
    this.movementComponent.setDirection(direction);
    
    // Handle action button (manual attack)
    if (this.currentInputState.action) {
      // Use manual attack with the current movement direction
      this.manualAttack();
    }
    
    // Handle special button
    if (this.currentInputState.special) {
      // Perform special ability
      console.log('Player special ability!');
    }
    
    // Vampire Survivors-like auto-attack
    this.autoAttackTimer += deltaTime;
    if (this.autoAttackTimer >= this.autoAttackInterval) {
      this.autoAttackTimer = 0;
      this.attack(); // Use the circular attack pattern for auto-attacks
    }
    
    // Call the parent update method to update all components
    super.update(deltaTime);
  }
  
  // Attack method for auto-attack (circular pattern)
  private attack(): void {
    // Create projectiles in multiple directions
    const angleStep = (Math.PI * 2) / this.projectileCount;
    
    for (let i = 0; i < this.projectileCount; i++) {
      const angle = i * angleStep;
      const direction = new Vector2(
        Math.cos(angle),
        Math.sin(angle)
      );
      
      // Create a projectile entity
      this.createProjectile(direction);
    }
  }
  
  // Manual attack method that uses the current movement direction
  private manualAttack(): void {
    // Get the current movement direction from input
    const dirX = this.currentInputState.direction.x;
    const dirY = this.currentInputState.direction.y;
    
    // Only shoot if there's a direction (magnitude > 0)
    const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
    if (magnitude > 0.1) {
      // Create a normalized Vector2 from the direction
      // Use the same direction as the joystick input
      const direction = new Vector2(
        dirX / magnitude,
        dirY / magnitude
      );
      
      // Create a projectile entity with this direction
      this.createProjectile(direction);
    }
  }
  
  // Helper method to create a projectile
  private createProjectile(direction: Vector2): void {
    // Create a new projectile entity
    const projectile = new Projectile({
      position: new Vector2(this.position.x, this.position.y),
      direction: direction,
      speed: this.projectileSpeed,
      damage: this.projectileDamage,
      lifespan: 2.0
    });
    
    // Add the projectile to the game world
    this.gameWorld.getEntityManager().add(projectile);
  }
} 