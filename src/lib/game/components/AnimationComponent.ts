import { BaseComponent } from '../core/Component';
import type { SpriteComponent } from './SpriteComponent';
import type { Entity } from '../core/Entity';

/**
 * Animation frame definition
 */
export interface AnimationFrame {
  /** X position in the sprite sheet */
  x: number;
  /** Y position in the sprite sheet */
  y: number;
  /** Width of the frame */
  width: number;
  /** Height of the frame */
  height: number;
  /** Duration of the frame in seconds */
  duration: number;
}

/**
 * Animation sequence definition
 */
export interface AnimationSequence {
  /** Name of the animation */
  name: string;
  /** Frames in the animation */
  frames: AnimationFrame[];
  /** Whether the animation should loop */
  loop?: boolean;
}

/**
 * AnimationComponent options
 */
export interface AnimationComponentOptions {
  /** Name of the sprite component to animate */
  spriteComponentName?: string;
  /** Animation sequences */
  sequences?: AnimationSequence[];
  /** Default animation sequence name */
  defaultSequence?: string;
}

/**
 * AnimationComponent
 * Handles sprite animations
 */
export class AnimationComponent extends BaseComponent {
  /** Reference to the sprite component */
  private spriteComponent: SpriteComponent | null = null;
  
  /** Animation sequences by name */
  private sequences: Map<string, AnimationSequence> = new Map();
  
  /** Current animation sequence */
  private currentSequence: AnimationSequence | null = null;
  
  /** Current frame index */
  private currentFrameIndex = 0;
  
  /** Time elapsed in current frame */
  private frameTime = 0;
  
  /** Whether the animation is playing */
  private playing = false;
  
  /** Name of the sprite component to animate */
  private spriteComponentName: string;
  
  /** Callback when animation completes */
  private onCompleteCallback: ((sequenceName: string) => void) | null = null;
  
  /** Callback when animation frame changes */
  private onFrameChangeCallback: ((sequenceName: string, frameIndex: number) => void) | null = null;
  
  /** Playback speed multiplier (1.0 = normal speed) */
  private playbackSpeed = 1.0;
  
  /**
   * Constructor
   * @param options Animation options
   */
  constructor(options: AnimationComponentOptions = {}) {
    super('animation');
    
    // Set properties
    this.spriteComponentName = options.spriteComponentName || 'sprite';
    
    // Add initial sequences
    if (options.sequences) {
      for (const sequence of options.sequences) {
        this.addSequence(sequence);
      }
    }
    
    // Set default sequence if specified
    if (options.defaultSequence) {
      this.setSequence(options.defaultSequence);
    }
  }
  
  /**
   * Called when attached to an entity
   * @param entity The entity
   */
  public onAttach(entity: Entity): void {
    super.onAttach(entity);
    
    // Get sprite component
    this.spriteComponent = entity.getComponent(this.spriteComponentName) as SpriteComponent | null;
    
    // Start playing if we have a current sequence
    if (this.currentSequence) {
      this.play();
    }
  }
  
  /**
   * Add an animation sequence
   * @param sequence The animation sequence
   * @returns This component for chaining
   */
  public addSequence(sequence: AnimationSequence): AnimationComponent {
    this.sequences.set(sequence.name, sequence);
    return this;
  }
  
  /**
   * Remove an animation sequence
   * @param name Name of the sequence to remove
   * @returns Whether the sequence was removed
   */
  public removeSequence(name: string): boolean {
    // If current sequence is being removed, stop animation
    if (this.currentSequence && this.currentSequence.name === name) {
      this.stop();
      this.currentSequence = null;
    }
    
    return this.sequences.delete(name);
  }
  
  /**
   * Set the current animation sequence
   * @param name Name of the sequence
   * @param restart Whether to restart if already playing this sequence
   * @returns Whether the sequence was set
   */
  public setSequence(name: string, restart = true): boolean {
    // Find sequence
    const sequence = this.sequences.get(name);
    
    if (!sequence) {
      console.warn(`Animation sequence '${name}' not found`);
      return false;
    }
    
    // Don't restart if already playing this sequence
    if (!restart && this.currentSequence && this.currentSequence.name === name) {
      return true;
    }
    
    // Set sequence
    this.currentSequence = sequence;
    this.currentFrameIndex = 0;
    this.frameTime = 0;
    
    // Apply first frame
    this.applyFrame(0);
    
    return true;
  }
  
