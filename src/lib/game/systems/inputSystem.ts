import { writable } from 'svelte/store';

// Define the input state interface
export interface InputState {
  direction: { x: number; y: number };
  action: boolean;
  special: boolean;
}

// Create a writable store for input state
export const inputState = writable<InputState>({
  direction: { x: 0, y: 0 },
  action: false,
  special: false
});

/**
 * TouchController class for handling touch input
 * Manages virtual joystick and action buttons
 */
export class TouchController {
  // Touch tracking properties
  private joystickTouch: number | null = null;
  private actionTouch: number | null = null;
  
  // Joystick properties
  private joystickStartX = 0;
  private joystickStartY = 0;
  private joystickCurrentX = 0;
  private joystickCurrentY = 0;
  
  // Tap tracking
  private lastTapTime = 0;
  private tapTimeThreshold = 200; // ms
  private tapDistanceThreshold = 20; // pixels
  
  // Configuration
  private joystickDeadzone = 10; // Pixels
  private joystickMaxRadius = 100; // Pixels - increased for better control
  
  // Target element
  private element: HTMLElement;
  
  /**
   * Constructor
   * @param element The HTML element to attach touch events to
   * @param options Optional configuration options
   */
  constructor(
    element: HTMLElement, 
    options: { 
      deadzone?: number; 
      maxRadius?: number;
      tapTimeThreshold?: number;
      tapDistanceThreshold?: number;
    } = {}
  ) {
    this.element = element;
    
    // Apply custom options
    if (options.deadzone) this.joystickDeadzone = options.deadzone;
    if (options.maxRadius) this.joystickMaxRadius = options.maxRadius;
    if (options.tapTimeThreshold) this.tapTimeThreshold = options.tapTimeThreshold;
    if (options.tapDistanceThreshold) this.tapDistanceThreshold = options.tapDistanceThreshold;
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up touch event listeners
   */
  private setupEventListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
  }
  
