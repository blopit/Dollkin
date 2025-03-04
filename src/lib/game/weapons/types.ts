// Weapon system types

// Base weapon properties interface
export interface WeaponProps {
  id: string;
  name: string;
  description: string;
  sprite?: string; // Path to weapon sprite
  tier: WeaponTier;
  
  // Visual properties
  color: string;
  muzzleFlashColor?: string;
  projectileColor: string;
  
  // Projectile properties
  projectileSize: number;
  projectileSpeed: number;
  projectileLifetime: number;
  projectileType?: string; // Type of projectile (standard, beam, flamethrower, etc.)
  projectileCount?: number; // Number of projectiles to spawn per shot
  damage: number;
  piercing?: number; // Number of enemies a projectile can pierce through
  bounces?: number; // Number of times a projectile can bounce
  homing?: boolean; // Whether the projectile homes in on enemies
  homingStrength?: number; // How strongly the projectile turns toward enemies (0-1)
  homingRange?: number; // Maximum range to detect enemies for homing
  
  // Firing properties
  fireRate: number; // ms between shots
  lockedFireRate?: number; // Fire rate when direction is locked
  reloadTime?: number; // Time to reload in seconds
  magazineSize?: number; // Number of shots before reload
  
  // Accuracy/spread
  accuracy: number; // 0-1, where 1 is perfect accuracy
  spreadPattern: SpreadPattern;
  spreadAngle?: number;
  
  // Special abilities
  specialAbility?: SpecialAbility;
  specialAbilityCooldown?: number; // Cooldown in seconds
  specialAbilityRadius?: number;
  specialAbilityDuration?: number;
  specialAbilityDamage?: number;
  specialAbilityStrength?: number;
  specialAbilityRange?: number;
  specialAbilityFireRate?: number;
  specialAbilityChainCount?: number;
  
  // Charge properties (for charge weapons)
  isChargeWeapon?: boolean;
  chargeMultiplier?: number;
  chargeSizeMultiplier?: number;
  minChargeDamage?: number;
  maxChargeDamage?: number;
  
  // Effects
  statusEffects?: StatusEffect[];
  
  // Sound effects
  shootSound?: string;
  reloadSound?: string;
  emptySound?: string;
  chargeSound?: string;
}

// Weapon tiers (rarity)
export enum WeaponTier {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

// Spread patterns
export enum SpreadPattern {
  SINGLE = 'single',
  CIRCULAR = 'circular',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  TRIANGLE = 'triangle',
  WAVE = 'wave',
  BURST = 'burst'
}

// Special abilities
export enum SpecialAbility {
  NONE = 'none',
  OIL_SPILL = 'oil_spill', // Creates oil puddle that damages enemies
  TELEPORT = 'teleport', // Teleport to cursor location
  FREEZE = 'freeze', // Freeze enemies in area
  EXPLOSION = 'explosion', // Create explosion
  SHIELD = 'shield', // Create temporary shield
  TURRET = 'turret', // Deploy a turret
  POISON_CLOUD = 'poison_cloud', // Create poison cloud
  CHAIN_LIGHTNING = 'chain_lightning', // Lightning chains between enemies
  BLACK_HOLE = 'black_hole', // Create a black hole that pulls enemies
  KNOCKBACK = 'knockback'
}

// Status effects that can be applied to enemies
export enum StatusEffect {
  NONE = 'none',
  BURN = 'burn', // Damage over time
  FREEZE = 'freeze', // Slow movement
  POISON = 'poison', // Damage over time
  STUN = 'stun', // Cannot move
  CONFUSION = 'confusion', // Random movement
  FEAR = 'fear', // Run away from player
  CHARM = 'charm', // Attack other enemies
  WEAKEN = 'weaken' // Reduced damage
}

// Projectile interface
export interface Projectile {
  id: string;
  weaponId: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  dirX: number;
  dirY: number;
  color: string;
  damage: number;
  lifetime: number;
  piercing?: number;
  bounces?: number;
  statusEffects?: StatusEffect[];
  homing?: boolean;
  homingStrength?: number;
  homingRange?: number;
  
  // Optional properties
  alpha?: number;
  chargePercent?: number;
  type: string;
  
  // For tracking bounces
  lastBounceX?: number;
  lastBounceY?: number;
  
  // For homing
  targetEnemy?: any;
  
  // For special projectiles
  specialProperties?: Record<string, any>;
}

// Special ability result
export interface SpecialAbilityResult {
  success: boolean;
  cooldown: number;
  message?: string;
  effect?: Record<string, unknown>;
} 