  /**
   * Start playing the animation
   * @returns This component for chaining
   */
  public play(): AnimationComponent {
    this.playing = true;
    return this;
  }
  
  /**
   * Stop playing the animation
   * @returns This component for chaining
   */
  public stop(): AnimationComponent {
    this.playing = false;
    return this;
  }
  
  /**
   * Pause the animation
   * @returns This component for chaining
   */
  public pause(): AnimationComponent {
    this.playing = false;
    return this;
  }
  
  /**
   * Resume the animation
   * @returns This component for chaining
   */
  public resume(): AnimationComponent {
    this.playing = true;
    return this;
  }
  
  /**
   * Get the current animation sequence name
   * @returns Current sequence name or null if none
   */
  public getCurrentSequenceName(): string | null {
    return this.currentSequence ? this.currentSequence.name : null;
  }
  
  /**
   * Get the current frame index
   * @returns Current frame index
   */
  public getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }
  
  /**
   * Set callback for animation complete
   * @param callback The callback function
   */
  public setOnCompleteCallback(callback: ((sequenceName: string) => void) | null): void {
    this.onCompleteCallback = callback;
  }
  
  /**
   * Set callback for frame change
   * @param callback The callback function
   */
  public setOnFrameChangeCallback(callback: ((sequenceName: string, frameIndex: number) => void) | null): void {
    this.onFrameChangeCallback = callback;
  }
  
  /**
   * Set the animation playback speed
   * @param speed Speed multiplier (1.0 = normal speed)
   * @returns This component for chaining
   */
  public setPlaybackSpeed(speed: number): AnimationComponent {
    this.playbackSpeed = Math.max(0.1, speed); // Prevent negative or zero speed
    return this;
  }
  
  /**
   * Get the current playback speed
   * @returns Current playback speed multiplier
   */
  public getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }
  
  /**
   * Update the animation
   * @param deltaTime Time since last update in seconds
   */
  public update(deltaTime: number): void {
    // Don't update if not playing or no sequence
    if (!this.playing || !this.currentSequence || this.currentSequence.frames.length === 0) {
      return;
    }
    
    // Update frame time with playback speed
    this.frameTime += deltaTime * this.playbackSpeed;
    
    // Get current frame
    const currentFrame = this.currentSequence.frames[this.currentFrameIndex];
    
    // Check if frame duration has elapsed
    if (this.frameTime >= currentFrame.duration) {
      // Move to next frame
      this.frameTime -= currentFrame.duration;
      
      // Check if we're at the end of the sequence
      if (this.currentFrameIndex >= this.currentSequence.frames.length - 1) {
        // Call complete callback
        if (this.onCompleteCallback) {
          this.onCompleteCallback(this.currentSequence.name);
        }
        
        // Handle looping
        if (this.currentSequence.loop !== false) {
          // Loop back to start
          this.currentFrameIndex = 0;
          this.applyFrame(this.currentFrameIndex);
        } else {
          // Stop at last frame
          this.playing = false;
        }
      } else {
        // Advance to next frame
        this.currentFrameIndex++;
        this.applyFrame(this.currentFrameIndex);
      }
    }
  }
  
  /**
   * Apply a frame to the sprite component
   * @param frameIndex Index of the frame to apply
   */
  private applyFrame(frameIndex: number): void {
    // Ensure we have a sprite component and sequence
    if (!this.spriteComponent || !this.currentSequence) {
      return;
    }
    
    // Get frame
    const frame = this.currentSequence.frames[frameIndex];
    
    // Apply frame to sprite
    this.spriteComponent.setSourceRect(frame.x, frame.y, frame.width, frame.height);
    
    // Call frame change callback
    if (this.onFrameChangeCallback) {
      this.onFrameChangeCallback(this.currentSequence.name, frameIndex);
    }
  }
} 