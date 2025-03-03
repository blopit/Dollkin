/**
 * Vector2 class for 2D vector operations
 * Used for positions, velocities, and directions
 */
export class Vector2 {
  /** X component */
  public x: number;
  
  /** Y component */
  public y: number;
  
  /**
   * Constructor
   * @param x X component (default: 0)
   * @param y Y component (default: 0)
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  /**
   * Create a copy of this vector
   * @returns A new Vector2 with the same values
   */
  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
  
  /**
   * Add another vector to this one
   * @param other The vector to add
   * @returns This vector, for chaining
   */
  public add(other: Vector2): Vector2 {
    this.x += other.x;
    this.y += other.y;
    return this;
  }
  
  /**
   * Subtract another vector from this one
   * @param other The vector to subtract
   * @returns This vector, for chaining
   */
  public subtract(other: Vector2): Vector2 {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }
  
  /**
   * Multiply this vector by a scalar
   * @param scalar The scalar to multiply by
   * @returns This vector, for chaining
   */
  public multiply(scalar: number): Vector2 {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
  
  /**
   * Divide this vector by a scalar
   * @param scalar The scalar to divide by
   * @returns This vector, for chaining
   */
  public divide(scalar: number): Vector2 {
    if (scalar === 0) {
      console.warn('Division by zero in Vector2.divide');
      return this;
    }
    
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }
  
  /**
   * Get the magnitude (length) of this vector
   * @returns The magnitude
   */
  public magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  /**
   * Get the squared magnitude (for faster comparisons)
   * @returns The squared magnitude
   */
  public magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }
  
  /**
   * Normalize this vector (set its magnitude to 1)
   * @returns This vector, for chaining
   */
  public normalize(): Vector2 {
    const mag = this.magnitude();
    
    if (mag === 0) {
      return this;
    }
    
    return this.divide(mag);
  }
  
  /**
   * Set the components of this vector
   * @param x New X component
   * @param y New Y component
   * @returns This vector, for chaining
   */
  public set(x: number, y: number): Vector2 {
    this.x = x;
    this.y = y;
    return this;
  }
  
  /**
   * Calculate the dot product with another vector
   * @param other The other vector
   * @returns The dot product
   */
  public dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }
  
  /**
   * Calculate the distance to another vector
   * @param other The other vector
   * @returns The distance
   */
  public distance(other: Vector2): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate the squared distance to another vector (faster)
   * @param other The other vector
   * @returns The squared distance
   */
  public distanceSquared(other: Vector2): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }
  
  /**
   * Rotate this vector by an angle in radians
   * @param angle The angle in radians
   * @returns This vector, for chaining
   */
  public rotate(angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    
    this.x = x;
    this.y = y;
    
    return this;
  }
  
  /**
   * Get the angle of this vector in radians
   * @returns The angle in radians
   */
  public angle(): number {
    return Math.atan2(this.y, this.x);
  }
  
  /**
   * Static method to add two vectors
   * @param a First vector
   * @param b Second vector
   * @returns A new vector that is the sum of a and b
   */
  public static add(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }
  
  /**
   * Static method to subtract two vectors
   * @param a First vector
   * @param b Second vector
   * @returns A new vector that is a - b
   */
  public static subtract(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }
  
  /**
   * Static method to multiply a vector by a scalar
   * @param vector The vector
   * @param scalar The scalar
   * @returns A new vector that is vector * scalar
   */
  public static multiply(vector: Vector2, scalar: number): Vector2 {
    return new Vector2(vector.x * scalar, vector.y * scalar);
  }
  
  /**
   * Static method to divide a vector by a scalar
   * @param vector The vector
   * @param scalar The scalar
   * @returns A new vector that is vector / scalar
   */
  public static divide(vector: Vector2, scalar: number): Vector2 {
    if (scalar === 0) {
      console.warn('Division by zero in Vector2.divide');
      return vector.clone();
    }
    
    return new Vector2(vector.x / scalar, vector.y / scalar);
  }
  
  /**
   * Static method to calculate the distance between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns The distance
   */
  public static distance(a: Vector2, b: Vector2): number {
    return a.distance(b);
  }
  
  /**
   * Static method to calculate the dot product of two vectors
   * @param a First vector
   * @param b Second vector
   * @returns The dot product
   */
  public static dot(a: Vector2, b: Vector2): number {
    return a.dot(b);
  }
  
  /**
   * Static method to normalize a vector
   * @param vector The vector
   * @returns A new normalized vector
   */
  public static normalize(vector: Vector2): Vector2 {
    return vector.clone().normalize();
  }
  
  /**
   * Static method to create a vector from an angle and magnitude
   * @param angle The angle in radians
   * @param magnitude The magnitude (default: 1)
   * @returns A new vector
   */
  public static fromAngle(angle: number, magnitude = 1): Vector2 {
    return new Vector2(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }
  
  /**
   * Static method to create a zero vector
   * @returns A new vector with both components set to 0
   */
  public static zero(): Vector2 {
    return new Vector2(0, 0);
  }
  
  /**
   * Static method to create a vector with both components set to 1
   * @returns A new vector with both components set to 1
   */
  public static one(): Vector2 {
    return new Vector2(1, 1);
  }
  
  /**
   * Static method to create a unit vector pointing right (1, 0)
   * @returns A new vector pointing right
   */
  public static right(): Vector2 {
    return new Vector2(1, 0);
  }
  
  /**
   * Static method to create a unit vector pointing left (-1, 0)
   * @returns A new vector pointing left
   */
  public static left(): Vector2 {
    return new Vector2(-1, 0);
  }
  
  /**
   * Static method to create a unit vector pointing up (0, -1)
   * @returns A new vector pointing up
   */
  public static up(): Vector2 {
    return new Vector2(0, -1);
  }
  
  /**
   * Static method to create a unit vector pointing down (0, 1)
   * @returns A new vector pointing down
   */
  public static down(): Vector2 {
    return new Vector2(0, 1);
  }
} 