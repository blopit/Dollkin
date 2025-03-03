import { BaseComponent } from '../core/Component';
import { Vector2 } from '$lib/utils/Vector2';

/**
 * Shape types for collision
 */
export enum CollisionShape {
  Circle = 0,
  Rectangle = 1
}

/**
 * Collision layer for filtering collisions
 */
export enum CollisionLayer {
  Default = 1,
  Player = 2,
  Enemy = 4,
  Projectile = 8,
  Pickup = 16,
  Obstacle = 32,
  Trigger = 64
}

/**
 * CollisionComponent options
 */
export interface CollisionComponentOptions {
  /** Shape type */
  shape: CollisionShape;
  /** Width (for rectangle) or radius (for circle) */
  width: number;
  /** Height (for rectangle, ignored for circle) */
  height?: number;
  /** Offset from entity position */
  offset?: Vector2;
  /** Collision layer */
  layer?: CollisionLayer;
  /** Collision mask (which layers to collide with) */
  mask?: number;
  /** Whether this is a trigger (doesn't block movement) */
  isTrigger?: boolean;
  /** Whether to draw debug visualization */
  debug?: boolean;
}

/**
 * Collision result
 */
export interface CollisionResult {
  /** Whether a collision occurred */
  collided: boolean;
  /** The other collision component involved */
  other: CollisionComponent | null;
  /** Overlap amount along x axis */
  overlapX: number;
  /** Overlap amount along y axis */
  overlapY: number;
  /** Normal vector of collision */
  normal: Vector2;
}

/**
 * CollisionComponent
 * Handles collision detection for an entity
 */
export class CollisionComponent extends BaseComponent {
  /** Shape type */
  private shape: CollisionShape;
  
  /** Width (for rectangle) or radius (for circle) */
  private width: number;
  
  /** Height (for rectangle, ignored for circle) */
  private height: number;
  
  /** Offset from entity position */
  private offset: Vector2;
  
  /** Collision layer */
  private layer: CollisionLayer;
  
  /** Collision mask (which layers to collide with) */
  private mask: number;
  
  /** Whether this is a trigger (doesn't block movement) */
  private isTrigger: boolean;
  
  /** Whether to draw debug visualization */
  private debug: boolean;
  
  /** Callback for when collision occurs */
  private onCollisionCallback: ((result: CollisionResult) => void) | null = null;
  
  /** Callback for when trigger event occurs */
  private onTriggerCallback: ((result: CollisionResult) => void) | null = null;
  
  /**
   * Constructor
   * @param options Collision options
   */
  constructor(options: CollisionComponentOptions) {
    super('collision');
    
    // Set properties
    this.shape = options.shape;
    this.width = options.width;
    this.height = options.shape === CollisionShape.Circle ? options.width : (options.height || options.width);
    this.offset = options.offset || new Vector2(0, 0);
    this.layer = options.layer || CollisionLayer.Default;
    this.mask = options.mask || -1; // Default to collide with everything
    this.isTrigger = options.isTrigger || false;
    this.debug = options.debug || false;
  }
  
  /**
   * Set collision callbacks
   * @param onCollision Callback for when collision occurs
   * @param onTrigger Callback for when trigger event occurs
   */
  public setCallbacks(
    onCollision: ((result: CollisionResult) => void) | null = null,
    onTrigger: ((result: CollisionResult) => void) | null = null
  ): void {
    this.onCollisionCallback = onCollision;
    this.onTriggerCallback = onTrigger;
  }
  
  /**
   * Get the world position of this collider
   * @returns World position
   */
  public getWorldPosition(): Vector2 {
    if (!this.entity) return new Vector2(0, 0);
    
    return new Vector2(
      this.entity.position.x + this.offset.x,
      this.entity.position.y + this.offset.y
    );
  }
  
  /**
   * Check if layer collides with mask
   * @param layer Layer to check
   * @returns Whether the layer collides with this component's mask
   */
  public collidesWithLayer(layer: CollisionLayer): boolean {
    return (this.mask & layer) !== 0;
  }
  
