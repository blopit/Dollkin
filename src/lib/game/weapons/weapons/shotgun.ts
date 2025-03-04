import type { WeaponProps } from '../types';
import { WeaponTier, SpreadPattern, SpecialAbility } from '../types';

export const shotgun: WeaponProps = {
  id: 'shotgun',
  name: 'Shotgun',
  description: 'Fires a spread of pellets. Effective at close range.',
  tier: WeaponTier.UNCOMMON,
  
  // Visual properties
  color: '#aa5500',
  projectileColor: '#ffaa00',
  projectileSize: 4,
  
  // Projectile properties
  damage: 5,
  projectileSpeed: 700,
  projectileLifetime: 500,
  piercing: 0,
  bounces: 0,
  projectileType: 'standard',
  projectileCount: 8,
  
  // Firing properties
  fireRate: 800, // ms between shots
  spreadPattern: SpreadPattern.HORIZONTAL,
  spreadAngle: Math.PI / 6, // 30 degrees
  
  // Accuracy
  accuracy: 0.6, // 60% accuracy
  
  // Special ability
  specialAbility: SpecialAbility.KNOCKBACK,
  specialAbilityCooldown: 3000,
  specialAbilityRadius: 100,
  specialAbilityStrength: 10,
  
  // Sound effects
  shootSound: 'shotgun_shoot',
  reloadSound: 'shotgun_reload',
  emptySound: 'shotgun_empty'
}; 