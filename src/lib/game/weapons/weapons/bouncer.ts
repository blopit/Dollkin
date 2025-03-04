import type { WeaponProps } from '../types';
import { WeaponTier, SpreadPattern, SpecialAbility } from '../types';

export const bouncer: WeaponProps = {
  id: 'bouncer',
  name: 'Bouncer',
  description: 'Fires projectiles that bounce toward nearby enemies.',
  tier: WeaponTier.RARE,
  
  // Visual properties
  color: '#00ff00',
  projectileColor: '#00ff88',
  projectileSize: 7,
  
  // Projectile properties
  damage: 8,
  projectileSpeed: 450,
  projectileLifetime: 3000,
  piercing: 0,
  bounces: 3,
  projectileType: 'bouncer',
  projectileCount: 3,
  homing: true,
  homingStrength: 0.8, // 80% homing strength (how strongly it turns toward enemies)
  homingRange: 300, // Maximum range to detect enemies for homing
  
  // Firing properties
  fireRate: 500, // ms between shots
  spreadPattern: SpreadPattern.TRIANGLE,
  
  // Accuracy
  accuracy: 0.8, // 80% accuracy
  
  // Special ability
  specialAbility: SpecialAbility.CHAIN_LIGHTNING,
  specialAbilityCooldown: 6000,
  specialAbilityRange: 150,
  specialAbilityChainCount: 3,
  specialAbilityDamage: 15,
  
  // Sound effects
  shootSound: 'bouncer_shoot',
  reloadSound: 'bouncer_reload',
  emptySound: 'bouncer_empty'
}; 