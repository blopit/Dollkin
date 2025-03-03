import type { EntityManager } from '../core/EntityManager';
import type { CollisionComponent, CollisionResult } from '../components/CollisionComponent';
import type { Entity } from '../core/Entity';
import type { Vector2 } from '$lib/utils/Vector2';

/**
 * CollisionSystem
 * Manages collision detection and resolution between entities
 */
export class CollisionSystem {
  /** Entity manager reference */
  private entityManager: EntityManager;
  
  /** Whether to use broad phase optimization */
  private useBroadPhase: boolean;
  
  /** Whether to use spatial partitioning (grid) */
  private useSpatialPartitioning: boolean;
  
  /** Debug mode */
  private debug: boolean;
  
  /**
   * Constructor
   * @param entityManager Entity manager reference
   * @param options Options for the collision system
   */
  constructor(
    entityManager: EntityManager,
    options: {
      useBroadPhase?: boolean;
      useSpatialPartitioning?: boolean;
      debug?: boolean;
    } = {}
  ) {
    this.entityManager = entityManager;
    this.useBroadPhase = options.useBroadPhase ?? true;
    this.useSpatialPartitioning = options.useSpatialPartitioning ?? false;
    this.debug = options.debug ?? false;
  }
  
  /**
   * Update the collision system
   * Detects and resolves collisions between entities
   */
  public update(): void {
    // Get all entities with collision components
    const entities = this.entityManager.getAll().filter(entity => 
      entity.active && entity.hasComponent('collision')
    );
    
    // Skip if no entities to check
    if (entities.length === 0) return;
    
    // Check collisions between all entities
    for (let i = 0; i < entities.length; i++) {
      const entityA = entities[i];
      const colliderA = entityA.getComponent('collision') as CollisionComponent;
      
      // Skip if not active
      if (!entityA.active) continue;
      
      for (let j = i + 1; j < entities.length; j++) {
        const entityB = entities[j];
        const colliderB = entityB.getComponent('collision') as CollisionComponent;
        
        // Skip if not active
        if (!entityB.active) continue;
        
        // Check collision
        const result = colliderA.checkCollision(colliderB);
        
        // If collision occurred and it's not a trigger collision, resolve it
        if (result.collided && this.shouldResolveCollision(result)) {
          this.resolveCollision(entityA, entityB, result.overlapX, result.overlapY, result.normal);
        }
      }
    }
  }
  
  /**
   * Determine if a collision should be resolved (not a trigger)
   * @param result The collision result
   * @returns Whether the collision should be resolved
   */
  private shouldResolveCollision(result: CollisionResult): boolean {
    // We can't directly access isTrigger, so we'll infer from the result
    // If there's no overlap or normal, it's likely a trigger
    return result.collided && 
           (result.overlapX !== 0 || result.overlapY !== 0) && 
           (result.normal.x !== 0 || result.normal.y !== 0);
  }
  
  /**
   * Resolve a collision between two entities
   * @param entityA First entity
   * @param entityB Second entity
   * @param overlapX Overlap along X axis
   * @param overlapY Overlap along Y axis
   * @param normal Collision normal
   */
  private resolveCollision(
    entityA: Entity,
    entityB: Entity,
    overlapX: number,
    overlapY: number,
    normal: Vector2
  ): void {
    // Simple position correction
    // Move entities apart based on overlap
    
    // Check if either entity has a movement component
    const hasMovementA = entityA.hasComponent('movement');
    const hasMovementB = entityB.hasComponent('movement');
    
    // If both have movement, split the correction
    if (hasMovementA && hasMovementB) {
      entityA.position.x -= overlapX * 0.5;
      entityA.position.y -= overlapY * 0.5;
      
      entityB.position.x += overlapX * 0.5;
      entityB.position.y += overlapY * 0.5;
    }
    // If only A has movement, move A
    else if (hasMovementA) {
      entityA.position.x -= overlapX;
      entityA.position.y -= overlapY;
    }
    // If only B has movement, move B
    else if (hasMovementB) {
      entityB.position.x += overlapX;
      entityB.position.y += overlapY;
    }
    // If neither has movement, split the correction
    else {
      entityA.position.x -= overlapX * 0.5;
      entityA.position.y -= overlapY * 0.5;
      
      entityB.position.x += overlapX * 0.5;
      entityB.position.y += overlapY * 0.5;
    }
    
    // If debug mode is enabled, log collision
    if (this.debug) {
      console.log(`Collision between ${entityA.id} and ${entityB.id}`);
      console.log(`  Overlap: (${overlapX}, ${overlapY})`);
      console.log(`  Normal: (${normal.x}, ${normal.y})`);
    }
  }
  
  /**
   * Set debug mode
   * @param debug Whether to enable debug mode
   */
  public setDebug(debug: boolean): void {
    this.debug = debug;
  }
} 