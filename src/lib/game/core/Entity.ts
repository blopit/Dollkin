import { Vector2 } from '$lib/utils/Vector2';
import type { Component } from './Component';

/**
 * Generates a unique ID for entities
 */
const generateEntityId = (() => {
  let nextId = 0;
  return () => `entity_${nextId++}`;
})();

/**
 * Entity class
 * Represents a game object that can have components attached to it
 */
export class Entity {
  /** Unique identifier for this entity */
  readonly id: string;
  
  /** Position of the entity in the game world */
  position: Vector2;
  
  /** Whether the entity is active (updates and renders) */
  active = true;
  
  /** Components attached to this entity */
  private components = new Map<string, Component>();
  
  /** Tags assigned to this entity */
  private tags = new Set<string>();
  
  /**
   * Constructor
   * @param position Initial position
   */
  constructor(position = new Vector2(0, 0)) {
    this.id = generateEntityId();
    this.position = position;
  }
  
  /**
   * Update the entity and all its components
   * @param deltaTime Time since last update in seconds
   */
  update(deltaTime: number): void {
    if (!this.active) return;
    
    // Update all components
    for (const component of this.components.values()) {
      component.update(deltaTime);
    }
  }
  
  /**
   * Render the entity and all its components
   * @param ctx The rendering context
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    
    // Render all components
    for (const component of this.components.values()) {
      component.render(ctx);
    }
  }
  
  /**
   * Add a component to this entity
   * @param component The component to add
   * @returns This entity (for chaining)
   */
  addComponent(component: Component): Entity {
    // Don't add if we already have a component with the same name
    if (this.components.has(component.name)) {
      console.warn(`Entity ${this.id} already has component ${component.name}`);
      return this;
    }
    
    // Add the component
    this.components.set(component.name, component);
    component.onAttach(this);
    
    return this;
  }
  
  /**
   * Remove a component from this entity
   * @param componentName Name of the component to remove
   * @returns Whether the component was removed
   */
  removeComponent(componentName: string): boolean {
    const component = this.components.get(componentName);
    
    if (!component) {
      return false;
    }
    
    component.onDetach();
    return this.components.delete(componentName);
  }
  
  /**
   * Get a component by name
   * @param componentName Name of the component to get
   * @returns The component, or null if not found
   */
  getComponent<T extends Component>(componentName: string): T | null {
    const component = this.components.get(componentName);
    return component as T || null;
  }
  
  /**
   * Check if this entity has a component
   * @param componentName Name of the component to check for
   * @returns Whether the entity has the component
   */
  hasComponent(componentName: string): boolean {
    return this.components.has(componentName);
  }
  
  /**
   * Add a tag to this entity
   * @param tag The tag to add
   * @returns This entity (for chaining)
   */
  addTag(tag: string): Entity {
    this.tags.add(tag);
    return this;
  }
  
  /**
   * Remove a tag from this entity
   * @param tag The tag to remove
   * @returns Whether the tag was removed
   */
  removeTag(tag: string): boolean {
    return this.tags.delete(tag);
  }
  
  /**
   * Check if this entity has a tag
   * @param tag The tag to check for
   * @returns Whether the entity has the tag
   */
  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }
  
  /**
   * Get all tags for this entity
   * @returns Array of tags
   */
  getTags(): string[] {
    return Array.from(this.tags);
  }
  
  /**
   * Destroy this entity
   * Clean up components and deactivate
   */
  destroy(): void {
    // Detach all components
    for (const component of this.components.values()) {
      component.onDetach();
    }
    
    // Clear components and tags
    this.components.clear();
    this.tags.clear();
    
    // Deactivate
    this.active = false;
  }
  
  /**
   * Get the entity's position
   * @returns The entity's position vector
   */
  getPosition(): Vector2 {
    return this.position;
  }
} 