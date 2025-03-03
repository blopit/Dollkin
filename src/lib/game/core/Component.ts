import type { Entity } from './Entity';

/**
 * Component interface
 * Represents a piece of functionality that can be attached to an Entity
 */
export interface Component {
  /** Name of the component */
  readonly name: string;
  
  /** Reference to the entity this component is attached to (null if not attached) */
  entity: Entity | null;
  
  /**
   * Update the component
   * @param deltaTime Time since last update in seconds
   */
  update(deltaTime: number): void;
  
  /**
   * Render the component
   * @param ctx The rendering context
   */
  render(ctx: CanvasRenderingContext2D): void;
  
  /**
   * Called when the component is attached to an entity
   * @param entity The entity this component is being attached to
   */
  onAttach(entity: Entity): void;
  
  /**
   * Called when the component is detached from an entity
   */
  onDetach(): void;
}

/**
 * Base component abstract class
 * Provides default implementations for Component interface methods
 */
export abstract class BaseComponent implements Component {
  /** Name of the component */
  public readonly name: string;
  
  /** Reference to the entity this component is attached to */
  public entity: Entity | null = null;
  
  /**
   * Constructor
   * @param name Name of the component
   */
  constructor(name: string) {
    this.name = name;
  }
  
  /**
   * Update the component (default empty implementation)
   * @param deltaTime Time since last update in seconds
   */
  public update(deltaTime: number): void {
    // Default implementation does nothing
  }
  
  /**
   * Render the component (default empty implementation)
   * @param ctx The rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Default implementation does nothing
  }
  
  /**
   * Called when the component is attached to an entity
   * @param entity The entity this component is being attached to
   */
  public onAttach(entity: Entity): void {
    this.entity = entity;
  }
  
  /**
   * Called when the component is detached from an entity
   */
  public onDetach(): void {
    this.entity = null;
  }
} 