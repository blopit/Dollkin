import type { WeaponProps, Projectile, SpecialAbilityResult } from './types';
import { SpreadPattern, SpecialAbility, StatusEffect } from './types';

// Weapon service to handle weapon functionality
export class WeaponService {
  // Add a utility method to generate unique IDs
  private generateUniqueId(): string {
    // Use crypto.randomUUID if available
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    
    // Fallback implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Generate projectiles based on weapon properties
  public generateProjectiles(
    weapon: WeaponProps,
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    charge = 1
  ): Projectile[] {
    const projectiles: Projectile[] = [];
    const count = weapon.projectileCount || 1;
    
    // Handle different spread patterns
    switch (weapon.spreadPattern) {
      case SpreadPattern.CIRCULAR: {
        // Create a circular spread pattern
        const angleStep = (2 * Math.PI) / count;
        
        for (let i = 0; i < count; i++) {
          const angle = i * angleStep;
          const newDirX = Math.cos(angle);
          const newDirY = Math.sin(angle);
          
          // Create projectile with new direction
          projectiles.push(this.createProjectile(weapon, x, y, newDirX, newDirY, charge));
        }
        break;
      }
      
      case SpreadPattern.HORIZONTAL: {
        // Create a horizontal spread pattern
        const spreadAngle = (weapon.accuracy || 0.1) * Math.PI / 4; // Max 45 degree spread
        
        for (let i = 0; i < count; i++) {
          // Calculate angle for this projectile
          let angle: number;
          if (count === 1) {
            angle = 0; // No spread for single projectile
          } else {
            // Distribute evenly across the horizontal line
            angle = spreadAngle * (2 * (i / (count - 1)) - 1);
          }
          
          // Calculate new direction with spread (only horizontal component)
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const newDirX = dirX * cos - dirY * sin;
          const newDirY = dirX * sin + dirY * cos;
          
          // Create projectile with new direction
          projectiles.push(this.createProjectile(weapon, x, y, newDirX, newDirY, charge));
        }
        break;
      }
      
      case SpreadPattern.VERTICAL: {
        // Create a vertical spread pattern
        const spreadAngle = (weapon.accuracy || 0.1) * Math.PI / 4; // Max 45 degree spread
        
        for (let i = 0; i < count; i++) {
          // Calculate angle for this projectile
          let angle: number;
          if (count === 1) {
            angle = 0; // No spread for single projectile
          } else {
            // Distribute evenly across the vertical line
            angle = spreadAngle * (2 * (i / (count - 1)) - 1);
          }
          
          // Calculate new direction with spread (vertical component)
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          // Swap X and Y for vertical spread
          const newDirX = dirX * cos + dirY * sin;
          const newDirY = -dirX * sin + dirY * cos;
          
          // Create projectile with new direction
          projectiles.push(this.createProjectile(weapon, x, y, newDirX, newDirY, charge));
        }
        break;
      }
      
      case SpreadPattern.TRIANGLE:
      case SpreadPattern.WAVE:
      case SpreadPattern.BURST: {
        // Create a random spread pattern for these complex patterns
        const spreadFactor = 1 - (weapon.accuracy || 0.7); // Higher accuracy = less spread
        
        for (let i = 0; i < count; i++) {
          // Add random variation to direction
          const randomAngle = (Math.random() * 2 - 1) * spreadFactor * Math.PI / 4;
          const cos = Math.cos(randomAngle);
          const sin = Math.sin(randomAngle);
          const newDirX = dirX * cos - dirY * sin;
          const newDirY = dirX * sin + dirY * cos;
          
          // Create projectile with new direction
          projectiles.push(this.createProjectile(weapon, x, y, newDirX, newDirY, charge));
        }
        break;
      }
      
      default: {
        // Default: single projectile or straight line (SpreadPattern.SINGLE)
        for (let i = 0; i < count; i++) {
          projectiles.push(this.createProjectile(weapon, x, y, dirX, dirY, charge));
        }
        break;
      }
    }
    
    return projectiles;
  }
  
  // Create a single projectile
  private createProjectile(
    weapon: WeaponProps, 
    x: number, 
    y: number, 
    dirX: number, 
    dirY: number, 
    charge = 1,
    angleOffset = 0
  ): Projectile {
    // Apply accuracy/spread
    const accuracy = weapon.accuracy || 1; // 0-1, where 1 is perfect accuracy
    const spreadFactor = (1 - accuracy) * 0.2; // Max spread of 0.2 radians at 0 accuracy
    
    // Apply angle offset and random spread
    let angle = Math.atan2(dirY, dirX) + angleOffset;
    if (accuracy < 1) {
      angle += (Math.random() - 0.5) * spreadFactor;
    }
    
    // Recalculate direction with spread
    const newDirX = Math.cos(angle);
    const newDirY = Math.sin(angle);
    
    // Calculate damage with charge multiplier
    const baseDamage = weapon.damage || 1;
    const damageMultiplier = weapon.chargeMultiplier || 1;
    const finalDamage = baseDamage * (charge ** damageMultiplier);
    
    // Calculate size with charge multiplier
    const baseSize = weapon.projectileSize || 5;
    const sizeMultiplier = weapon.chargeSizeMultiplier || 1;
    const finalSize = baseSize * (charge ** sizeMultiplier);
    
    // Create projectile
    return {
      id: this.generateUniqueId(),
      weaponId: weapon.id,
      x,
      y,
      size: finalSize,
      speed: weapon.projectileSpeed || 5,
      dirX: newDirX,
      dirY: newDirY,
      color: weapon.projectileColor || '#ffffff',
      type: weapon.projectileType || 'standard', // Use weapon's projectileType or default to 'standard'
      damage: finalDamage,
      lifetime: weapon.projectileLifetime || 2000,
      piercing: weapon.piercing || 0,
      bounces: weapon.bounces || 0,
      statusEffects: weapon.statusEffects || [],
      homing: weapon.homing || false,
      homingStrength: weapon.homingStrength || 0,
      homingRange: weapon.homingRange || 0
    };
  }
  
  // Generate circular spread pattern
  private generateCircularSpread(
    projectiles: Projectile[],
    weapon: WeaponProps,
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    count: number,
    charge: number
  ): void {
    const angleStep = (2 * Math.PI) / count;
    const baseAngle = Math.atan2(dirY, dirX);
    
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + i * angleStep;
      projectiles.push(
        this.createProjectile(
          weapon, 
          x, 
          y, 
          Math.cos(angle), 
          Math.sin(angle), 
          charge
        )
      );
    }
  }
  