  /**
   * Handle touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    // Prevent default browser behavior like scrolling
    event.preventDefault();
    
    const { touches } = event;
    
    // Process each new touch
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      
      // If this touch is not already being tracked
      if (touch.identifier !== this.joystickTouch && touch.identifier !== this.actionTouch) {
        // If no joystick touch is active, use this touch for joystick
        if (this.joystickTouch === null) {
          this.joystickTouch = touch.identifier;
          this.joystickStartX = touch.clientX;
          this.joystickStartY = touch.clientY;
          this.joystickCurrentX = touch.clientX;
          this.joystickCurrentY = touch.clientY;
          
          // Record time for potential tap detection
          this.lastTapTime = Date.now();
        } 
        // If joystick is already active, use this touch for action
        else if (this.actionTouch === null) {
          this.actionTouch = touch.identifier;
          inputState.update(state => ({ ...state, action: true }));
        }
      }
    }
  }
  
  /**
   * Handle touch move events
   */
  private handleTouchMove(event: TouchEvent): void {
    // Prevent default browser behavior
    event.preventDefault();
    
    const { touches } = event;
    
    // Find the joystick touch if it exists
    if (this.joystickTouch !== null) {
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        
        if (touch.identifier === this.joystickTouch) {
          this.joystickCurrentX = touch.clientX;
          this.joystickCurrentY = touch.clientY;
          
          // Calculate the joystick vector
          const dx = this.joystickCurrentX - this.joystickStartX;
          const dy = this.joystickCurrentY - this.joystickStartY;
          
          // Calculate the magnitude of the vector
          const magnitude = Math.sqrt(dx * dx + dy * dy);
          
          if (magnitude > 0) {
            // Normalize the vector
            const normalizedX = dx / magnitude;
            const normalizedY = dy / magnitude;
            
            // Apply deadzone
            if (magnitude > this.joystickDeadzone) {
              // Apply maximum radius limit
              const limitedMagnitude = Math.min(magnitude, this.joystickMaxRadius);
              const factor = limitedMagnitude / this.joystickMaxRadius;
              
              // Update the input state with the joystick direction
              inputState.update(state => ({
                ...state,
                direction: {
                  x: normalizedX * factor,
                  y: normalizedY * factor
                }
              }));
            } else {
              // Inside deadzone - set to zero
              inputState.update(state => ({
                ...state,
                direction: { x: 0, y: 0 }
              }));
            }
          }
          
          break;
        }
      }
    }
  }
  
  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    // Prevent default browser behavior
    event.preventDefault();
    
    const { changedTouches } = event;
    
    // Check which touches have ended
    for (let i = 0; i < changedTouches.length; i++) {
      const touch = changedTouches[i];
      
      // Check if the joystick touch has ended
      if (touch.identifier === this.joystickTouch) {
        // Check if this was a tap (quick touch without much movement)
        const touchDuration = Date.now() - this.lastTapTime;
        const touchDistance = Math.sqrt(
          (touch.clientX - this.joystickStartX) ** 2 +
          (touch.clientY - this.joystickStartY) ** 2
        );
        
        if (touchDuration < this.tapTimeThreshold && touchDistance < this.tapDistanceThreshold) {
          // This was a tap, trigger action
          inputState.update(state => ({ ...state, action: true }));
          
          // Reset action after a short delay
          setTimeout(() => {
            inputState.update(state => ({ ...state, action: false }));
          }, 100);
        }
        
        this.joystickTouch = null;
        
        // Reset joystick direction
        inputState.update(state => ({
          ...state,
          direction: { x: 0, y: 0 }
        }));
      }
      
      // Check if the action touch has ended
      if (touch.identifier === this.actionTouch) {
        this.actionTouch = null;
        
        // Reset action button
        inputState.update(state => ({
          ...state,
          action: false
        }));
      }
    }
  }
  
  /**
   * Clean up by removing event listeners
   */
  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));
  }
  
  /**
   * Render the touch controls
   * @param ctx Canvas rendering context
   */
  public render(ctx: CanvasRenderingContext2D): void {
    // Get canvas dimensions
    const { width, height } = ctx.canvas;
    
    // Render joystick (only if active)
    if (this.joystickTouch !== null) {
      // Outer joystick circle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(this.joystickStartX, this.joystickStartY, this.joystickMaxRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner joystick handle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(this.joystickCurrentX, this.joystickCurrentY, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Render action button
    ctx.fillStyle = this.actionTouch !== null 
      ? 'rgba(255, 100, 100, 0.7)' 
      : 'rgba(255, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(width - 80, height / 4, 40, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Define interface for key states to enable type checking
 */
interface KeyStates {
  w?: boolean;
  a?: boolean;
  s?: boolean;
  d?: boolean;
  ArrowUp?: boolean;
  ArrowDown?: boolean;
  ArrowLeft?: boolean;
  ArrowRight?: boolean;
  ' '?: boolean; // space
  z?: boolean;
  x?: boolean;
  Shift?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * KeyboardController class for handling keyboard input
 * Used for debugging and desktop gameplay
 */
export class KeyboardController {
  private keyStates: KeyStates = {};
  
  constructor() {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    // Avoid repeating keys when held down
    if (event.repeat) return;
    
    this.keyStates[event.key] = true;
    this.updateInputState();
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    this.keyStates[event.key] = false;
    this.updateInputState();
  }
  
  private updateInputState(): void {
    const direction = { x: 0, y: 0 };
    
    // Check WASD or arrow keys for movement
    if (this.keyStates.w || this.keyStates.ArrowUp) direction.y = -1;
    if (this.keyStates.s || this.keyStates.ArrowDown) direction.y = 1;
    if (this.keyStates.a || this.keyStates.ArrowLeft) direction.x = -1;
    if (this.keyStates.d || this.keyStates.ArrowRight) direction.x = 1;
    
    // Normalize diagonal movement
    if (direction.x !== 0 && direction.y !== 0) {
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      direction.x /= length;
      direction.y /= length;
    }
    
    // Update the input state
    inputState.update(state => ({
      ...state,
      direction,
      action: Boolean(this.keyStates[' '] || this.keyStates.z),
      special: Boolean(this.keyStates.Shift || this.keyStates.x)
    }));
  }
  
  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
} 