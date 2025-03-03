import { Entity } from '../core/Entity';
import { Vector2 } from '$lib/utils/Vector2';
import { SpriteComponent } from '../components/SpriteComponent';
import { MovementComponent } from '../components/MovementComponent';
import { CollisionComponent, CollisionShape, CollisionLayer, type CollisionResult } from '../components/CollisionComponent';
import { ENEMY_SPRITE_BASE64 } from '../assets/GameAssets';
import type { GameWorld } from '../core/GameWorld';

export interface EnemyOptions {
  position: Vector2;
  health?: number;
  speed?: number;
  size?: number;
}

export class Enemy extends Entity {
  private spriteComponent: SpriteComponent;
  private movementComponent: MovementComponent;
  private collisionComponent: CollisionComponent;
  private health: number;
  private gameWorld: GameWorld;
  private targetEntity: Entity | null = null;
  private size: number;
  
  constructor(options: EnemyOptions, gameWorld: GameWorld) {
    super(options.position);
    
    this.addTag('enemy');
    this.health = options.health || 10;
    this.size = options.size || 32;
    this.gameWorld = gameWorld;
    
    // Add sprite component
    this.spriteComponent = new SpriteComponent({
      source: ENEMY_SPRITE_BASE64,
      width: this.size,
      height: this.size,
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 16,
      sourceHeight: 16,
      centered: true,
      scale: 1.5
    });
    this.addComponent(this.spriteComponent);
    
    // Add movement component
    this.movementComponent = new MovementComponent({
      maxSpeed: options.speed || 50,
      acceleration: 200,
      friction: 0.1
    });
    this.addComponent(this.movementComponent);
    
    // Add collision component
    this.collisionComponent = new CollisionComponent({
      shape: CollisionShape.Circle,
      width: this.size * 0.8, // Slightly smaller than visual size
      layer: CollisionLayer.Enemy,
      debug: true
    });
    this.addComponent(this.collisionComponent);
    
    // Set up collision callback
    this.collisionComponent.setCallbacks(
      (result: CollisionResult) => {
        if (result.other?.entity?.hasTag('projectile')) {
          // Take damage from projectile
          this.takeDamage(5); // Default damage amount
        }
      }
    );
  }
  
  update(deltaTime: number): void {
    // Find target if we don't have one
    if (!this.targetEntity) {
      // Look for player entity
      const entities = this.gameWorld.getEntityManager().getByTag('player');
      if (entities.length > 0) {
        this.targetEntity = entities[0];
      }
    }
    
    // Move towards target if we have one
    if (this.targetEntity && this.targetEntity.active) {
      const targetPos = this.targetEntity.getPosition();
      const direction = targetPos.subtract(this.position).normalize();
      this.movementComponent.setDirection(direction);
    } else {
      // No target, stop moving
      this.movementComponent.setDirection(new Vector2(0, 0));
      // Clear target reference if it's inactive
      this.targetEntity = null;
    }
    
    // Call the parent update method to update all components
    super.update(deltaTime);
  }
  
  takeDamage(amount: number): void {
    this.health -= amount;
    
    // Flash the sprite when taking damage
    this.spriteComponent.setAlpha(0.5);
    
    // Store reference to component and entity for use in timeout
    const spriteComponent = this.spriteComponent;
    const entity = this;
    
    setTimeout(() => {
      // Check if entity is still active
      if (entity.active) {
        spriteComponent.setAlpha(1);
      }
    }, 100);
    
    // Check if dead
    if (this.health <= 0) {
      this.destroy();
    }
  }
  
  getHealth(): number {
    return this.health;
  }
} 