  // Generate horizontal spread pattern
  private generateHorizontalSpread(
    projectiles: Projectile[],
    weapon: WeaponProps,
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    count: number,
    charge: number
  ): void {
    const baseAngle = Math.atan2(dirY, dirX);
    const spreadAngle = weapon.spreadAngle || Math.PI / 6; // 30 degrees by default
    
    if (count === 1) {
      projectiles.push(this.createProjectile(weapon, x, y, dirX, dirY, charge));
      return;
    }
    
    const angleStep = spreadAngle / (count - 1);
    const startAngle = baseAngle - spreadAngle / 2;
    
    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;
      projectiles.push(
        this.createProjectile(
          weapon, 
          x, 
          y, 
          Math.cos(angle), 
          Math.sin(angle), 
          charge
        )
      );
    }
  }
  
  // Generate vertical spread pattern
  private generateVerticalSpread(
    projectiles: Projectile[],
    weapon: WeaponProps,
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    count: number,
    charge: number
  ): void {
    // Similar to horizontal but rotated 90 degrees
    const baseAngle = Math.atan2(dirY, dirX);
    const perpAngle = baseAngle + Math.PI / 2;
    const spreadAngle = weapon.spreadAngle || Math.PI / 6;
    
    if (count === 1) {
      projectiles.push(this.createProjectile(weapon, x, y, dirX, dirY, charge));
      return;
    }
    
    const angleStep = spreadAngle / (count - 1);
    const startOffset = -spreadAngle / 2;
    
    for (let i = 0; i < count; i++) {
      const offsetAngle = startOffset + i * angleStep;
      const angle = baseAngle + Math.cos(perpAngle) * offsetAngle;
      projectiles.push(
        this.createProjectile(
          weapon, 
          x, 
          y, 
          Math.cos(angle), 
          Math.sin(angle), 
          charge
        )
      );
    }
  }
  
  // Generate triangle spread pattern
  private generateTriangleSpread(
    projectiles: Projectile[],
    weapon: WeaponProps,
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    count: number,
    charge: number
  ): void {
    // Simplified triangle pattern
    const baseAngle = Math.atan2(dirY, dirX);
    const spreadAngle = weapon.spreadAngle || Math.PI / 6;
    
    // Center projectile
    projectiles.push(this.createProjectile(weapon, x, y, dirX, dirY, charge));
    
    // Add pairs of projectiles symmetrically
    const pairsCount = Math.floor(count / 2);
    for (let i = 1; i <= pairsCount; i++) {
      const angleOffset = (i / pairsCount) * spreadAngle;
      
      // Left projectile
      projectiles.push(
        this.createProjectile(
          weapon, 
          x, 
          y, 
          Math.cos(baseAngle - angleOffset), 
          Math.sin(baseAngle - angleOffset), 
          charge
        )
      );
      
      // Right projectile (if not odd count)
      if (projectiles.length < count) {
        projectiles.push(
          this.createProjectile(
            weapon, 
            x, 
            y, 
            Math.cos(baseAngle + angleOffset), 
            Math.sin(baseAngle + angleOffset), 
            charge
          )
        );
      }
    }
  }
  
  // Generate wave spread pattern
  private generateWaveSpread(
    projectiles: Projectile[],
    weapon: WeaponProps,
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    count: number,
    charge: number
  ): void {
    const baseAngle = Math.atan2(dirY, dirX);
    const waveAmplitude = weapon.spreadAngle || Math.PI / 12;
    
    for (let i = 0; i < count; i++) {
      const waveOffset = Math.sin((i / count) * Math.PI * 2) * waveAmplitude;
      const angle = baseAngle + waveOffset;
      
      projectiles.push(
        this.createProjectile(
          weapon, 
          x, 
          y, 
          Math.cos(angle), 
          Math.sin(angle), 
          charge
        )
      );
    }
  }
  
  // Generate burst spread pattern (time-delayed shots in same direction)
  private generateBurstSpread(
    projectiles: Projectile[],
    weapon: WeaponProps,
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    count: number,
    charge: number
  ): void {
    // For burst, we just create one projectile and let the game handle the burst timing
    projectiles.push(this.createProjectile(weapon, x, y, dirX, dirY, charge));
  }
  
  // Execute special ability
  executeSpecialAbility(
    weapon: WeaponProps,
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    currentCooldown: number
  ): SpecialAbilityResult {
    // Check if ability is on cooldown
    if (currentCooldown > 0) {
      return {
        success: false,
        cooldown: currentCooldown,
        message: 'Ability on cooldown'
      };
    }
    
    // Default cooldown if not specified
    const cooldown = weapon.specialAbilityCooldown || 5000;
    
    // Execute ability based on type
    switch (weapon.specialAbility) {
      case SpecialAbility.OIL_SPILL:
        return {
          success: true,
          cooldown,
          effect: {
            type: 'oilSpill',
            x,
            y,
            radius: weapon.specialAbilityRadius || 50,
            duration: weapon.specialAbilityDuration || 5000,
            damage: weapon.specialAbilityDamage || 1,
            slowFactor: 0.5
          }
        };
        
      case SpecialAbility.TELEPORT:
        return {
          success: true,
          cooldown,
          effect: {
            type: 'teleport',
            targetX: x + dirX * (weapon.specialAbilityRange || 200),
            targetY: y + dirY * (weapon.specialAbilityRange || 200)
          }
        };
        
      case SpecialAbility.FREEZE:
        return {
          success: true,
          cooldown,
          effect: {
            type: 'freeze',
            x,
            y,
            radius: weapon.specialAbilityRadius || 100,
            duration: weapon.specialAbilityDuration || 3000
          }
        };
        
      case SpecialAbility.EXPLOSION:
        return {
          success: true,
          cooldown,
          effect: {
            type: 'explosion',
            x,
            y,
            radius: weapon.specialAbilityRadius || 100,
            damage: weapon.specialAbilityDamage || 20
          }
        };
        
      case SpecialAbility.SHIELD:
        return {
          success: true,
          cooldown,
          effect: {
            type: 'shield',
            duration: weapon.specialAbilityDuration || 3000,
            strength: weapon.specialAbilityStrength || 50
          }
        };
        
      case SpecialAbility.TURRET:
        return {
          success: true,
          cooldown,
          effect: {
            type: 'turret',
            x,
            y,
            duration: weapon.specialAbilityDuration || 10000,
            fireRate: weapon.specialAbilityFireRate || 500,
            damage: weapon.specialAbilityDamage || 5
          }
        };
        
      case SpecialAbility.POISON_CLOUD:
        return {
          success: true,
          cooldown,
          effect: {
            type: 'poisonCloud',
            x,
            y,
            radius: weapon.specialAbilityRadius || 80,
            duration: weapon.specialAbilityDuration || 5000,
            damage: weapon.specialAbilityDamage || 2,
            tickRate: 500
          }
        };
        
      case SpecialAbility.CHAIN_LIGHTNING:
        return {
          success: true,
          cooldown,
          effect: {
            type: 'chainLightning',
            x,
            y,
            damage: weapon.specialAbilityDamage || 15,
            chainCount: weapon.specialAbilityChainCount || 3,
            range: weapon.specialAbilityRange || 150
          }
        };
        
      case SpecialAbility.BLACK_HOLE:
        return {
          success: true,
          cooldown,
          effect: {
            type: 'blackHole',
            x,
            y,
            radius: weapon.specialAbilityRadius || 100,
            duration: weapon.specialAbilityDuration || 5000,
            pullStrength: weapon.specialAbilityStrength || 2,
            damage: weapon.specialAbilityDamage || 1
          }
        };
        
      default:
        return {
          success: false,
          cooldown: 0,
          message: 'No special ability available'
        };
    }
  }
} 