import { BaseComponent } from '../core/Component';
import { Vector2 } from '$lib/utils/Vector2';

/**
 * MovementComponent options
 */
export interface MovementComponentOptions {
  /** Maximum speed (units per second) */
  maxSpeed?: number;
  /** Acceleration (units per second squared) */
  acceleration?: number;
  /** Deceleration when no input (units per second squared) */
  friction?: number;
  /** Initial velocity */
  initialVelocity?: Vector2;
}

/**
 * MovementComponent
 * Handles entity movement with acceleration and friction
 */
export class MovementComponent extends BaseComponent {
  /** Current velocity */
  private velocity: Vector2;
  
  /** Maximum speed */
  private maxSpeed: number;
  
  /** Acceleration (units per second squared) */
  private acceleration: number;
  
  /** Deceleration when no input (units per second squared) */
  private friction: number;
  
  /** Current movement direction (normalized) */
  private direction: Vector2 = new Vector2(0, 0);
  
  /**
   * Constructor
   * @param options Movement options
   */
  constructor(options: MovementComponentOptions = {}) {
    super('movement');
    
    // Set properties with defaults
    this.velocity = options.initialVelocity || new Vector2(0, 0);
    this.maxSpeed = options.maxSpeed || 200;
    this.acceleration = options.acceleration || 800;
    this.friction = options.friction || 400;
  }
  
  /**
   * Set the movement direction
   * @param direction The direction vector (will be normalized)
   */
  public setDirection(direction: Vector2): void {
    if (direction.x === 0 && direction.y === 0) {
      this.direction = direction.clone();
    } else {
      // Normalize the direction
      this.direction = direction.normalize();
    }
  }
  
  /**
   * Get the current velocity
   * @returns Current velocity vector
   */
  public getVelocity(): Vector2 {
    return this.velocity.clone();
  }
  
  /**
   * Set the velocity directly
   * @param velocity New velocity
   */
  public setVelocity(velocity: Vector2): void {
    this.velocity = velocity.clone();
    
    // Cap velocity
    if (this.velocity.magnitude() > this.maxSpeed) {
      this.velocity = this.velocity.normalize().multiply(this.maxSpeed);
    }
  }
  
  /**
   * Get the current speed (magnitude of velocity)
   * @returns Current speed
   */
  public getSpeed(): number {
    return this.velocity.magnitude();
  }
  
  /**
   * Set the maximum speed
   * @param maxSpeed New maximum speed
   */
  public setMaxSpeed(maxSpeed: number): void {
    this.maxSpeed = maxSpeed;
  }
  
  /**
   * Set the acceleration
   * @param acceleration New acceleration
   */
  public setAcceleration(acceleration: number): void {
    this.acceleration = acceleration;
  }
  
  /**
   * Set the friction
   * @param friction New friction
   */
  public setFriction(friction: number): void {
    this.friction = friction;
  }
  
  /**
   * Update the movement
   * @param deltaTime Time since last update in seconds
   */
  public update(deltaTime: number): void {
    if (!this.entity) return;
    
    // Handle acceleration based on direction
    if (this.direction.x !== 0 || this.direction.y !== 0) {
      // Calculate acceleration this frame
      const accelAmount = this.acceleration * deltaTime;
      
      // Apply acceleration in the movement direction
      this.velocity.x += this.direction.x * accelAmount;
      this.velocity.y += this.direction.y * accelAmount;
      
      // Cap velocity to max speed
      const speed = this.velocity.magnitude();
      if (speed > this.maxSpeed) {
        this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
        this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
      }
    } 
    // Apply friction when no input
    else if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      // Calculate friction this frame
      const frictionAmount = this.friction * deltaTime;
      
      // Calculate speed and normalized velocity
      const speed = this.velocity.magnitude();
      const normalized = this.velocity.normalize();
      
      // If friction would stop us completely
      if (speed <= frictionAmount) {
        this.velocity.x = 0;
        this.velocity.y = 0;
      } else {
        // Apply friction against movement direction
        this.velocity.x -= normalized.x * frictionAmount;
        this.velocity.y -= normalized.y * frictionAmount;
      }
    }
    
    // Update position based on velocity
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      this.entity.position.x += this.velocity.x * deltaTime;
      this.entity.position.y += this.velocity.y * deltaTime;
    }
  }
} 