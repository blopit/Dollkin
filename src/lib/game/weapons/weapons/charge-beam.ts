import type { WeaponProps } from '../types';
import { WeaponTier, SpreadPattern, SpecialAbility } from '../types';

export const chargeBeam: WeaponProps = {
  id: 'charge-beam',
  name: 'Charge Beam',
  description: 'Charges up for a powerful shot. Hold to charge, release to fire.',
  tier: WeaponTier.RARE,
  
  // Visual properties
  color: '#ff5500',
  projectileColor: '#ff5500',
  projectileSize: 8,
  
  // Projectile properties
  damage: 15,
  projectileSpeed: 500,
  projectileLifetime: 1500,
  piercing: 1,
  bounces: 0,
  projectileType: 'chargeBeam',
  projectileCount: 1,
  
  // Firing properties
  fireRate: 800, // ms between shots
  spreadPattern: SpreadPattern.HORIZONTAL,
  
  // Charge properties
  chargeMultiplier: 2.5, // Damage multiplier based on charge
  chargeSizeMultiplier: 1.5, // Size multiplier based on charge
  
  // Accuracy
  accuracy: 0.95, // 95% accuracy
  
  // Special ability
  specialAbility: SpecialAbility.EXPLOSION,
  specialAbilityCooldown: 10000,
  specialAbilityRadius: 120,
  specialAbilityDamage: 30,
  
  // Sound effects
  shootSound: 'charge_beam_shoot',
  chargeSound: 'charge_beam_charge',
  reloadSound: 'charge_beam_reload',
  emptySound: 'charge_beam_empty'
}; 