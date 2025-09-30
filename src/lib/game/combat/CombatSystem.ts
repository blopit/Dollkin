/**
 * Combat System for Dollkin2
 * 
 * Implements a rock-paper-scissors style triangle between:
 * - IDLE (Shooting): Beats MOVING, vulnerable to DASHING
 * - DASHING: Beats IDLE, vulnerable to MOVING
 * - MOVING: Beats DASHING, vulnerable to IDLE
 */

export enum CombatStateType {
  IDLE = 'IDLE',
  MOVING = 'MOVING',
  DASHING = 'DASHING'
}

export interface CombatState {
  isIdle: boolean;
  isDashing: boolean;
  isMoving: boolean;
  lastMoveDirection: { x: number; y: number };
}

export interface CombatAdvantage {
  multiplier: number;
  description: string;
  isCritical: boolean;
  attackerState: CombatStateType;
  defenderState: CombatStateType;
}

export class CombatSystem {
  // State advantages multipliers
  private readonly DASH_VS_IDLE_MULTIPLIER = 2.0;
  private readonly IDLE_VS_MOVING_MULTIPLIER = 1.5;
  private readonly MOVING_VS_DASH_MULTIPLIER = 1.3;
  private readonly NO_ADVANTAGE_MULTIPLIER = 1.0;

  /**
   * Calculate advantage based on combat states
   * @param attackerIsIdle Whether the attacker is in IDLE state
   * @param attackerIsMoving Whether the attacker is in MOVING state
   * @param attackerIsDashing Whether the attacker is in DASHING state
   * @param defenderIsIdle Whether the defender is in IDLE state
   * @param defenderIsMoving Whether the defender is in MOVING state
   * @param defenderIsDashing Whether the defender is in DASHING state
   * @returns Combat advantage information
   */
  calculateAdvantage(
    attackerIsIdle: boolean,
    attackerIsMoving: boolean,
    attackerIsDashing: boolean,
    defenderIsIdle: boolean,
    defenderIsMoving: boolean,
    defenderIsDashing: boolean
  ): CombatAdvantage {
    // Determine attacker state
    let attackerState = CombatStateType.IDLE; // Default
    if (attackerIsMoving) attackerState = CombatStateType.MOVING;
    if (attackerIsDashing) attackerState = CombatStateType.DASHING;

    // Determine defender state
    let defenderState = CombatStateType.IDLE; // Default
    if (defenderIsMoving) defenderState = CombatStateType.MOVING;
    if (defenderIsDashing) defenderState = CombatStateType.DASHING;

    // Calculate advantage
    let multiplier = this.NO_ADVANTAGE_MULTIPLIER;
    let description = "No advantage";
    let isCritical = false;

    // Apply state advantages based on the rock-paper-scissors triangle
    if (attackerState === CombatStateType.DASHING && defenderState === CombatStateType.IDLE) {
      multiplier = this.DASH_VS_IDLE_MULTIPLIER;
      description = "Dash breaks through idle defense!";
      isCritical = true;
    } else if (attackerState === CombatStateType.IDLE && defenderState === CombatStateType.MOVING) {
      multiplier = this.IDLE_VS_MOVING_MULTIPLIER;
      description = "Precise shot hits moving target!";
      isCritical = true;
    } else if (attackerState === CombatStateType.MOVING && defenderState === CombatStateType.DASHING) {
      multiplier = this.MOVING_VS_DASH_MULTIPLIER;
      description = "Movement outmaneuvers dash!";
      isCritical = true;
    }

    return {
      multiplier,
      description,
      isCritical,
      attackerState,
      defenderState
    };
  }

  /**
   * Calculate damage based on the combat state triangle
   * @param attacker The attacking entity's combat state
   * @param defender The defending entity's combat state
   * @param baseDamage The base damage amount
   * @returns The final damage amount after applying state multipliers
   */
  calculateDamage(attacker: CombatState, defender: CombatState, baseDamage: number): number {
    const advantage = this.calculateAdvantage(
      attacker.isIdle,
      attacker.isMoving,
      attacker.isDashing,
      defender.isIdle,
      defender.isMoving,
      defender.isDashing
    );
    
    return baseDamage * advantage.multiplier;
  }

  /**
   * Determine if an attack is a critical hit based on combat states
   * @param multiplier The advantage multiplier from calculateAdvantage
   * @returns Whether the attack is a critical hit
   */
  isCriticalHit(multiplier: number): boolean {
    // Critical hit when attacker has advantage over defender
    return multiplier > this.NO_ADVANTAGE_MULTIPLIER;
  }

  /**
   * Get a text description of the combat advantage
   * @param attacker The attacking entity's combat state
   * @param defender The defending entity's combat state
   * @returns A string describing the advantage
   */
  getAdvantageDescription(attacker: CombatState, defender: CombatState): string {
    const advantage = this.calculateAdvantage(
      attacker.isIdle,
      attacker.isMoving,
      attacker.isDashing,
      defender.isIdle,
      defender.isMoving,
      defender.isDashing
    );
    
    return advantage.description;
  }
} 