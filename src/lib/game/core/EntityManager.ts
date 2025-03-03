import type { Entity } from './Entity';

/**
 * EntityManager class
 * Manages all entities in the game world
 */
export class EntityManager {
  /** Map of all entities by their ID */
  private entities = new Map<string, Entity>();
  
  /** Map of entities by tag for quick lookup */
  private entitiesByTag = new Map<string, Set<Entity>>();
  
  /** List of entities to be added on next update */
  private entitiesToAdd: Entity[] = [];
  
  /** List of entity IDs to be removed on next update */
  private entitiesToRemove: string[] = [];
  
  /**
   * Add an entity to the manager
   * @param entity The entity to add
   * @returns This manager (for chaining)
   */
  add(entity: Entity): EntityManager {
    // Queue the entity to be added on next update
    this.entitiesToAdd.push(entity);
    return this;
  }
  
  /**
   * Remove an entity from the manager
   * @param entityId ID of the entity to remove
   * @returns This manager (for chaining)
   */
  remove(entityId: string): EntityManager {
    // Queue the entity to be removed on next update
    this.entitiesToRemove.push(entityId);
    return this;
  }
  
  /**
   * Get an entity by ID
   * @param entityId ID of the entity to get
   * @returns The entity, or undefined if not found
   */
  getById(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }
  
  /**
   * Get all entities with a specific tag
   * @param tag The tag to filter by
   * @returns Array of entities with the tag
   */
  getByTag(tag: string): Entity[] {
    const entities = this.entitiesByTag.get(tag);
    return entities ? Array.from(entities) : [];
  }
  
  /**
   * Get all entities
   * @returns Array of all entities
   */
  getAll(): Entity[] {
    return Array.from(this.entities.values());
  }
  
  /**
   * Update all entities and process any pending additions/removals
   * @param deltaTime Time since last update in seconds
   */
  update(deltaTime: number): void {
    // Process pending additions
    this.processPendingAdditions();
    
    // Process pending removals
    this.processPendingRemovals();
    
    // Update all active entities
    for (const entity of this.entities.values()) {
      if (entity.active) {
        entity.update(deltaTime);
      }
    }
  }
  
  /**
   * Render all entities
   * @param ctx The rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Render all active entities
    for (const entity of this.entities.values()) {
      if (entity.active) {
        entity.render(ctx);
      }
    }
  }
  
  /**
   * Remove all entities from the manager
   * @returns This manager (for chaining)
   */
  clear(): EntityManager {
    // Queue all entities for removal
    for (const entityId of this.entities.keys()) {
      this.entitiesToRemove.push(entityId);
    }
    
    // Process removals immediately
    this.processPendingRemovals();
    
    return this;
  }
  
  /**
   * Register an entity with the tag system
   * @param entity The entity to register
   */
  private registerEntityTags(entity: Entity): void {
    // Register each tag
    for (const tag of entity.getTags()) {
      // Create tag set if it doesn't exist
      if (!this.entitiesByTag.has(tag)) {
        this.entitiesByTag.set(tag, new Set());
      }
      
      // Add entity to tag set
      this.entitiesByTag.get(tag)?.add(entity);
    }
  }
  
  /**
   * Unregister an entity from the tag system
   * @param entity The entity to unregister
   */
  private unregisterEntityTags(entity: Entity): void {
    // Unregister from each tag
    for (const tag of entity.getTags()) {
      const tagSet = this.entitiesByTag.get(tag);
      
      if (tagSet) {
        // Remove entity from tag set
        tagSet.delete(entity);
        
        // Remove tag set if empty
        if (tagSet.size === 0) {
          this.entitiesByTag.delete(tag);
        }
      }
    }
  }
  
  /**
   * Process any pending entity additions
   */
  private processPendingAdditions(): void {
    if (this.entitiesToAdd.length === 0) return;
    
    // Add all pending entities
    for (const entity of this.entitiesToAdd) {
      // Add to entities map
      this.entities.set(entity.id, entity);
      
      // Register tags
      this.registerEntityTags(entity);
    }
    
    // Clear pending additions
    this.entitiesToAdd = [];
  }
  
  /**
   * Process any pending entity removals
   */
  private processPendingRemovals(): void {
    if (this.entitiesToRemove.length === 0) return;
    
    // Remove all pending entities
    for (const entityId of this.entitiesToRemove) {
      const entity = this.entities.get(entityId);
      
      if (entity) {
        // Unregister tags
        this.unregisterEntityTags(entity);
        
        // Remove from entities map
        this.entities.delete(entityId);
        
        // Destroy the entity
        entity.destroy();
      }
    }
    
    // Clear pending removals
    this.entitiesToRemove = [];
  }
} 