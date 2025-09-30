/**
 * Movement System for Dollkin2
 * 
 * Handles entity movement, dashing, and trail effects.
 * Implements state-based movement mechanics for the combat system.
 */

export interface Entity {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  dashSpeed: number;
  size: number;
  isDashing: boolean;
  isMoving: boolean;
  isIdle: boolean; // Added for combat state tracking
  dashDirection: { x: number, y: number };
  dashTimeRemaining: number;
  dashCooldownRemaining?: number; // Optional, managed by game canvas
  lastMovementDirX: number;
  lastMovementDirY: number;
  trail: TrailPoint[];
}

export interface TrailPoint {
  x: number;
  y: number;
  size: number;
  alpha: number;
  age: number;
}

export class MovementSystem {
  // Constants
  readonly DASH_DURATION = 0.3; // seconds
  readonly DASH_SPEED = 500; // Reduced from 800 to 500 for more controlled dashing
  readonly MAX_TRAIL_POINTS = 20;
  readonly TRAIL_POINT_LIFETIME = 0.5; // seconds
  readonly TRAIL_FADE_RATE = 2.0; // How quickly trail points fade
  
  // State-based movement modifiers
  readonly IDLE_SPEED_MULTIPLIER = 0.0; // No movement in IDLE state
  readonly MOVING_SPEED_MULTIPLIER = 1.0; // Normal speed in MOVING state
  readonly DASH_SPEED_MULTIPLIER = 1.0; // Normal dash speed
  
  // Combat advantage modifiers
  readonly IDLE_SHOOT_BONUS = 1.5; // Damage bonus when shooting while idle
  
  // Debug flag
  private debug = true;

  /**
   * Update entity movement based on its current state
   */
  updateMovement(entity: Entity, deltaTime: number): void {
    // Update entity state flags
    this.updateEntityState(entity);
    
    // Handle movement based on state
    if (entity.isDashing) {
      this.handleDashMovement(entity, deltaTime);
    } else if (entity.isMoving) {
      this.handleNormalMovement(entity, deltaTime);
    } else if (entity.isIdle) {
      this.handleIdleState(entity, deltaTime);
    }
    
    // Update trail effects
    this.updateTrail(entity, deltaTime);
  }
  
  /**
   * Update entity state flags based on current conditions
   */
  private updateEntityState(entity: Entity): void {
    // An entity is considered moving if it has non-zero velocity
    const hasVelocity = Math.abs(entity.velocityX) > 0.1 || Math.abs(entity.velocityY) > 0.1;
    
    // Update isMoving flag
    entity.isMoving = !entity.isDashing && hasVelocity;
    
    // Update isIdle flag - entity is idle if not dashing and not moving
    entity.isIdle = !entity.isDashing && !entity.isMoving;
    
    // Log state changes for debugging
    if (this.debug) {
      console.log(`Entity ${entity.id} state: isDashing=${entity.isDashing}, isMoving=${entity.isMoving}, isIdle=${entity.isIdle}`);
    }
  }

  /**
   * Handle movement when entity is dashing
   */
  handleDashMovement(entity: Entity, deltaTime: number): void {
    // Apply dash velocity
    entity.x += entity.dashDirection.x * entity.dashSpeed * this.DASH_SPEED_MULTIPLIER * deltaTime;
    entity.y += entity.dashDirection.y * entity.dashSpeed * this.DASH_SPEED_MULTIPLIER * deltaTime;
    
    // Add trail points more frequently during dash
    if (Math.random() < 0.5) {
      this.addTrailPoint(entity);
    }
    
    // Decrease dash time remaining
    entity.dashTimeRemaining -= deltaTime;
    
    // End dash if time is up
    if (entity.dashTimeRemaining <= 0) {
      entity.isDashing = false;
      entity.dashTimeRemaining = 0;
      
      // Apply a brief slowdown after dash ends (dash recovery)
      entity.velocityX *= 0.5;
      entity.velocityY *= 0.5;
      
      if (this.debug) {
        console.log(`Dash ended for entity ${entity.id}`);
      }
    }
  }

  /**
   * Handle movement when entity is in normal moving state
   */
  handleNormalMovement(entity: Entity, deltaTime: number): void {
    // Apply friction to gradually slow down
    entity.velocityX *= 0.9;
    entity.velocityY *= 0.9;
    
    // Add trail points occasionally during movement
    if (Math.random() < 0.2) {
      this.addTrailPoint(entity);
    }
    
    // Update last movement direction if moving
    if (Math.abs(entity.velocityX) > 0.1 || Math.abs(entity.velocityY) > 0.1) {
      const magnitude = Math.sqrt(entity.velocityX * entity.velocityX + entity.velocityY * entity.velocityY);
      entity.lastMovementDirX = entity.velocityX / magnitude;
      entity.lastMovementDirY = entity.velocityY / magnitude;
    }
  }

  /**
   * Handle entity behavior when in idle state
   */
  handleIdleState(entity: Entity, deltaTime: number): void {
    // In idle state, entity doesn't move but can still perform other actions
    entity.velocityX = 0;
    entity.velocityY = 0;
    
    // No trail points added in idle state
  }

  /**
   * Add a trail point behind the entity
   */
  addTrailPoint(entity: Entity): void {
    // Create a new trail point
    const trailPoint: TrailPoint = {
      x: entity.x,
      y: entity.y,
      size: entity.size * (entity.isDashing ? 0.7 : 0.5), // Larger trail during dash
      alpha: entity.isDashing ? 0.8 : 0.6, // More visible trail during dash
      age: 0
    };
    
    // Add to trail array
    entity.trail.push(trailPoint);
    
    // Limit trail length
    if (entity.trail.length > this.MAX_TRAIL_POINTS) {
      entity.trail.shift();
    }
  }

  /**
   * Update trail points (age and fade them)
   */
  updateTrail(entity: Entity, deltaTime: number): void {
    // Update each trail point
    for (let i = entity.trail.length - 1; i >= 0; i--) {
      const point = entity.trail[i];
      
      // Age the point
      point.age += deltaTime;
      
      // Fade based on age
      point.alpha = Math.max(0, point.alpha - (deltaTime * this.TRAIL_FADE_RATE));
      
      // Remove if too old or completely faded
      if (point.age > this.TRAIL_POINT_LIFETIME || point.alpha <= 0) {
        entity.trail.splice(i, 1);
      }
    }
  }

  /**
   * Start a dash in the specified direction
   */
  startDash(entity: Entity, dirX: number, dirY: number): void {
    // Don't start a new dash if already dashing
    if (entity.isDashing) return;
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    let normalizedDirX: number;
    let normalizedDirY: number;
    
    if (length === 0) {
      // If no direction provided, use last movement direction
      normalizedDirX = entity.lastMovementDirX || 0;
      normalizedDirY = entity.lastMovementDirY || 1;
    } else {
      normalizedDirX = dirX / length;
      normalizedDirY = dirY / length;
    }
    
    // Set dash properties
    entity.isDashing = true;
    entity.isMoving = false;
    entity.isIdle = false;
    entity.dashDirection = { x: normalizedDirX, y: normalizedDirY };
    entity.dashTimeRemaining = this.DASH_DURATION;
    
    // Clear existing velocity
    entity.velocityX = 0;
    entity.velocityY = 0;
    
    // Add initial trail point
    this.addTrailPoint(entity);
    
    if (this.debug) {
      console.log(`Started dash for entity ${entity.id} in direction (${normalizedDirX.toFixed(2)}, ${normalizedDirY.toFixed(2)})`);
    }
  }
} 