  /**
   * Check collision with another collision component
   * @param other The other collision component
   * @returns Collision result
   */
  public checkCollision(other: CollisionComponent): CollisionResult {
    // Don't collide if on different layers or not active
    if (!this.entity || !this.entity.active || !other.entity || !other.entity.active) {
      return {
        collided: false,
        other: null,
        overlapX: 0,
        overlapY: 0,
        normal: new Vector2(0, 0)
      };
    }
    
    // Don't collide if layer masks don't match
    if (!this.collidesWithLayer(other.layer) || !other.collidesWithLayer(this.layer)) {
      return {
        collided: false,
        other,
        overlapX: 0,
        overlapY: 0,
        normal: new Vector2(0, 0)
      };
    }
    
    let collided = false;
    let overlapX = 0;
    let overlapY = 0;
    let normal = new Vector2(0, 0);
    
    // Get world positions
    const posA = this.getWorldPosition();
    const posB = other.getWorldPosition();
    
    // Circle vs Circle
    if (this.shape === CollisionShape.Circle && other.shape === CollisionShape.Circle) {
      const radiusSum = this.width + other.width;
      const distance = Vector2.distance(posA, posB);
      
      collided = distance < radiusSum;
      
      if (collided) {
        const direction = Vector2.subtract(posB, posA).normalize();
        normal = Vector2.multiply(direction, -1); // Normal points away from other object
        
        const overlap = radiusSum - distance;
        overlapX = direction.x * overlap;
        overlapY = direction.y * overlap;
      }
    }
    // Rectangle vs Rectangle
    else if (this.shape === CollisionShape.Rectangle && other.shape === CollisionShape.Rectangle) {
      // Calculate bounds
      const halfWidthA = this.width / 2;
      const halfHeightA = this.height / 2;
      const halfWidthB = other.width / 2;
      const halfHeightB = other.height / 2;
      
      const minA = new Vector2(posA.x - halfWidthA, posA.y - halfHeightA);
      const maxA = new Vector2(posA.x + halfWidthA, posA.y + halfHeightA);
      const minB = new Vector2(posB.x - halfWidthB, posB.y - halfHeightB);
      const maxB = new Vector2(posB.x + halfWidthB, posB.y + halfHeightB);
      
      // Check for overlap
      collided = (
        minA.x <= maxB.x &&
        maxA.x >= minB.x &&
        minA.y <= maxB.y &&
        maxA.y >= minB.y
      );
      
      if (collided) {
        // Calculate overlap
        const overlapRight = maxB.x - minA.x;
        const overlapLeft = maxA.x - minB.x;
        const overlapTop = maxA.y - minB.y;
        const overlapBottom = maxB.y - minA.y;
        
        // Find minimum overlap
        overlapX = overlapRight < overlapLeft ? -overlapRight : overlapLeft;
        overlapY = overlapBottom < overlapTop ? -overlapBottom : overlapTop;
        
        // Choose axis with smaller overlap
        if (Math.abs(overlapX) < Math.abs(overlapY)) {
          overlapY = 0;
          normal = new Vector2(overlapX < 0 ? -1 : 1, 0);
        } else {
          overlapX = 0;
          normal = new Vector2(0, overlapY < 0 ? -1 : 1);
        }
      }
    }
    // Circle vs Rectangle or Rectangle vs Circle
    else {
      const circle = this.shape === CollisionShape.Circle ? this : other;
      const rect = this.shape === CollisionShape.Rectangle ? this : other;
      
      const circlePos = circle.getWorldPosition();
      const rectPos = rect.getWorldPosition();
      
      // Find closest point on rectangle to circle center
      const halfWidth = rect.width / 2;
      const halfHeight = rect.height / 2;
      
      // Clamp circle center to rectangle bounds
      const closestX = Math.max(rectPos.x - halfWidth, Math.min(circlePos.x, rectPos.x + halfWidth));
      const closestY = Math.max(rectPos.y - halfHeight, Math.min(circlePos.y, rectPos.y + halfHeight));
      
      // Calculate distance from closest point to circle center
      const distanceX = circlePos.x - closestX;
      const distanceY = circlePos.y - closestY;
      const distanceSquared = distanceX * distanceX + distanceY * distanceY;
      
      // Check if distance is less than circle radius
      collided = distanceSquared < (circle.width * circle.width);
      
      if (collided) {
        // Calculate normal and overlap
        if (distanceSquared === 0) {
          // Circle center is inside rectangle, use shortest exit
          const overlapRight = rectPos.x + halfWidth - circlePos.x;
          const overlapLeft = circlePos.x - (rectPos.x - halfWidth);
          const overlapTop = circlePos.y - (rectPos.y - halfHeight);
          const overlapBottom = rectPos.y + halfHeight - circlePos.y;
          
          // Find minimum overlap
          const minOverlap = Math.min(overlapRight, overlapLeft, overlapTop, overlapBottom);
          
          if (minOverlap === overlapRight) {
            normal = new Vector2(1, 0);
            overlapX = circle.width;
          } else if (minOverlap === overlapLeft) {
            normal = new Vector2(-1, 0);
            overlapX = -circle.width;
          } else if (minOverlap === overlapBottom) {
            normal = new Vector2(0, 1);
            overlapY = circle.width;
          } else {
            normal = new Vector2(0, -1);
            overlapY = -circle.width;
          }
        } else {
          // Circle center is outside rectangle
          const distance = Math.sqrt(distanceSquared);
          normal = new Vector2(distanceX / distance, distanceY / distance);
          
          if (this.shape === CollisionShape.Rectangle) {
            normal = Vector2.multiply(normal, -1);
          }
          
          const overlap = circle.width - distance;
          overlapX = normal.x * overlap;
          overlapY = normal.y * overlap;
        }
      }
    }
    
    // Create result
    const result: CollisionResult = {
      collided,
      other,
      overlapX,
      overlapY,
      normal
    };
    
    // Trigger callbacks
    if (collided) {
      if (this.isTrigger || other.isTrigger) {
        if (this.onTriggerCallback) {
          this.onTriggerCallback(result);
        }
      } else if (this.onCollisionCallback) {
        this.onCollisionCallback(result);
      }
    }
    
    return result;
  }
  
  /**
   * Render debug visualization
   * @param ctx The rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.debug || !this.entity) return;
    
    const pos = this.getWorldPosition();
    
    // Draw shape in debug mode
    ctx.save();
    ctx.strokeStyle = this.isTrigger ? 'rgba(255, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    
    if (this.shape === CollisionShape.Circle) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, this.width, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(
        pos.x - this.width / 2,
        pos.y - this.height / 2,
        this.width,
        this.height
      );
    }
    
    ctx.restore();
  }
} 