import type { WeaponProps } from '../types';
import { WeaponTier, SpreadPattern, SpecialAbility } from '../types';

export const blaster: WeaponProps = {
  id: 'blaster',
  name: 'Blaster',
  description: 'Standard energy blaster. Reliable and accurate.',
  tier: WeaponTier.COMMON,
  
  // Visual properties
  color: '#00aaff',
  projectileColor: '#00ffff',
  projectileSize: 6,
  
  // Projectile properties
  damage: 10,
  projectileSpeed: 600,
  projectileLifetime: 1000,
  piercing: 0,
  bounces: 0,
  projectileType: 'standard',
  projectileCount: 1,
  
  // Firing properties
  fireRate: 300, // ms between shots
  spreadPattern: SpreadPattern.SINGLE,
  
  // Accuracy
  accuracy: 0.9, // 90% accuracy
  
  // Special ability
  specialAbility: SpecialAbility.NONE,
  
  // Sound effects
  shootSound: 'blaster_shoot',
  reloadSound: 'blaster_reload',
  emptySound: 'blaster_empty'
}; 