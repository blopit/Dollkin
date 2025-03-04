import type { WeaponProps } from '../types';
import { WeaponTier, SpreadPattern, SpecialAbility, StatusEffect } from '../types';

export const flamethrower: WeaponProps = {
  id: 'flamethrower',
  name: 'Flamethrower',
  description: 'Spews flames in a wide arc. Press Q to create an oil spill.',
  tier: WeaponTier.UNCOMMON,
  
  // Visual properties
  color: '#ff3300',
  projectileColor: '#ff7700',
  projectileSize: 5,
  
  // Projectile properties
  damage: 3,
  projectileSpeed: 400,
  projectileLifetime: 500,
  piercing: 0,
  bounces: 0,
  statusEffects: [StatusEffect.BURN],
  projectileType: 'flamethrower',
  projectileCount: 5,
  
  // Firing properties
  fireRate: 100, // ms between shots (very fast)
  spreadPattern: SpreadPattern.HORIZONTAL,
  spreadAngle: Math.PI / 8, // 22.5 degrees
  
  // Accuracy
  accuracy: 0.7, // 70% accuracy
  
  // Special ability
  specialAbility: SpecialAbility.OIL_SPILL,
  specialAbilityCooldown: 5000,
  specialAbilityRadius: 80,
  specialAbilityDuration: 8000,
  specialAbilityDamage: 2,
  
  // Sound effects
  shootSound: 'flamethrower_shoot',
  reloadSound: 'flamethrower_reload',
  emptySound: 'flamethrower_empty'
}; 