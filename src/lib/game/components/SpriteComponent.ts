import type { Entity } from '../core/Entity';
import { BaseComponent } from '../core/Component';

/**
 * SpriteComponent options
 */
export interface SpriteComponentOptions {
  /** Source image or path to image */
  source: HTMLImageElement | string;
  /** Width of the sprite when rendered */
  width: number;
  /** Height of the sprite when rendered */
  height: number;
  /** Offset from entity position (x) */
  offsetX?: number;
  /** Offset from entity position (y) */
  offsetY?: number;
  /** Source rectangle x position (for sprite sheets) */
  sourceX?: number;
  /** Source rectangle y position (for sprite sheets) */
  sourceY?: number;
  /** Source rectangle width (for sprite sheets) */
  sourceWidth?: number;
  /** Source rectangle height (for sprite sheets) */
  sourceHeight?: number;
  /** Scale factor for the sprite */
  scale?: number;
  /** Alpha transparency (0-1) */
  alpha?: number;
  /** Whether to draw centered (default: true) */
  centered?: boolean;
}

/**
 * SpriteComponent
 * Renders a sprite for an entity
 */
export class SpriteComponent extends BaseComponent {
  /** The image to render */
  private image: HTMLImageElement;
  
  /** Whether the image is loaded */
  private imageLoaded = false;
  
  /** Width of the sprite when rendered */
  width: number;
  
  /** Height of the sprite when rendered */
  height: number;
  
  /** Offset from entity position (x) */
  offsetX: number;
  
  /** Offset from entity position (y) */
  offsetY: number;
  
  /** Source rectangle x position (for sprite sheets) */
  sourceX: number;
  
  /** Source rectangle y position (for sprite sheets) */
  sourceY: number;
  
  /** Source rectangle width (for sprite sheets) */
  sourceWidth: number;
  
  /** Source rectangle height (for sprite sheets) */
  sourceHeight: number;
  
  /** Scale factor for the sprite */
  scale: number;
  
  /** Alpha transparency (0-1) */
  alpha: number;
  
  /** Whether to draw centered */
  centered: boolean;
  
  /**
   * Constructor
   * @param options Sprite options
   */
  constructor(options: SpriteComponentOptions) {
    super('sprite');
    
    // Set properties
    this.width = options.width;
    this.height = options.height;
    this.offsetX = options.offsetX ?? 0;
    this.offsetY = options.offsetY ?? 0;
    this.sourceX = options.sourceX ?? 0;
    this.sourceY = options.sourceY ?? 0;
    this.sourceWidth = options.sourceWidth ?? options.width;
    this.sourceHeight = options.sourceHeight ?? options.height;
    this.scale = options.scale ?? 1;
    this.alpha = options.alpha ?? 1;
    this.centered = options.centered ?? true;
    
    // Handle image source
    if (typeof options.source === 'string') {
      // Load image from path
      this.image = new Image();
      this.image.onload = () => {
        this.imageLoaded = true;
      };
      this.image.src = options.source;
    } else {
      // Use existing image
      this.image = options.source;
      this.imageLoaded = true;
    }
  }
  
  /**
   * Render the sprite
   * @param ctx The rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Don't render if image isn't loaded or entity doesn't exist
    if (!this.imageLoaded || !this.entity) return;
    
    // Save context state
    ctx.save();
    
    // Set alpha
    if (this.alpha < 1) {
      ctx.globalAlpha = this.alpha;
    }
    
    // Calculate position
    const x = this.centered ? this.offsetX - (this.width * this.scale) / 2 : this.offsetX;
    const y = this.centered ? this.offsetY - (this.height * this.scale) / 2 : this.offsetY;
    
    // Draw the sprite
    ctx.drawImage(
      this.image,
      this.sourceX,
      this.sourceY,
      this.sourceWidth,
      this.sourceHeight,
      x,
      y,
      this.width * this.scale,
      this.height * this.scale
    );
    
    // Restore context state
    ctx.restore();
  }
  
  /**
   * Change the source rectangle (for animations or sprite switching)
   * @param sourceX New source X position
   * @param sourceY New source Y position
   * @param sourceWidth New source width
   * @param sourceHeight New source height
   */
  public setSourceRect(
    sourceX: number,
    sourceY: number,
    sourceWidth?: number,
    sourceHeight?: number
  ): void {
    this.sourceX = sourceX;
    this.sourceY = sourceY;
    if (sourceWidth !== undefined) this.sourceWidth = sourceWidth;
    if (sourceHeight !== undefined) this.sourceHeight = sourceHeight;
  }
  
  /**
   * Change the sprite dimensions
   * @param width New width
   * @param height New height
   */
  public setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  /**
   * Change the sprite offset
   * @param offsetX New X offset
   * @param offsetY New Y offset
   */
  public setOffset(offsetX: number, offsetY: number): void {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
  
  /**
   * Change the sprite scale
   * @param scale New scale factor
   */
  public setScale(scale: number): void {
    this.scale = scale;
  }
  
  /**
   * Change the sprite alpha
   * @param alpha New alpha value (0-1)
   */
  public setAlpha(alpha: number): void {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }
} 