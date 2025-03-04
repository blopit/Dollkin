import { Entity } from '../core/Entity';
import type { Vector2 } from '$lib/utils/Vector2';
import { SpriteComponent } from '../components/SpriteComponent';
import { MovementComponent } from '../components/MovementComponent';
import { CollisionComponent, CollisionShape, CollisionLayer, type CollisionResult } from '../components/CollisionComponent';
import { PROJECTILE_SPRITE_BASE64 } from '../assets/GameAssets';

export interface ProjectileOptions {
  position: Vector2;
  direction: Vector2; // The shooting direction (same as joystick direction)
  speed: number;
  damage: number;
  lifespan?: number; // Time in seconds before auto-destruction
}

export class Projectile extends Entity {
  private movementComponent: MovementComponent;
  private spriteComponent: SpriteComponent;
  private collisionComponent: CollisionComponent;
  private damage: number;
  private lifespan: number;
  private age = 0;
  
  constructor(options: ProjectileOptions) {
    super(options.position);
    
    this.addTag('projectile');
    this.damage = options.damage;
    this.lifespan = options.lifespan || 2.0; // Default 2 seconds lifespan
    
    // Add sprite component
    this.spriteComponent = new SpriteComponent({
      source: PROJECTILE_SPRITE_BASE64, // Use base64-encoded sprite instead of file path
      width: 16,
      height: 16,
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 16,
      sourceHeight: 16,
      centered: true
    });
    this.addComponent(this.spriteComponent);
    
    // Add movement component
    this.movementComponent = new MovementComponent({
      maxSpeed: options.speed,
      acceleration: 5000, // High acceleration for instant speed
      friction: 0 // No friction for projectiles
    });
    this.addComponent(this.movementComponent);
    
    // Set direction immediately (already reversed in Player.manualAttack)
    this.movementComponent.setDirection(options.direction);
    
    // Add collision component
    this.collisionComponent = new CollisionComponent({
      shape: CollisionShape.Circle,
      width: 16, // For circle, width is the diameter/radius
      layer: CollisionLayer.Projectile,
      debug: true
    });
    this.addComponent(this.collisionComponent);
    
    // Set up collision callback
    this.collisionComponent.setCallbacks(
      (result: CollisionResult) => {
        if (result.other?.entity?.hasTag('enemy')) {
          // Damage enemy
          // TODO: Implement damage system
          console.log('Hit enemy!');
          this.destroy();
        }
      }
    );
  }
  
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // Update age and destroy if lifespan exceeded
    this.age += deltaTime;
    if (this.age >= this.lifespan) {
      this.destroy();
    }
  }
  
  getDamage(): number {
    return this.damage;
  }
} 