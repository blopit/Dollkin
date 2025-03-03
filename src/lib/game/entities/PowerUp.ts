import { Entity } from '../core/Entity';
import { Vector2 } from '$lib/utils/Vector2';
import { SpriteComponent } from '../components/SpriteComponent';
import { CollisionComponent, CollisionShape, CollisionLayer } from '../components/CollisionComponent';
import type { CollisionResult } from '../components/CollisionComponent';
import { POWERUP_SPRITE_BASE64 } from '../assets/GameAssets';

export enum PowerUpType {
  Health = 0,
  Speed = 1,
  Damage = 2,
  FireRate = 3
}

export interface PowerUpOptions {
  position: Vector2;
  type: PowerUpType;
  value?: number;
  duration?: number; // Duration in seconds for temporary power-ups
}

export class PowerUp extends Entity {
  private spriteComponent: SpriteComponent;
  private collisionComponent: CollisionComponent;
  private type: PowerUpType;
  private value: number;
  private duration: number;
  private bobAmount = 4; // Pixels to move up and down
  private bobSpeed = 2; // Speed of bobbing animation
  private initialY: number;
  private time = 0;
  
  constructor(options: PowerUpOptions) {
    super(options.position);
    
    this.addTag('powerup');
    this.type = options.type;
    this.value = options.value || 1;
    this.duration = options.duration || 0; // 0 means permanent
    this.initialY = options.position.y;
    
    // Add sprite component
    this.spriteComponent = new SpriteComponent({
      source: POWERUP_SPRITE_BASE64,
      width: 24,
      height: 24,
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 16,
      sourceHeight: 16,
      centered: true,
      scale: 1.2
    });
    this.addComponent(this.spriteComponent);
    
    // Add collision component
    this.collisionComponent = new CollisionComponent({
      shape: CollisionShape.Circle,
      width: 20,
      layer: CollisionLayer.Pickup,
      debug: true
    });
    this.addComponent(this.collisionComponent);
    
    // Set up collision callback
    this.collisionComponent.setCallbacks(
      (result: CollisionResult) => {
        if (result.other?.entity?.hasTag('player')) {
          // Player collected the power-up
          this.onCollect(result.other.entity);
          this.destroy();
        }
      }
    );
  }
  
  update(deltaTime: number): void {
    // Update time for bobbing animation
    this.time += deltaTime * this.bobSpeed;
    
    // Apply bobbing motion
    const bobOffset = Math.sin(this.time) * this.bobAmount;
    this.position.y = this.initialY + bobOffset;
    
    // Call the parent update method to update all components
    super.update(deltaTime);
  }
  
  onCollect(player: Entity): void {
    // Apply power-up effect based on type
    console.log(`Player collected ${PowerUpType[this.type]} power-up!`);
    
    // Different effects based on power-up type
    switch (this.type) {
      case PowerUpType.Health:
        // Heal player
        console.log(`Healing player by ${this.value}`);
        break;
        
      case PowerUpType.Speed:
        // Increase player speed
        console.log(`Increasing player speed by ${this.value}`);
        break;
        
      case PowerUpType.Damage:
        // Increase player damage
        console.log(`Increasing player damage by ${this.value}`);
        break;
        
      case PowerUpType.FireRate:
        // Increase player fire rate
        console.log(`Increasing player fire rate by ${this.value}`);
        break;
    }
  }
  
  getType(): PowerUpType {
    return this.type;
  }
  
  getValue(): number {
    return this.value;
  }
  
  getDuration(): number {
    return this.duration;
  }
} 