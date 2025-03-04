import type { WeaponProps } from './types';
import { blaster } from './weapons/blaster';
import { chargeBeam } from './weapons/charge-beam';
import { flamethrower } from './weapons/flamethrower';
import { shotgun } from './weapons/shotgun';
import { bouncer } from './weapons/bouncer';

// Weapon registry to store all available weapons
class WeaponRegistry {
  private weapons: Map<string, WeaponProps> = new Map();
  
  constructor() {
    // Register default weapons
    this.registerDefaultWeapons();
  }
  
  // Register a new weapon
  register(weapon: WeaponProps): void {
    if (this.weapons.has(weapon.id)) {
      console.warn(`Weapon with ID ${weapon.id} already exists. Overwriting.`);
    }
    this.weapons.set(weapon.id, weapon);
  }
  
  // Get a weapon by ID
  get(id: string): WeaponProps | undefined {
    return this.weapons.get(id);
  }
  
  // Get all weapons
  getAll(): WeaponProps[] {
    return Array.from(this.weapons.values());
  }
  
  // Get weapons by tier
  getByTier(tier: string): WeaponProps[] {
    return this.getAll().filter(weapon => weapon.tier === tier);
  }
  
  // Register default weapons
  private registerDefaultWeapons(): void {
    // Register built-in weapons
    this.register(blaster);
    this.register(chargeBeam);
    this.register(flamethrower);
    this.register(shotgun);
    this.register(bouncer);
  }
}

// Create and export a singleton instance
export const weaponRegistry = new WeaponRegistry();

// Helper function to get a random weapon
export function getRandomWeapon(tier?: string): WeaponProps {
  const weapons = tier 
    ? weaponRegistry.getByTier(tier)
    : weaponRegistry.getAll();
    
  if (weapons.length === 0) {
    // Fallback to blaster if no weapons found
    return weaponRegistry.get('blaster')!;
  }
  
  const randomIndex = Math.floor(Math.random() * weapons.length);
  return weapons[randomIndex];
}

// Helper function to get a random weapon of a specific tier or higher
export function getRandomWeaponOfTierOrHigher(minTier: string): WeaponProps {
  const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const minTierIndex = tiers.indexOf(minTier);
  
  if (minTierIndex === -1) {
    return getRandomWeapon();
  }
  
  const eligibleTiers = tiers.slice(minTierIndex);
  const eligibleWeapons = weaponRegistry.getAll()
    .filter(weapon => eligibleTiers.includes(weapon.tier));
    
  if (eligibleWeapons.length === 0) {
    return weaponRegistry.get('blaster')!;
  }
  
  const randomIndex = Math.floor(Math.random() * eligibleWeapons.length);
  return eligibleWeapons[randomIndex];
} 