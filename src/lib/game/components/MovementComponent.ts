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
  /** Turn rate - how quickly the entity can change direction (0-1, default: 0.8) */
  turnRate?: number;
  /** Oscillation amount - how much the entity bobs while moving (0-1, default: 0.15) */
  oscillationAmount?: number;
  /** Oscillation speed - how quickly the entity bobs (default: 5) */
  oscillationSpeed?: number;
  /** Movement randomness - adds slight natural imperfection (0-1, default: 0.05) */
  movementRandomness?: number;
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
  
  /** Target direction - where the entity wants to go */
  private targetDirection: Vector2 = new Vector2(0, 0);
  
  /** Turn rate - how quickly the entity can change direction (0-1) */
  private turnRate: number;
  
  /** Oscillation amount - how much the entity bobs while moving (0-1) */
  private oscillationAmount: number;
  
  /** Oscillation speed - how quickly the entity bobs */
  private oscillationSpeed: number;
  
  /** Movement randomness - adds slight natural imperfection (0-1) */
  private movementRandomness: number;
  
  /** Oscillation timer for bobbing effect */
  private oscillationTimer = 0;
  
  /** Previous speed for acceleration curve */
  private previousSpeed = 0;
  
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
    
    // Creature-like movement properties
    this.turnRate = options.turnRate !== undefined ? options.turnRate : 0.8;
    this.oscillationAmount = options.oscillationAmount !== undefined ? options.oscillationAmount : 0.15;
    this.oscillationSpeed = options.oscillationSpeed !== undefined ? options.oscillationSpeed : 5;
    this.movementRandomness = options.movementRandomness !== undefined ? options.movementRandomness : 0.05;
  }
  
  /**
   * Set the movement direction
   * @param direction The direction vector (will be normalized)
   */
  public setDirection(direction: Vector2): void {
    if (direction.x === 0 && direction.y === 0) {
      this.targetDirection = direction.clone();
    } else {
      // Normalize the direction and set as target
      this.targetDirection = direction.normalize();
    }
    
    // Note: We don't immediately set this.direction anymore
    // Instead, we'll gradually turn towards the target direction
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
   * Set the turn rate
   * @param turnRate New turn rate (0-1)
   */
  public setTurnRate(turnRate: number): void {
    this.turnRate = Math.max(0, Math.min(1, turnRate));
  }
  
  /**
   * Set the oscillation amount
   * @param amount New oscillation amount (0-1)
   */
  public setOscillationAmount(amount: number): void {
    this.oscillationAmount = Math.max(0, Math.min(1, amount));
  }
  
  /**
   * Set the oscillation speed
   * @param speed New oscillation speed
   */
  public setOscillationSpeed(speed: number): void {
    this.oscillationSpeed = speed;
  }
  
  /**
   * Set the movement randomness
   * @param randomness New movement randomness (0-1)
   */
  public setMovementRandomness(randomness: number): void {
    this.movementRandomness = Math.max(0, Math.min(1, randomness));
  }
  
  /**
   * Apply an organic easing function to make acceleration/deceleration feel more natural
   * @param t Value between 0 and 1
   * @returns Eased value between 0 and 1
   */
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
  }
  
  /**
   * Update the movement
   * @param deltaTime Time since last update in seconds
   */
  public update(deltaTime: number): void {
    if (!this.entity) return;
    
    // Update oscillation timer
    this.oscillationTimer += deltaTime * this.oscillationSpeed;
    
    // Gradually turn towards the target direction (momentum-based turning)
    if (this.targetDirection.x !== 0 || this.targetDirection.y !== 0) {
      // Interpolate between current direction and target direction
      if (this.direction.x === 0 && this.direction.y === 0) {
        // If we're starting from zero, initialize direction
        this.direction = this.targetDirection.clone();
      } else {
        // Otherwise, gradually turn towards target
        const turnAmount = this.turnRate * deltaTime * 10; // Adjust for smoother turning
        
        // Interpolate direction
        this.direction.x += (this.targetDirection.x - this.direction.x) * turnAmount;
        this.direction.y += (this.targetDirection.y - this.direction.y) * turnAmount;
        
        // Re-normalize direction
        if (this.direction.x !== 0 || this.direction.y !== 0) {
          this.direction = this.direction.normalize();
        }
      }
      
      // Add slight randomness to direction for natural movement
      if (this.movementRandomness > 0) {
        const randomX = (Math.random() * 2 - 1) * this.movementRandomness;
        const randomY = (Math.random() * 2 - 1) * this.movementRandomness;
        
        this.direction.x += randomX * deltaTime;
        this.direction.y += randomY * deltaTime;
        
        // Re-normalize direction
        if (this.direction.x !== 0 || this.direction.y !== 0) {
          this.direction = this.direction.normalize();
        }
      }
      
      // Calculate acceleration this frame with organic easing
      const currentSpeed = this.velocity.magnitude();
      const speedRatio = currentSpeed / this.maxSpeed;
      const accelerationMultiplier = this.easeInOutQuad(1 - speedRatio);
      const accelAmount = this.acceleration * accelerationMultiplier * deltaTime;
      
      // Apply acceleration in the movement direction
      this.velocity.x += this.direction.x * accelAmount;
      this.velocity.y += this.direction.y * accelAmount;
      
      // Cap velocity to max speed
      const speed = this.velocity.magnitude();
      if (speed > this.maxSpeed) {
        this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
        this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
      }
      
      // Store speed for next frame
      this.previousSpeed = speed;
    } 
    // Apply friction when no input
    else if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      // Reset direction when not moving
      this.direction.x = 0;
      this.direction.y = 0;
      
      // Calculate friction this frame with organic easing
      const currentSpeed = this.velocity.magnitude();
      const speedRatio = currentSpeed / this.maxSpeed;
      const frictionMultiplier = this.easeInOutQuad(speedRatio);
      const frictionAmount = this.friction * frictionMultiplier * deltaTime;
      
      // Calculate normalized velocity
      const normalized = this.velocity.normalize();
      
      // If friction would stop us completely
      if (currentSpeed <= frictionAmount) {
        this.velocity.x = 0;
        this.velocity.y = 0;
      } else {
        // Apply friction against movement direction
        this.velocity.x -= normalized.x * frictionAmount;
        this.velocity.y -= normalized.y * frictionAmount;
      }
      
      // Store speed for next frame
      this.previousSpeed = this.velocity.magnitude();
    }
    
    // Update position based on velocity with oscillation
    if (this.velocity.x !== 0 || this.velocity.y !== 0) {
      // Calculate base movement
      const moveX = this.velocity.x * deltaTime;
      const moveY = this.velocity.y * deltaTime;
      
      // Apply oscillation if moving and oscillation is enabled
      let oscillationX = 0;
      let oscillationY = 0;
      
      if (this.oscillationAmount > 0) {
        // Calculate speed ratio for oscillation strength
        const speedRatio = this.velocity.magnitude() / this.maxSpeed;
        
        // Calculate perpendicular vector to movement for side-to-side bobbing
        const perpX = -this.velocity.y;
        const perpY = this.velocity.x;
        
        // Normalize perpendicular vector
        const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
        const normPerpX = perpX / perpLength;
        const normPerpY = perpY / perpLength;
        
        // Calculate oscillation based on sine wave
        const oscillationFactor = Math.sin(this.oscillationTimer) * this.oscillationAmount * speedRatio;
        
        // Apply oscillation perpendicular to movement direction
        oscillationX = normPerpX * oscillationFactor;
        oscillationY = normPerpY * oscillationFactor;
      }
      
      // Apply movement with oscillation
      this.entity.position.x += moveX + oscillationX;
      this.entity.position.y += moveY + oscillationY;
    }
  }
} 