/**
 * Projectile System for Dollkin2
 * 
 * Handles projectile creation, movement, and special effects like reflection during dash.
 */

export interface Projectile {
  id: string;
  x: number;
  y: number;
  direction: { x: number, y: number };
  speed: number;
  damage: number;
  size: number;
  color: string;
  isReflected: boolean;
  ownerId: string; // ID of the entity that created the projectile
  lifeTime: number; // How long the projectile has existed
  maxLifeTime: number; // Maximum lifetime before despawning
  type?: string; // Type of projectile (standard, flamethrower, etc.)
}

export class ProjectileSystem {
  private projectiles: Projectile[] = [];
  private nextId = 0;
  private debug = true; // Enable debug logging

  // Constants for reflection
  private readonly REFLECTION_SPEED_MULTIPLIER = 1.5;
  private readonly REFLECTION_DAMAGE_MULTIPLIER = 2.0;
  private readonly REFLECTION_COLOR = '#ffaa00';
  private readonly REFLECTION_SIZE_MULTIPLIER = 1.2;

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debug = enabled;
    console.log(`ProjectileSystem debug mode: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Create a new projectile
   */
  createProjectile(
    x: number, 
    y: number, 
    direction: { x: number, y: number }, 
    speed: number,
    damage: number,
    size: number,
    color: string,
    ownerId: string,
    maxLifeTime: number = 5.0, // Default 5 seconds lifetime
    type: string = 'standard' // Default projectile type
  ): Projectile {
    // Calculate normalized direction
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    
    // Default direction or normalized direction
    const normalizedX = length === 0 ? 0 : direction.x / length;
    const normalizedY = length === 0 ? 1 : direction.y / length;

    const projectile: Projectile = {
      id: `projectile_${this.nextId++}`,
      x,
      y,
      direction: { x: normalizedX, y: normalizedY },
      speed,
      damage,
      size,
      color,
      isReflected: false,
      ownerId,
      lifeTime: 0,
      maxLifeTime,
      type
    };

    if (this.debug) {
      console.log(`Created projectile: ${JSON.stringify({
        id: projectile.id,
        position: { x: projectile.x, y: projectile.y },
        direction: projectile.direction,
        speed: projectile.speed,
        damage: projectile.damage,
        size: projectile.size,
        type: projectile.type
      })}`);
    }

    this.projectiles.push(projectile);
    return projectile;
  }

  /**
   * Update all projectiles
   */
  update(deltaTime: number): void {
    if (this.debug && this.projectiles.length > 0) {
      console.log(`Updating ${this.projectiles.length} projectiles with deltaTime: ${deltaTime}`);
    }
    
    // Update each projectile
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      
      // Move projectile
      projectile.x += projectile.direction.x * projectile.speed * deltaTime;
      projectile.y += projectile.direction.y * projectile.speed * deltaTime;
      
      // Update lifetime
      projectile.lifeTime += deltaTime;
      
      // Remove if expired
      if (projectile.lifeTime >= projectile.maxLifeTime) {
        if (this.debug) {
          console.log(`Projectile ${projectile.id} expired after ${projectile.lifeTime.toFixed(2)}s`);
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  /**
   * Get all active projectiles
   */
  getProjectiles(): Projectile[] {
    return this.projectiles;
  }

  /**
   * Remove a projectile by ID
   */
  removeProjectile(id: string): void {
    const index = this.projectiles.findIndex(p => p.id === id);
    if (index !== -1) {
      if (this.debug) {
        console.log(`Removing projectile ${id}`);
      }
      this.projectiles.splice(index, 1);
    }
  }

  /**
   * Handle projectile reflection during dash
   * @param projectile The projectile to potentially reflect
   * @param dashDirection The direction of the dash
   * @param dashingEntityId The ID of the entity that is dashing
   * @returns The reflected projectile or null if not reflected
   */
  handleDashReflection(
    projectile: Projectile, 
    dashDirection: { x: number, y: number }, 
    dashingEntityId: string
  ): Projectile | null {
    // Don't reflect already reflected projectiles
    if (projectile.isReflected) return null;
    
    // Don't reflect own projectiles
    if (projectile.ownerId === dashingEntityId) return null;
    
    // Normalize dash direction
    const length = Math.sqrt(dashDirection.x * dashDirection.x + dashDirection.y * dashDirection.y);
    if (length === 0) return null; // Can't reflect if no dash direction
    
    const normalizedDashDir = {
      x: dashDirection.x / length,
      y: dashDirection.y / length
    };
    
    // Create a new reflected projectile with enhanced properties
    const reflectedProjectile: Projectile = {
      ...projectile,
      direction: normalizedDashDir,
      speed: projectile.speed * this.REFLECTION_SPEED_MULTIPLIER,
      damage: projectile.damage * this.REFLECTION_DAMAGE_MULTIPLIER,
      size: projectile.size * this.REFLECTION_SIZE_MULTIPLIER,
      color: this.REFLECTION_COLOR,
      isReflected: true,
      ownerId: dashingEntityId // Transfer ownership to the reflecting entity
    };
    
    if (this.debug) {
      console.log(`Reflected projectile ${projectile.id}:
        - New direction: (${reflectedProjectile.direction.x.toFixed(2)}, ${reflectedProjectile.direction.y.toFixed(2)})
        - New speed: ${reflectedProjectile.speed.toFixed(2)} (x${this.REFLECTION_SPEED_MULTIPLIER})
        - New damage: ${reflectedProjectile.damage.toFixed(2)} (x${this.REFLECTION_DAMAGE_MULTIPLIER})
        - New owner: ${dashingEntityId}
      `);
    }
    
    // Replace the original projectile with the reflected one
    const index = this.projectiles.findIndex(p => p.id === projectile.id);
    if (index !== -1) {
      this.projectiles[index] = reflectedProjectile;
      return reflectedProjectile;
    }
    
    return null;
  }

  /**
   * Check if a projectile hits an entity
   */
  checkHit(projectile: Projectile, entity: { x: number, y: number, size: number, id: string }): boolean {
    // Don't hit the owner
    if (projectile.ownerId === entity.id) {
      if (this.debug) {
        console.log(`Projectile ${projectile.id} skipped collision check with owner ${entity.id}`);
      }
      return false;
    }
    
    // Validate input parameters
    if (projectile.x === undefined || projectile.y === undefined || 
        entity.x === undefined || entity.y === undefined ||
        projectile.size === undefined || entity.size === undefined) {
      console.error(`Invalid parameters for collision check:`, {
        projectile: {
          id: projectile.id,
          x: projectile.x,
          y: projectile.y,
          size: projectile.size
        },
        entity: {
          id: entity.id,
          x: entity.x,
          y: entity.y,
          size: entity.size
        }
      });
      return false;
    }
    
    // Simple circle collision
    const dx = projectile.x - entity.x;
    const dy = projectile.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const hitRadius = projectile.size + entity.size;
    const hit = distance < hitRadius;
    
    // Always log collision checks for debugging
    if (this.debug) {
      console.log(`Collision check: Projectile ${projectile.id} vs Entity ${entity.id}:
        - Distance: ${distance.toFixed(2)}
        - Hit radius: ${hitRadius.toFixed(2)}
        - Hit: ${hit}
        - Projectile pos: (${projectile.x.toFixed(2)}, ${projectile.y.toFixed(2)})
        - Entity pos: (${entity.x.toFixed(2)}, ${entity.y.toFixed(2)})
        - Projectile size: ${projectile.size}
        - Entity size: ${entity.size}
      `);
    }
    
    return hit;
  }
} 