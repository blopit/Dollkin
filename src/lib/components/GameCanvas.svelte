<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  
  // Import weapon system
  import { weaponRegistry } from '$lib/game/weapons/registry';
  import { WeaponService } from '$lib/game/weapons/service';
  import { WeaponTier, SpreadPattern, SpecialAbility, StatusEffect } from '$lib/game/weapons/types';
  
  // Props
  export let width = window.innerWidth || 800;
  export let height = window.innerHeight || 600;
  export let debug = false;
  
  // Canvas element
  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  
  // Game state
  let gameTime = 0;
  let lastFrameTime = 0;
  let animationFrameId: number;
  
  // Player state
  const player = {
    x: 0,
    y: 0,
    size: 20,
    speed: 200,
    color: '#00ff00',
    health: 100,
    maxHealth: 100,
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    // Physics properties for collision
    mass: 10,
    restitution: 0.8, // Bounciness factor (0-1)
    // Dash properties
    dashSpeed: 800,
    dashDuration: 0.2,
    dashCooldown: 0.5, // Reduced from 1.0 to 0.5 seconds
    isDashing: false,
    dashDirection: { x: 0, y: 0 },
    dashTimeRemaining: 0,
    dashCooldownRemaining: 0,
    // Add velocity and friction properties
    velocityX: 0,
    velocityY: 0,
    friction: 0.92, // Higher values = less friction (0.9-0.99 is a good range)
    acceleration: 1500, // How quickly player reaches max speed
    // Add trail properties
    trail: [],
    // Add last movement direction for shooting
    lastMovementDirX: 0,
    lastMovementDirY: 1, // Default to down
    isMoving: false,
    // Weapon system
    currentWeaponId: 'blaster', // Default weapon
    weaponCharge: 0,
    maxWeaponCharge: 1.0,
    specialAbilityCooldown: 0,
    oilSpills: [],
    statusEffects: [],
    shields: []
  };
  
  // Input state
  let keys = {
    up: false,
    down: false,
    left: false,
    right: false
  };
  
  let mousePosition = { x: 0, y: 0 };
  let autoMove = true;
  let isPointerActive = false; // Add flag to track if mouse/touch is active
  
  // Add shooting direction lock variables
  let shootingDirectionLocked = false;
  let lockedShootingDirX = 0;
  let lockedShootingDirY = 1; // Default to shooting downward
  
  // Add camera panning variables
  let cameraPanX = 0;
  let cameraPanY = 0;
  let maxCameraPan = 150; // Maximum distance to pan the camera
  let cameraPanSpeed = 3; // How quickly the camera pans to the target position
  
  // Joystick properties
  let joystick = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    maxRadius: 100, // Maximum joystick radius
    deadzone: 10    // Minimum movement before registering input
  };
  
  // Enemies
  let enemies = [];
  let enemySpawnTimer = 0;
  let enemySpawnInterval = 1; // Seconds
  
  // Enemy wave system
  let currentWave = 0;
  let waveTimer = 0;
  let waveDuration = 30; // Seconds per wave
  let enemiesPerWave = 10; // Base number of enemies per wave
  let enemiesSpawnedInCurrentWave = 0;
  let waveCompleted = false;
  let waveTransitionTimer = 0;
  let waveTransitionDuration = 5; // Seconds between waves
  let bossSpawned = false;
  
  // Enemy types with their properties
  const enemyTypes = {
    easy: { 
      size: 15, 
      speed: 50, 
      health: 30, 
      color: '#ff6666',
      spawnCount: 1.0 // Multiplier for number of enemies
    },
    fast: { 
      size: 12, 
      speed: 120, 
      health: 20, 
      color: '#66ff66',
      spawnCount: 0.7
    },
    many: { 
      size: 10, 
      speed: 40, 
      health: 15, 
      color: '#6666ff',
      spawnCount: 2.0
    },
    strong: { 
      size: 25, 
      speed: 30, 
      health: 100, 
      color: '#ff66ff',
      spawnCount: 0.5
    },
    weak: { 
      size: 8, 
      speed: 100, 
      health: 10, 
      color: '#ffff66',
      spawnCount: 1.8
    },
    few: { 
      size: 20, 
      speed: 90, 
      health: 80, 
      color: '#66ffff',
      spawnCount: 0.4
    },
    slow: { 
      size: 30, 
      speed: 20, 
      health: 120, 
      color: '#ff9966',
      spawnCount: 1.5
    },
    hard: { 
      size: 22, 
      speed: 80, 
      health: 150, 
      color: '#9966ff',
      spawnCount: 1.2
    },
    boss: { 
      size: 50, 
      speed: 15, 
      health: 500, 
      color: '#ff0000',
      spawnCount: 0.1
    }
  };
  
  // Wave definitions - which enemy types appear in each wave
  const waveDefinitions = [
    // Starting with easy enemies
    { name: "Easy", types: ["easy"] },
    
    // These in any order (as per user request)
    { name: "Fast", types: ["fast"] },
    { name: "Many", types: ["many"] },
    { name: "Strong", types: ["strong"] },
    
    // These in any order (as per user request)
    { name: "Weak", types: ["weak"] },
    { name: "Few", types: ["few"] },
    { name: "Slow", types: ["slow"] },
    
    // Hard wave with all difficult enemies
    { name: "Hard", types: ["hard"] },
    
    // Boss wave
    { name: "Boss", types: ["boss"] }
  ];
  
  // Projectiles
  let projectiles = [];
  let projectileTimer = 0;
  let projectileInterval = 1.0; // Doubled from 0.5 to 1.0 seconds (halved fire rate)
  let baseProjectileInterval = 1.0; // Doubled from 0.5 to 1.0 seconds (halved fire rate)
  let boostedProjectileInterval = 0.66; // Doubled from 0.33 to 0.66 seconds (halved fire rate)
  
  // Experience gems
  let experienceGems = [];
  
  // Touch gesture tracking
  let touchStartPosition = { x: 0, y: 0 };
  let touchStartTime = 0;
  let lastTouchPosition = { x: 0, y: 0 };
  const SWIPE_THRESHOLD = 50; // pixels - reduced from 80 to make swipes more sensitive
  const SWIPE_TIME_THRESHOLD = 300; // milliseconds
  
  // Add a function to reset the pointer active state after a delay
  let pointerActiveTimeoutId: number;
  function resetPointerActiveTimeout() {
    // Clear any existing timeout
    if (pointerActiveTimeoutId) {
      clearTimeout(pointerActiveTimeoutId);
    }
    
    // Set a new timeout to reset the pointer active state after 100ms
    pointerActiveTimeoutId = setTimeout(() => {
      isPointerActive = false;
      // We only want to unlock shooting direction when touch is explicitly released
    }, 100) as unknown as number;
  }
  
  // Add collision counter
  let collisionCount = 0;
  let enemyCollisionCount = 0;
  
  // Add screen shake effect
  let screenShake = 0;
  
  // Add shooting direction arrow properties
  let showShootingArrow = true; // Can be toggled if needed
  let arrowLength = 40; // Length of the direction arrow
  let arrowWidth = 10; // Width of the arrow head
  
  // Add variables for smooth rotation
  let currentRotationDirX = 0;
  let currentRotationDirY = 1; // Default to down
  let rotationSpeed = 5; // Adjust this value to control rotation speed (higher = faster)
  
  // Initialize weapon service
  const weaponService = new WeaponService();
  
  // Initialize the game
  function initGame() {
    if (!browser) return;
    
    // Set up canvas
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');
    container.appendChild(canvas);
    
    // Center player
    player.x = width / 2;
    player.y = height / 2;
    
    // Set up event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Start game loop
    lastFrameTime = performance.now();
    gameLoop();
    
    console.log("Game initialized successfully");
  }
  
  // Game loop
  function gameLoop(timestamp = performance.now()) {
    if (!browser) return;
    
    // Calculate delta time
    const deltaTime = (timestamp - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = timestamp;
    
    // Update game time
    gameTime += deltaTime;
    
    // Clear canvas
    ctx.fillStyle = '#111133';
    ctx.fillRect(0, 0, width, height);
    
    // Apply screen shake effect
    if (screenShake > 0) {
      const shakeAmount = 10 * screenShake;
      const shakeX = (Math.random() - 0.5) * shakeAmount;
      const shakeY = (Math.random() - 0.5) * shakeAmount;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      screenShake -= deltaTime * 2; // Decay screen shake over time
      if (screenShake < 0) screenShake = 0;
    }
    
    // Draw grid
    drawGrid();
    
    // Update player
    updatePlayer(deltaTime);
    
    // Update enemies
    updateEnemies(deltaTime);
    
    // Update projectiles
    updateProjectiles(deltaTime);
    
    // Update experience gems
    updateExperienceGems(deltaTime);
    
    // Update particles
    updateParticles(deltaTime);
    
    // Update visual effects
    updateEffects(deltaTime);
    
    // Spawn enemies
    if (enemies.length === 0 && enemiesSpawnedInCurrentWave >= getEnemyCountForWave(currentWave)) {
      // All enemies for this wave have been spawned and defeated
      if (!waveCompleted) {
        waveCompleted = true;
        waveTransitionTimer = 0;
      }
    }
    
    if (waveCompleted) {
      // Show wave completed message and transition to next wave
      waveTransitionTimer += deltaTime;
      if (waveTransitionTimer >= waveTransitionDuration) {
        currentWave++;
        waveCompleted = false;
        enemiesSpawnedInCurrentWave = 0;
        waveTimer = 0;
        
        // Reset boss spawned flag if moving to a new wave
        if (currentWave % waveDefinitions.length !== waveDefinitions.length - 1) {
          bossSpawned = false;
        }
      }
    } else {
      // Normal wave progression
      waveTimer += deltaTime;
      enemySpawnTimer += deltaTime;
      
      // Check if it's time to spawn an enemy
      const maxEnemiesForWave = getEnemyCountForWave(currentWave);
      if (enemySpawnTimer >= enemySpawnInterval && enemiesSpawnedInCurrentWave < maxEnemiesForWave) {
        // Special case for boss wave
        if (currentWave % waveDefinitions.length === waveDefinitions.length - 1) {
          if (!bossSpawned) {
            spawnEnemyOfType("boss");
            bossSpawned = true;
          }
        } else {
          // Regular enemy spawning
          const waveIndex = currentWave % waveDefinitions.length;
          const waveTypes = waveDefinitions[waveIndex].types;
          const randomType = waveTypes[Math.floor(Math.random() * waveTypes.length)];
          spawnEnemyOfType(randomType);
        }
        
        enemySpawnTimer = 0;
        enemiesSpawnedInCurrentWave++;
      }
    }
    
    // Update projectile interval based on shooting lock state and weapon type
    const currentWeapon = weaponRegistry.get(player.currentWeaponId);
    projectileInterval = shootingDirectionLocked && currentWeapon?.fireRate ? 
      currentWeapon.fireRate * 0.7 : // 30% faster when locked
      currentWeapon?.fireRate || 300;
    
    // Auto-shoot projectiles based on weapon type
    projectileTimer += deltaTime;
    
    if (currentWeapon?.id === 'charge-beam') {
      if (shootingDirectionLocked) {
        // Charge the weapon when locked
        player.weaponCharge = Math.min(player.maxWeaponCharge, player.weaponCharge + deltaTime);
      } else if (player.weaponCharge > 0) {
        // Fire charged shot when unlocked
        shootProjectile(player.weaponCharge);
        player.weaponCharge = 0;
      }
    } else if (projectileTimer >= projectileInterval / 1000) {
      shootProjectile();
      projectileTimer = 0;
    }
    
    // Update special ability cooldown
    if (player.specialAbilityCooldown > 0) {
      player.specialAbilityCooldown -= deltaTime * 1000;
      if (player.specialAbilityCooldown < 0) {
        player.specialAbilityCooldown = 0;
      }
    }
    
    // Draw UI
    drawUI();
    
    // Reset screen shake transform if active
    if (screenShake > 0) {
      ctx.restore();
    }
    
    // Request next frame
    animationFrameId = requestAnimationFrame(gameLoop);
  }
  
  // Draw grid
  function drawGrid() {
    const gridSize = 50;
    // Fix: Ensure consistent application of camera pan offset
    const offsetX = (player.x) % gridSize - cameraPanX;
    const offsetY = (player.y) % gridSize - cameraPanY;
    
    ctx.strokeStyle = '#222244';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Vertical lines
    for (let x = -offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    // Horizontal lines
    for (let y = -offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
    
    // Draw origin marker
    // Fix: Ensure consistent application of camera pan offset
    const originX = width / 2 - (player.x % gridSize) + cameraPanX;
    const originY = height / 2 - (player.y % gridSize) + cameraPanY;
    
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX - 10, originY);
    ctx.lineTo(originX + 10, originY);
    ctx.moveTo(originX, originY - 10);
    ctx.lineTo(originX, originY + 10);
    ctx.stroke();
  }
  
  // Update player
  function updatePlayer(deltaTime: number) {
    // Update camera panning
    updateCameraPan(deltaTime);
    
    // Handle dash cooldown
    if (player.dashCooldownRemaining > 0) {
      player.dashCooldownRemaining -= deltaTime;
    }
    
    // Add trail point if dashing or moving fast enough
    if (player.isDashing || 
        (Math.abs(player.velocityX) > player.speed * 0.6 || 
         Math.abs(player.velocityY) > player.speed * 0.6)) {
      
      // Calculate trail intensity based on movement speed
      const speed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
      const speedRatio = Math.min(1, speed / player.speed);
      
      // Add current position to trail with properties based on movement
      player.trail.push({
        x: player.x,
        y: player.y,
        size: player.isDashing ? player.size * 0.8 : player.size * 0.5 * speedRatio,
        alpha: player.isDashing ? 1.0 : 0.7 * speedRatio,
        age: 0,
        // Add slight offset for more organic feel
        offsetX: (Math.random() * 2 - 1) * 2,
        offsetY: (Math.random() * 2 - 1) * 2
      });
    }
    
    // Update and draw trail
    for (let i = player.trail.length - 1; i >= 0; i--) {
      const trailPoint = player.trail[i];
      trailPoint.age += deltaTime;
      trailPoint.alpha = Math.max(0, 1 - (trailPoint.age / 0.3)); // Fade out over 0.3 seconds
      trailPoint.size *= 0.97; // Shrink over time
      
      // Remove old trail points
      if (trailPoint.alpha <= 0) {
        player.trail.splice(i, 1);
        continue;
      }
      
      // Draw trail point with slight offset for more organic feel
      const screenX = width / 2 + (trailPoint.x - player.x) + cameraPanX + (trailPoint.offsetX || 0);
      const screenY = height / 2 + (trailPoint.y - player.y) + cameraPanY + (trailPoint.offsetY || 0);
      
      // Use a gradient for more interesting trail
      if (player.isDashing) {
        ctx.fillStyle = `rgba(0, 255, 255, ${trailPoint.alpha})`;
      } else {
        // More subtle color for normal movement
        ctx.fillStyle = `rgba(180, 230, 255, ${trailPoint.alpha * 0.8})`;
      }
      
      ctx.beginPath();
      ctx.arc(screenX, screenY, trailPoint.size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Handle dash if active
    if (player.isDashing) {
      // Move player in dash direction at dash speed
      player.x += player.dashDirection.x * player.dashSpeed * deltaTime;
      player.y += player.dashDirection.y * player.dashSpeed * deltaTime;
      
      // Decrease dash time remaining
      player.dashTimeRemaining -= deltaTime;
      
      // End dash if time is up
      if (player.dashTimeRemaining <= 0) {
        player.isDashing = false;
        player.dashCooldownRemaining = player.dashCooldown;
      }
      
      // Draw dash effect (glow)
      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, player.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal movement when not dashing
      // Calculate movement direction
      let dx = 0;
      let dy = 0;
      
      if (autoMove) {
        // Auto-move towards mouse position only if pointer is active
        if (isPointerActive) {
          const centerX = width / 2;
          const centerY = height / 2;
          
          // Calculate direction from center to mouse
          const deltaX = mousePosition.x - centerX;
          const deltaY = mousePosition.y - centerY;
          
          // Calculate magnitude
          const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          // Only move if the mouse is far enough from center (30px threshold)
          if (length > joystick.deadzone) {
            // Normalize the direction vector
            dx = deltaX / length;
            dy = deltaY / length;
          }
        }
        // If pointer is not active, dx and dy remain 0, so player will slow down due to friction
      } else {
        // Manual keyboard movement
        if (keys.up) dy -= 1;
        if (keys.down) dy += 1;
        if (keys.left) dx -= 1;
        if (keys.right) dx += 1;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
          const length = Math.sqrt(dx * dx + dy * dy);
          dx /= length;
          dy /= length;
        }
      }
      
      // Check if player is moving
      const wasMoving = player.isMoving;
      player.isMoving = (dx !== 0 || dy !== 0);
      
      // If player just started moving, update the last movement direction
      if (player.isMoving && !wasMoving) {
        player.lastMovementDirX = dx;
        player.lastMovementDirY = dy;
        
        // IMPORTANT: Do NOT lock shooting direction based on movement
        // We only want to lock shooting direction when touch starts
      }
      
      // Apply acceleration to velocity
      if (dx !== 0 || dy !== 0) {
        // Player is actively moving
        player.velocityX += dx * player.acceleration * deltaTime;
        player.velocityY += dy * player.acceleration * deltaTime;
        
        // Cap maximum velocity
        const currentSpeed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
        if (currentSpeed > player.speed) {
          const scale = player.speed / currentSpeed;
          player.velocityX *= scale;
          player.velocityY *= scale;
        }
      } else {
        // Player stopped moving, but DO NOT unlock shooting direction here
        // We only want to unlock shooting direction when touch is released
      }
      
      // Apply friction
      player.velocityX *= player.friction;
      player.velocityY *= player.friction;
      
      // Stop completely if velocity is very small
      if (Math.abs(player.velocityX) < 0.1) player.velocityX = 0;
      if (Math.abs(player.velocityY) < 0.1) player.velocityY = 0;
      
      // Apply velocity to position
      player.x += player.velocityX * deltaTime;
      player.y += player.velocityY * deltaTime;
    }
    
    // Draw player (always at center of screen)
    ctx.fillStyle = player.color;
    
    // Calculate player scale based on movement speed
    const playerSpeed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
    const speedRatio = playerSpeed / player.speed;
    
    // Slight squash and stretch effect based on movement
    let scaleX = 1.0;
    let scaleY = 1.0;
    
    if (playerSpeed > 20) {
      // Stretch in the direction of movement
      const normalizedVelX = player.velocityX / playerSpeed;
      const normalizedVelY = player.velocityY / playerSpeed;
      
      // Calculate stretch amount (max 20% stretch)
      const stretchAmount = 0.2 * Math.min(1.0, speedRatio);
      
      // Apply stretch in movement direction and squash perpendicular
      scaleX = 1.0 + (stretchAmount * Math.abs(normalizedVelX));
      scaleY = 1.0 + (stretchAmount * Math.abs(normalizedVelY));
      
      // Ensure we maintain roughly the same area (volume preservation)
      const areaMultiplier = scaleX * scaleY;
      if (areaMultiplier > 1.0) {
        const correction = 1.0 / Math.sqrt(areaMultiplier);
        scaleX *= correction;
        scaleY *= correction;
      }
    }
    
    // Save context for transformation
    ctx.save();
    
    // Translate to player center
    ctx.translate(width / 2 + cameraPanX, height / 2 + cameraPanY);
    
    // Scale for squash and stretch
    ctx.scale(scaleX, scaleY);
    
    // Draw the player with transformation applied
    ctx.beginPath();
    ctx.arc(0, 0, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Restore context
    ctx.restore();
    
    // Draw shooting direction arrow
    if (showShootingArrow) {
      drawShootingDirectionArrow();
    }
    
    // Draw dash cooldown indicator if on cooldown
    if (player.dashCooldownRemaining > 0) {
      const cooldownPercentage = player.dashCooldownRemaining / player.dashCooldown;
      const dashIndicatorSize = 8;
      
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2 + player.size + 15, dashIndicatorSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2 + player.size + 15);
      ctx.arc(width / 2, height / 2 + player.size + 15, dashIndicatorSize, -Math.PI / 2, -Math.PI / 2 + (1 - cooldownPercentage) * Math.PI * 2);
      ctx.lineTo(width / 2, height / 2 + player.size + 15);
      ctx.fill();
    }
    
    // Draw joystick if active and in debug mode
    if (joystick.active && debug) {
      // Draw joystick base
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(joystick.startX, joystick.startY, joystick.maxRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw joystick handle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(joystick.currentX, joystick.currentY, 30, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw line from start to current
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(joystick.startX, joystick.startY);
      ctx.lineTo(joystick.currentX, joystick.currentY);
      ctx.stroke();
      
      // Draw deadzone
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(joystick.startX, joystick.startY, joystick.deadzone, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw velocity indicator (debug)
    if (debug) {
      const velocityLength = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2, height / 2);
      ctx.lineTo(
        width / 2 + (player.velocityX / player.speed) * 50,
        height / 2 + (player.velocityY / player.speed) * 50
      );
      ctx.stroke();
      
      // Draw velocity text
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Velocity: ${velocityLength.toFixed(1)}`, 10, height - 20);
    }
    
    // Draw player health bar
    const healthBarWidth = 50;
    const healthBarHeight = 6;
    // Fix: Apply camera pan to health bar position
    const healthBarX = width / 2 - healthBarWidth / 2 + cameraPanX;
    const healthBarY = height / 2 - player.size - 15 + cameraPanY;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * (player.health / player.maxHealth), healthBarHeight);
  }
  
  // Update enemies
  function updateEnemies(deltaTime: number) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      
      // Update hit flash effect
      if (enemy.hitFlash > 0) {
        enemy.hitFlash -= deltaTime * 5;
      }
      
      // Move enemy towards player with physics
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize direction
      const dirX = dx / distance;
      const dirY = dy / distance;
      
      // Apply acceleration towards player
      const acceleration = enemy.speed * 2; // Convert speed to acceleration
      enemy.velocityX += dirX * acceleration * deltaTime;
      enemy.velocityY += dirY * acceleration * deltaTime;
      
      // Apply speed limit
      const currentSpeed = Math.sqrt(enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY);
      if (currentSpeed > enemy.speed) {
        enemy.velocityX = (enemy.velocityX / currentSpeed) * enemy.speed;
        enemy.velocityY = (enemy.velocityY / currentSpeed) * enemy.speed;
      }
      
      // Move enemy with velocity
      enemy.x += enemy.velocityX * deltaTime;
      enemy.y += enemy.velocityY * deltaTime;
      
      // Calculate screen position (with camera pan)
      const screenX = width / 2 + (enemy.x - player.x) + cameraPanX;
      const screenY = height / 2 + (enemy.y - player.y) + cameraPanY;
      
      // Check if enemy is on screen
      if (screenX > -enemy.size && screenX < width + enemy.size &&
          screenY > -enemy.size && screenY < height + enemy.size) {
        
        // Draw enemy with hit flash effect
        if (enemy.hitFlash > 0) {
          // White flash when hit
          const flashIntensity = Math.min(1, enemy.hitFlash);
          const r = 255;
          const g = Math.floor(255 - (255 - parseInt(enemy.color.slice(1, 3), 16)) * (1 - flashIntensity));
          const b = Math.floor(255 - (255 - parseInt(enemy.color.slice(3, 5), 16)) * (1 - flashIntensity));
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        } else {
          ctx.fillStyle = enemy.color;
        }
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw velocity vector in debug mode
        if (debug) {
          const velocityLength = Math.sqrt(enemy.velocityX * enemy.velocityX + enemy.velocityY * enemy.velocityY);
          if (velocityLength > 10) { // Only show significant velocities
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(
              screenX + (enemy.velocityX / enemy.speed) * 30,
              screenY + (enemy.velocityY / enemy.speed) * 30
            );
            ctx.stroke();
          }
        }
        
        // Check collision with player
        const playerDistance = Math.sqrt(
          Math.pow(enemy.x - player.x, 2) + 
          Math.pow(enemy.y - player.y, 2)
        );
        
        if (playerDistance < player.size + enemy.size) {
          // Handle collision physics
          handleCollision(player, enemy);
          
          // Damage player
          player.health -= enemy.damage * deltaTime;
          
          // Game over if health <= 0
          if (player.health <= 0) {
            player.health = 0;
            console.log("Game Over!");
            // Implement game over logic here
          }
        }
        
        // Check collisions with other enemies
        for (let j = i - 1; j >= 0; j--) {
          const otherEnemy = enemies[j];
          const enemyDistance = Math.sqrt(
            Math.pow(enemy.x - otherEnemy.x, 2) + 
            Math.pow(enemy.y - otherEnemy.y, 2)
          );
          
          if (enemyDistance < enemy.size + otherEnemy.size) {
            // Handle collision physics between enemies
            handleCollision(enemy, otherEnemy);
          }
        }
      }
      
      // Remove enemies that are too far away
      if (distance > 1000) {
        enemies.splice(i, 1);
      }
    }
  }
  
  // Physics collision handling function
  function handleCollision(object1, object2) {
    // Calculate collision normal
    const dx = object2.x - object1.x;
    const dy = object2.y - object1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize collision normal
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Calculate relative velocity
    const relVelX = object2.velocityX - object1.velocityX;
    const relVelY = object2.velocityY - object1.velocityY;
    
    // Calculate relative velocity in terms of the normal direction
    const relVelDotNormal = relVelX * nx + relVelY * ny;
    
    // Do not resolve if objects are moving away from each other
    if (relVelDotNormal > 0) return;
    
    // Calculate restitution (bounciness)
    const restitution = Math.min(object1.restitution, object2.restitution);
    
    // Calculate impulse scalar
    const impulseScalar = -(1 + restitution) * relVelDotNormal;
    const totalMass = object1.mass + object2.mass;
    const impulseScalar1 = impulseScalar * (object2.mass / totalMass);
    const impulseScalar2 = impulseScalar * (object1.mass / totalMass);
    
    // Apply impulse
    if (!object1.isDashing) { // Don't affect player velocity if dashing
      object1.velocityX -= impulseScalar1 * nx;
      object1.velocityY -= impulseScalar1 * ny;
    }
    
    object2.velocityX += impulseScalar2 * nx;
    object2.velocityY += impulseScalar2 * ny;
    
    // Separate objects to prevent sticking (positional correction)
    const overlap = (object1.size + object2.size) - distance;
    if (overlap > 0) {
      const separationX = nx * overlap * 0.5;
      const separationY = ny * overlap * 0.5;
      
      if (!object1.isDashing) { // Don't move player if dashing
        object1.x -= separationX;
        object1.y -= separationY;
      }
      
      object2.x += separationX;
      object2.y += separationY;
    }
    
    // Update collision counters
    if (object1 === player || object2 === player) {
      collisionCount++;
    } else {
      enemyCollisionCount++;
    }
    
    // Add visual effect for collision
    addCollisionEffect(object1.x + (object2.x - object1.x) * 0.5, 
                     object1.y + (object2.y - object1.y) * 0.5);
  }
  
  // Add visual effect for collisions
  function addCollisionEffect(x, y) {
    // Create particles at collision point
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      const lifetime = 0.3 + Math.random() * 0.3;
      const size = 2 + Math.random() * 3;
      
      particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size,
        color: '#ffffff',
        lifetime,
        timeRemaining: lifetime
      });
    }
  }
  
  // Add particles array for collision effects
  let particles = [];
  
  // Visual effects
  let effects = [];
  
  // Update particles
  function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // Update position
      particle.x += particle.velocityX * deltaTime;
      particle.y += particle.velocityY * deltaTime;
      
      // Update lifetime
      particle.timeRemaining -= deltaTime;
      
      // Remove if expired
      if (particle.timeRemaining <= 0) {
        particles.splice(i, 1);
        continue;
      }
      
      // Calculate screen position (with camera pan)
      const screenX = width / 2 + (particle.x - player.x) + cameraPanX;
      const screenY = height / 2 + (particle.y - player.y) + cameraPanY;
      
      // Draw particle
      const alpha = particle.timeRemaining / particle.lifetime;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screenX, screenY, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Update visual effects
  function updateEffects(deltaTime) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      
      // Update lifetime
      effect.timeRemaining -= deltaTime;
      
      // Remove if expired
      if (effect.timeRemaining <= 0) {
        effects.splice(i, 1);
        continue;
      }
      
      // Handle different effect types
      if (effect.type === 'flash') {
        // Calculate screen position (with camera pan)
        const screenX = width / 2 + (effect.x - player.x) + cameraPanX;
        const screenY = height / 2 + (effect.y - player.y) + cameraPanY;
        
        // Draw flash effect
        const progress = effect.timeRemaining / effect.lifetime;
        const radius = effect.radius * (1 + (1 - progress) * 2);
        const alpha = progress * 0.7;
        
        // Create gradient
        const gradient = ctx.createRadialGradient(
          screenX, screenY, 0,
          screenX, screenY, radius
        );
        gradient.addColorStop(0, 'rgba(' + effect.color.r + ', ' + effect.color.g + ', ' + effect.color.b + ', ' + alpha + ')');
        gradient.addColorStop(0.7, 'rgba(' + effect.color.r + ', ' + effect.color.g + ', ' + effect.color.b + ', ' + (alpha * 0.5) + ')');
        gradient.addColorStop(1, 'rgba(' + effect.color.r + ', ' + effect.color.g + ', ' + effect.color.b + ', 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // Update projectiles
  function updateProjectiles(deltaTime: number) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const projectile = projectiles[i];
      
      // Move projectile
      projectile.x += projectile.dirX * projectile.speed * deltaTime;
      projectile.y += projectile.dirY * projectile.speed * deltaTime;
      
      // Handle bouncing toward enemies for bouncer projectiles
      // Check for bounce after movement
      if (projectile.type === 'bouncer' && Math.random() < 0.05) { // 5% chance per frame to check for bounce
        handleProjectileBounce(projectile);
      }
      
      // Calculate screen position
      const screenX = width / 2 + (projectile.x - player.x) + cameraPanX;
      const screenY = height / 2 + (projectile.y - player.y) + cameraPanY;
      
      // Check if projectile is on screen
      if (screenX > -projectile.size && screenX < width + projectile.size &&
          screenY > -projectile.size && screenY < height + projectile.size) {
        
        // Special rendering for different projectile types
        if (projectile.type === 'flamethrower') {
          // Flame particles fade out over time
          projectile.alpha = projectile.lifetime / (weaponTypes.flamethrower.range / projectile.speed);
          
          // Draw flame with gradient
          const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, projectile.size * 2
          );
          gradient.addColorStop(0, 'rgba(255, 255, 0, ' + projectile.alpha + ')');
          gradient.addColorStop(0.5, 'rgba(255, 100, 0, ' + (projectile.alpha * 0.8) + ')');
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenX, screenY, projectile.size * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (projectile.type === 'bouncer') {
          // Draw bouncer projectile with glowing effect
          // Outer glow
          const glowSize = projectile.size * 2;
          const gradient = ctx.createRadialGradient(
            screenX, screenY, projectile.size * 0.5,
            screenX, screenY, glowSize
          );
          gradient.addColorStop(0, '#00ff88'); // Bright center
          gradient.addColorStop(0.5, 'rgba(0, 255, 136, 0.5)'); // Mid glow
          gradient.addColorStop(1, 'rgba(0, 255, 136, 0)'); // Fade out
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(screenX, screenY, projectile.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Add trail particles occasionally
          if (Math.random() < 0.3) {
            particles.push({
              x: projectile.x,
              y: projectile.y,
              velocityX: (Math.random() - 0.5) * 50,
              velocityY: (Math.random() - 0.5) * 50,
              size: 2 + Math.random() * 3,
              color: '#00ff88',
              lifetime: 0.2 + Math.random() * 0.2,
              timeRemaining: 0.2 + Math.random() * 0.2
            });
          }
        } else if (projectile.type === 'chargeBeam') {
          // Draw charged beam with size based on charge
          // Draw beam trail
          const beamLength = 50; // Length of the beam
          const beamWidth = projectile.size * 1.5;
          
          // Calculate beam end points
          const beamEndX = screenX - projectile.dirX * beamLength;
          const beamEndY = screenY - projectile.dirY * beamLength;
          
          // Draw beam trail with gradient
          const gradient = ctx.createLinearGradient(
            screenX, screenY,
            beamEndX, beamEndY
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
          gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.7)');
          gradient.addColorStop(1, 'rgba(128, 0, 128, 0)');
          
          // Draw beam as a line with thickness
          ctx.strokeStyle = gradient;
          ctx.lineWidth = beamWidth;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(beamEndX, beamEndY);
          ctx.stroke();
          
          // Draw projectile head with glow effect
          const headGradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, projectile.size * 2
          );
          headGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          headGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.8)');
          headGradient.addColorStop(1, 'rgba(128, 0, 128, 0)');
          
          ctx.fillStyle = headGradient;
          ctx.beginPath();
          ctx.arc(screenX, screenY, projectile.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw standard projectile with trail effect
          // Draw trail
          ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(
            screenX - projectile.dirX * 10,
            screenY - projectile.dirY * 10,
            projectile.size * 1.5,
            0, Math.PI * 2
          );
          ctx.fill();
          
          // Draw projectile
          ctx.fillStyle = projectile.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY, projectile.size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Check collision with enemies
        let hitEnemy = false;
        
        if (projectile.type !== 'flamethrower' || Math.random() < 0.3) { // Flames only check collision occasionally for performance
          for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemyScreenX = width / 2 + (enemy.x - player.x) + cameraPanX;
            const enemyScreenY = height / 2 + (enemy.y - player.y) + cameraPanY;
            
            const distance = Math.sqrt(
              Math.pow(screenX - enemyScreenX, 2) + 
              Math.pow(screenY - enemyScreenY, 2)
            );
            
            if (distance < projectile.size + enemy.size) {
              // Hit enemy
              enemy.health -= projectile.damage;
              enemy.hitFlash = 0.3; // Flash effect duration
              
              // Apply knockback based on projectile type
              let knockbackForce = 600 + projectile.damage * 20;
              
              if (projectile.type === 'chargeBeam') {
                // Charged beam has more knockback
                knockbackForce = 1000 + projectile.damage * 40;
              } else if (projectile.type === 'flamethrower') {
                // Flamethrower has less knockback
                knockbackForce = 200 + projectile.damage * 10;
              }
              
              enemy.velocityX += projectile.dirX * knockbackForce / enemy.mass;
              enemy.velocityY += projectile.dirY * knockbackForce / enemy.mass;
              
              // Add impact effect
              addImpactEffect(enemy.x, enemy.y, projectile.dirX, projectile.dirY);
              
              // Check if enemy is killed
              if (enemy.health <= 0) {
                // Spawn experience gem
                spawnExperienceGem(enemy.x, enemy.y, enemy.size);
                
                // Remove enemy
                enemies.splice(j, 1);
              }
              
              hitEnemy = true;
            }
          }
        }
        
        // Remove projectile if it hit an enemy (except for flamethrower which passes through)
        if (hitEnemy && projectile.type !== 'flamethrower') {
          projectiles.splice(i, 1);
          continue;
        }
      }
      
      // Remove projectiles that are too far away
      const distance = Math.sqrt(
        Math.pow(projectile.x - player.x, 2) + 
        Math.pow(projectile.y - player.y, 2)
      );
      
      if (distance > 1000 || projectile.lifetime <= 0) {
        projectiles.splice(i, 1);
      } else {
        projectile.lifetime -= deltaTime;
      }
    }
    
    // Update oil spills
    for (let i = player.oilSpills.length - 1; i >= 0; i--) {
      const oilSpill = player.oilSpills[i];
      
      // Reduce lifetime
      oilSpill.lifetime -= deltaTime;
      
      // Remove if expired
      if (oilSpill.lifetime <= 0) {
        player.oilSpills.splice(i, 1);
        continue;
      }
      
      // Calculate screen position
      const screenX = width / 2 + (oilSpill.x - player.x) + cameraPanX;
      const screenY = height / 2 + (oilSpill.y - player.y) + cameraPanY;
      
      // Draw oil spill
      ctx.fillStyle = oilSpill.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, oilSpill.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Check collision with enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        const dx = enemy.x - oilSpill.x;
        const dy = enemy.y - oilSpill.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < oilSpill.size + enemy.size) {
          // Apply damage over time
          enemy.health -= oilSpill.damage * deltaTime;
          enemy.hitFlash = 0.1; // Subtle flash effect
          
          // Apply slowing effect
          enemy.speed = enemy.baseSpeed * 0.5; // Slow by 50%
          
          // Check if enemy is killed
          if (enemy.health <= 0) {
            // Spawn experience gem
            spawnExperienceGem(enemy.x, enemy.y, enemy.size);
            
            // Remove enemy
            enemies.splice(j, 1);
          }
        } else {
          // Reset speed if not in oil
          enemy.speed = enemy.baseSpeed;
        }
      }
    }
  }
  
  // Update experience gems
  function updateExperienceGems(deltaTime: number) {
    for (let i = experienceGems.length - 1; i >= 0; i--) {
      const gem = experienceGems[i];
      
      // Move gem towards player if close enough
      const dx = player.x - gem.x;
      const dy = player.y - gem.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Attraction range increases over time
      const attractionRange = 100 + (gameTime - gem.spawnTime) * 20;
      
      if (distance < attractionRange) {
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Move gem towards player with increasing speed
        const attractionSpeed = 100 + (gameTime - gem.spawnTime) * 50;
        gem.x += dirX * attractionSpeed * deltaTime;
        gem.y += dirY * attractionSpeed * deltaTime;
      }
      
      // Calculate screen position (with camera pan)
      const screenX = width / 2 + (gem.x - player.x) + cameraPanX;
      const screenY = height / 2 + (gem.y - player.y) + cameraPanY;
      
      // Check if gem is on screen
      if (screenX > -gem.size && screenX < width + gem.size &&
          screenY > -gem.size && screenY < height + gem.size) {
        
        // Draw gem
        ctx.fillStyle = gem.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, gem.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Check collision with player
        const playerDistance = Math.sqrt(
          Math.pow(screenX - width / 2, 2) + 
          Math.pow(screenY - height / 2, 2)
        );
        
        if (playerDistance < player.size + gem.size) {
          // Add experience
          player.experience += gem.value;
          
          // Level up if enough experience
          if (player.experience >= player.experienceToNextLevel) {
            player.level++;
            player.experience -= player.experienceToNextLevel;
            player.experienceToNextLevel = Math.floor(player.experienceToNextLevel * 1.2);
            player.maxHealth += 10;
            player.health = player.maxHealth;
            player.speed += 5;
            
            // Decrease projectile interval (shoot faster)
            baseProjectileInterval = Math.max(0.1, baseProjectileInterval * 0.9);
            boostedProjectileInterval = Math.max(0.07, baseProjectileInterval / 1.5); // Keep the 50% boost
            
            console.log(`Level up! Now level ${player.level}`);
          }
          
          // Remove gem
          experienceGems.splice(i, 1);
        }
      }
      
      // Remove gems that are too far away
      if (distance > 1000) {
        experienceGems.splice(i, 1);
      }
    }
  }
  
  // Spawn enemy
  function spawnEnemy() {
    // This function is kept for backward compatibility
    spawnEnemyOfType("easy");
  }
  
  // Spawn enemy of specific type
  function spawnEnemyOfType(type) {
    // Get enemy type properties
    const enemyType = enemyTypes[type] || enemyTypes.easy;
    
    // Spawn enemy outside the screen
    const angle = Math.random() * Math.PI * 2;
    const distance = 400 + Math.random() * 100; // Spawn just outside the visible area
    
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    
    // Add some variation to the enemy properties
    const sizeVariation = 0.9 + Math.random() * 0.2; // 90% to 110% of base size
    const speedVariation = 0.9 + Math.random() * 0.2; // 90% to 110% of base speed
    const healthVariation = 0.9 + Math.random() * 0.2; // 90% to 110% of base health
    
    // Scale health and damage with player level and wave
    const levelScaling = 1 + (player.level * 0.1); // 10% increase per player level
    const waveScaling = 1 + (currentWave * 0.2); // 20% increase per wave
    
    // Create enemy
    const enemy = {
      x,
      y,
      size: enemyType.size * sizeVariation,
      speed: enemyType.speed * speedVariation,
      color: enemyType.color,
      health: enemyType.health * healthVariation * levelScaling * waveScaling,
      damage: 10 + player.level + Math.floor(currentWave / 2),
      experienceValue: 10 + Math.floor(player.level * 2) + currentWave * 5,
      // Physics properties for collision
      velocityX: 0,
      velocityY: 0,
      mass: 5 + (enemyType.size / 10), // Mass based on size
      restitution: 0.7 + Math.random() * 0.3, // Random bounciness between 0.7-1.0
      // Add visual effect for hit feedback
      hitFlash: 0,
      // Add flag for chain reaction explosions
      markedForDeletion: false,
      // Add enemy type for reference
      type: type
    };
    
    enemies.push(enemy);
  }
  
  // Calculate how many enemies should be in a wave
  function getEnemyCountForWave(wave) {
    const baseCount = enemiesPerWave;
    const waveIndex = wave % waveDefinitions.length;
    const waveTypes = waveDefinitions[waveIndex].types;
    
    // Get average spawn count multiplier for this wave's enemy types
    let spawnCountMultiplier = 0;
    for (const type of waveTypes) {
      spawnCountMultiplier += enemyTypes[type].spawnCount;
    }
    spawnCountMultiplier /= waveTypes.length;
    
    // Scale with wave number (every full cycle of waves increases enemy count)
    const waveCycle = Math.floor(wave / waveDefinitions.length);
    const waveScaling = 1 + (waveCycle * 0.5); // 50% more enemies each full cycle
    
    return Math.floor(baseCount * spawnCountMultiplier * waveScaling);
  }
  
  // Shoot projectile
  function shootProjectile(charge = 1) {
    // Determine shooting direction
    let dirX = 0;
    let dirY = 0;
    
    if (shootingDirectionLocked) {
      // Use locked direction
      dirX = lockedShootingDirX;
      dirY = lockedShootingDirY;
    } else {
      // Use the current smoothly rotating direction
      dirX = currentRotationDirX;
      dirY = currentRotationDirY;
    }
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length === 0) {
      dirX = 0;
      dirY = 1; // Default to down
    } else {
      dirX /= length;
      dirY /= length;
    }
    
    // Get current weapon
    const weapon = weaponRegistry.get(player.currentWeaponId);
    if (!weapon) return;
    
    // Generate projectiles using the weapon service
    const generatedProjectiles = weaponService.generateProjectiles(
      weapon,
      player.x,
      player.y,
      dirX,
      dirY,
      charge
    );
    
    // Add generated projectiles to the game
    for (const projectile of generatedProjectiles) {
      projectiles.push({
        ...projectile,
        lifetime: projectile.lifetime / 1000, // Convert from ms to seconds
        type: weapon.id
      });
    }
    
    // Play sound effect if available
    if (weapon.shootSound) {
      // TODO: Play sound effect
      console.log(`Playing sound: ${weapon.shootSound}`);
    }
  }
  
  // Spawn experience gem
  function spawnExperienceGem(x: number, y: number, value: number) {
    const gem = {
      x,
      y,
      size: 8,
      color: '#ffff00',
      value,
      spawnTime: gameTime
    };
    
    experienceGems.push(gem);
  }
  
  // Draw UI
  function drawUI() {
    // Draw health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthBarX = 20;
    const healthBarY = height - 30;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Health
    const healthPercent = player.health / player.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Health text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.health)}/${player.maxHealth}`, healthBarX + healthBarWidth / 2, healthBarY + 15);
    
    // Draw experience bar
    const expBarWidth = 200;
    const expBarHeight = 10;
    const expBarX = 20;
    const expBarY = height - 50;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(expBarX, expBarY, expBarWidth, expBarHeight);
    
    // Experience
    const expPercent = player.experience / player.experienceToNextLevel;
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(expBarX, expBarY, expBarWidth * expPercent, expBarHeight);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(expBarX, expBarY, expBarWidth, expBarHeight);
    
    // Level text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${player.level}`, expBarX, expBarY - 5);
    
    // Draw dash cooldown
    const dashBarWidth = 100;
    const dashBarHeight = 10;
    const dashBarX = 20;
    const dashBarY = height - 70;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(dashBarX, dashBarY, dashBarWidth, dashBarHeight);
    
    // Dash cooldown
    const dashPercent = 1 - (player.dashCooldownRemaining / player.dashCooldown);
    ctx.fillStyle = dashPercent >= 1 ? '#ffaa00' : '#666666';
    ctx.fillRect(dashBarX, dashBarY, dashBarWidth * dashPercent, dashBarHeight);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(dashBarX, dashBarY, dashBarWidth, dashBarHeight);
    
    // Dash text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Dash', dashBarX, dashBarY - 5);
    
    // Draw weapon info
    const weapon = weaponRegistry.get(player.currentWeaponId);
    if (weapon) {
      const weaponInfoX = width - 220;
      const weaponInfoY = height - 70;
      
      // Weapon name
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(weapon.name, weaponInfoX, weaponInfoY);
      
      // Weapon description
      ctx.font = '12px Arial';
      ctx.fillText(weapon.description, weaponInfoX, weaponInfoY + 20);
      
      // Special ability cooldown
      if (weapon.specialAbility) {
        const abilityBarWidth = 100;
        const abilityBarHeight = 10;
        const abilityBarX = weaponInfoX;
        const abilityBarY = weaponInfoY + 30;
        
        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(abilityBarX, abilityBarY, abilityBarWidth, abilityBarHeight);
        
        // Ability cooldown
        const cooldownPercent = 1 - (player.specialAbilityCooldown / (weapon.specialAbilityCooldown || 5000));
        ctx.fillStyle = cooldownPercent >= 1 ? '#ffaa00' : '#666666';
        ctx.fillRect(abilityBarX, abilityBarY, abilityBarWidth * cooldownPercent, abilityBarHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(abilityBarX, abilityBarY, abilityBarWidth, abilityBarHeight);
        
        // Ability text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Special (Q)', abilityBarX, abilityBarY - 5);
      }
      
      // Draw charge meter for charge beam
      if (weapon.id === 'charge-beam') {
        const chargeBarWidth = 100;
        const chargeBarHeight = 10;
        const chargeBarX = weaponInfoX;
        const chargeBarY = weaponInfoY + 50;
        
        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(chargeBarX, chargeBarY, chargeBarWidth, chargeBarHeight);
        
        // Charge
        const chargePercent = player.weaponCharge / player.maxWeaponCharge;
        ctx.fillStyle = `rgb(${Math.floor(255 * chargePercent)}, ${Math.floor(100 * chargePercent)}, 0)`;
        ctx.fillRect(chargeBarX, chargeBarY, chargeBarWidth * chargePercent, chargeBarHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(chargeBarX, chargeBarY, chargeBarWidth, chargeBarHeight);
        
        // Charge text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Charge', chargeBarX, chargeBarY - 5);
      }
    }
    
    // Draw wave info
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Wave ${currentWave + 1}: ${waveDefinitions[currentWave % waveDefinitions.length].name}`, width / 2, 30);
    
    // Draw wave completion
    if (waveCompleted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, height / 2 - 50, width, 100);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Wave ${currentWave + 1} Completed!`, width / 2, height / 2 - 10);
      
      ctx.font = '18px Arial';
      ctx.fillText(`Next wave in ${(waveTransitionDuration - waveTransitionTimer).toFixed(1)}s`, width / 2, height / 2 + 20);
    }
    
    // Draw weapon selection info
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press 1-5 to switch weapons', width / 2, height - 10);
    
    // Draw the joystick
    drawJoystick();
  }
  
  // Input handlers
  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        keys.up = true;
        updateKeyboardShootingDirection();
        break;
      case 's':
      case 'arrowdown':
        keys.down = true;
        updateKeyboardShootingDirection();
        break;
      case 'a':
      case 'arrowleft':
        keys.left = true;
        updateKeyboardShootingDirection();
        break;
      case 'd':
      case 'arrowright':
        keys.right = true;
        updateKeyboardShootingDirection();
        break;
      case ' ':
        // Dash in the direction of movement
        if (player.dashCooldownRemaining <= 0 && !player.isDashing) {
          dash();
        }
        break;
      case '1':
        player.currentWeaponId = 'blaster';
        break;
      case '2':
        player.currentWeaponId = 'charge-beam';
        break;
      case '3':
        player.currentWeaponId = 'flamethrower';
        break;
      case '4':
        player.currentWeaponId = 'shotgun';
        break;
      case '5':
        player.currentWeaponId = 'bouncer';
        break;
      case 'q':
        // Use special ability
        useSpecialAbility();
        break;
    }
  }
  
  function handleKeyUp(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        keys.up = false;
        updateKeyboardShootingDirection();
        break;
      case 's':
      case 'arrowdown':
        keys.down = false;
        updateKeyboardShootingDirection();
        break;
      case 'a':
      case 'arrowleft':
        keys.left = false;
        updateKeyboardShootingDirection();
        break;
      case 'd':
      case 'arrowright':
        keys.right = false;
        updateKeyboardShootingDirection();
        break;
    }
  }
  
  function handleMouseMove(event: MouseEvent) {
    const prevX = mousePosition.x;
    const prevY = mousePosition.y;
    
    mousePosition.x = event.clientX;
    mousePosition.y = event.clientY;
    
    // Only lock shooting direction if mouse button is pressed
    if (event.buttons > 0 && !shootingDirectionLocked) {
      // Find closest enemy to lock onto
      let closestEnemy = null;
      let closestDistance = Infinity;
      
      for (const enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      }
      
      // Lock direction to closest enemy or last movement direction
      if (closestEnemy) {
        const dx = closestEnemy.x - player.x;
        const dy = closestEnemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        lockedShootingDirX = dx / distance;
        lockedShootingDirY = dy / distance;
      } else {
        lockedShootingDirX = player.lastMovementDirX || 0;
        lockedShootingDirY = player.lastMovementDirY || 1;
      }
      
      shootingDirectionLocked = true;
    } else if (event.buttons === 0) {
      // Unlock shooting direction when no mouse buttons are pressed
      shootingDirectionLocked = false;
    }
    
    isPointerActive = true; // Set pointer as active when mouse moves
    
    // Reset the pointer active state after a short delay if no movement
    resetPointerActiveTimeout();
  }
  
  function handleClick(event: MouseEvent) {
    // Manual shooting on click (in addition to auto-shooting)
    const centerX = width / 2;
    const centerY = height / 2;
    
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Create projectile
    const projectile = {
      x: player.x,
      y: player.y,
      size: 8, // Bigger than auto-projectiles
      speed: 400, // Faster than auto-projectiles
      dirX,
      dirY,
      color: '#00ffff',
      damage: 20 + player.level * 3, // More damage than auto-projectiles
      lifetime: 2 // Seconds
    };
    
    projectiles.push(projectile);
  }
  
  // Add movement dead zone variable
  let movementDeadZone = 20; // Radius in pixels for the movement dead zone
  let hasLeftDeadZone = false; // Flag to track if touch has left the dead zone
  
  function handleTouchStart(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      
      // Initialize joystick at touch position
      joystick.active = true;
      joystick.startX = touch.clientX;
      joystick.startY = touch.clientY;
      joystick.currentX = touch.clientX;
      joystick.currentY = touch.clientY;
      
      // Reset dead zone tracking
      hasLeftDeadZone = false;
      
      // Don't lock shooting direction immediately
      // We'll lock it when the touch leaves the dead zone
      
      // Set pointer as active
      isPointerActive = true;
      
      // Record start position and time for swipe detection
      touchStartPosition.x = touch.clientX;
      touchStartPosition.y = touch.clientY;
      lastTouchPosition.x = touch.clientX;
      lastTouchPosition.y = touch.clientY;
      touchStartTime = performance.now();
      
      // Reset the pointer active timeout
      resetPointerActiveTimeout();
    }
  }
  
  function handleTouchMove(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length > 0 && joystick.active) {
      const touch = event.touches[0];
      
      // Update joystick current position
      joystick.currentX = touch.clientX;
      joystick.currentY = touch.clientY;
      
      // Calculate joystick displacement
      let dx = joystick.currentX - joystick.startX;
      let dy = joystick.currentY - joystick.startY;
      
      // Calculate distance from start
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if touch has left the dead zone
      if (!hasLeftDeadZone && distance > movementDeadZone) {
        hasLeftDeadZone = true;
        
        // Now lock the shooting direction when touch first leaves the dead zone
        if (!shootingDirectionLocked) {
          // Calculate direction from initial touch to current position
          const dirX = dx / distance;
          const dirY = dy / distance;
          
          // Lock shooting direction to this vector
          lockedShootingDirX = dirX;
          lockedShootingDirY = dirY;
          shootingDirectionLocked = true;
        }
      }
      
      // Only update mouse position for movement if outside dead zone
      if (hasLeftDeadZone) {
        // Clamp to max radius
        if (distance > joystick.maxRadius) {
          dx = dx * (joystick.maxRadius / distance);
          dy = dy * (joystick.maxRadius / distance);
          joystick.currentX = joystick.startX + dx;
          joystick.currentY = joystick.startY + dy;
        }
        
        // Update mouse position for player movement
        mousePosition.x = width / 2 + dx;
        mousePosition.y = height / 2 + dy;
      } else {
        // Inside dead zone - don't move
        mousePosition.x = width / 2;
        mousePosition.y = height / 2;
      }
      
      // Update last touch position
      lastTouchPosition.x = touch.clientX;
      lastTouchPosition.y = touch.clientY;
      
      // Keep pointer active during touch movement
      isPointerActive = true;
      
      // Reset the pointer active timeout
      resetPointerActiveTimeout();
    }
  }
  
  function handleTouchEnd(event: TouchEvent) {
    event.preventDefault();
    
    // Reset joystick
    joystick.active = false;
    
    // Set pointer as inactive when touch ends
    isPointerActive = false;
    
    // Always unlock shooting direction when touch ends
    shootingDirectionLocked = false;
    
    // Check for swipe gesture
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const touchEndTime = performance.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // Calculate swipe distance and direction
      const dx = touch.clientX - touchStartPosition.x;
      const dy = touch.clientY - touchStartPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If it's a quick swipe with enough distance
      if (touchDuration < SWIPE_TIME_THRESHOLD && distance > SWIPE_THRESHOLD) {
        // Perform dash in any direction (removed vertical-only restriction)
        performDash(dx, dy);
      } else if (distance < 10) {
        // If it's a tap (very little movement), trigger a manual shot
        const centerX = width / 2;
        const centerY = height / 2;
        
        const shootDx = touch.clientX - centerX;
        const shootDy = touch.clientY - centerY;
        const shootDistance = Math.sqrt(shootDx * shootDx + shootDy * shootDy);
        
        // Only shoot if the touch is far enough from center
        if (shootDistance > 30) {
          // Normalize direction
          const dirX = shootDx / shootDistance;
          const dirY = shootDy / shootDistance;
          
          // Create projectile
          const projectile = {
            x: player.x,
            y: player.y,
            size: 8,
            speed: 400,
            dirX,
            dirY,
            color: '#00ffff',
            damage: 20 + player.level * 3,
            lifetime: 2
          };
          
          projectiles.push(projectile);
        }
      }
    }
  }
  
  // Function to cycle through available weapons
  function cycleWeapon(direction: number) {
    // Get all available weapons
    const weapons = weaponRegistry.getAll();
    if (weapons.length === 0) return;
    
    // Find current weapon index
    let currentIndex = weapons.findIndex(w => w.id === player.currentWeaponId);
    if (currentIndex === -1) currentIndex = 0;
    
    // Calculate new index with wrapping
    const newIndex = (currentIndex + direction + weapons.length) % weapons.length;
    
    // Set new weapon
    player.currentWeaponId = weapons[newIndex].id;
    
    // Update current weapon name for UI
    currentWeaponName = weapons[newIndex].name;
  }
  
  // Handle window resize
  function handleResize() {
    if (!browser || !canvas) return;
    
    width = window.innerWidth;
    height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    console.log("Window resized to", width, height);
  }
  
  // Toggle fullscreen
  function toggleFullscreen() {
    if (!browser) return;
    
    console.log("Fullscreen button clicked");
    
    try {
      if (!document.fullscreenElement) {
        console.log("Attempting to enter fullscreen mode");
        
        // Try the standard method first
        if (container.requestFullscreen) {
          container.requestFullscreen();
        } 
        // For Safari
        else if ((container as FullscreenElement).webkitRequestFullscreen) {
          (container as FullscreenElement).webkitRequestFullscreen();
        }
        // For Firefox
        else if ((container as FullscreenElement).mozRequestFullScreen) {
          (container as FullscreenElement).mozRequestFullScreen();
        }
        // For IE/Edge
        else if ((container as FullscreenElement).msRequestFullscreen) {
          (container as FullscreenElement).msRequestFullscreen();
        } else {
          console.error("Fullscreen API not supported");
        }
      } else {
        console.log("Attempting to exit fullscreen mode");
        
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        // For Safari
        else if ((document as FullscreenDocument).webkitExitFullscreen) {
          (document as FullscreenDocument).webkitExitFullscreen();
        }
        // For Firefox
        else if ((document as FullscreenDocument).mozCancelFullScreen) {
          (document as FullscreenDocument).mozCancelFullScreen();
        }
        // For IE/Edge
        else if ((document as FullscreenDocument).msExitFullscreen) {
          (document as FullscreenDocument).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  }
  
  // Perform a dash in the specified direction
  function performDash(dirX: number, dirY: number) {
    // Don't dash if on cooldown
    if (player.dashCooldownRemaining > 0) return;
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length === 0) return; // Don't dash if no direction
    
    player.dashDirection.x = dirX / length;
    player.dashDirection.y = dirY / length;
    player.isDashing = true;
    player.dashTimeRemaining = player.dashDuration;
    
    console.log(`Dashing in direction: ${player.dashDirection.x.toFixed(2)}, ${player.dashDirection.y.toFixed(2)}`);
  }
  
  // Add impact effect for projectile hits
  function addImpactEffect(x, y, dirX, dirY) {
    // Create particles at impact point
    for (let i = 0; i < 8; i++) { // INCREASED from 3 particles
      // Spread particles in a cone in the direction of impact
      const spreadAngle = Math.PI / 3; // INCREASED from PI/4 (60 degree cone instead of 45)
      const baseAngle = Math.atan2(dirY, dirX);
      const angle = baseAngle + (Math.random() * spreadAngle * 2 - spreadAngle);
      
      const speed = 150 + Math.random() * 100; // INCREASED from 80 + random * 40
      const lifetime = 0.3 + Math.random() * 0.3; // INCREASED from 0.2 + random * 0.2
      const size = 3 + Math.random() * 4; // INCREASED from 2 + random * 2
      
      particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size,
        color: '#88ffff', // Light cyan color
        lifetime,
        timeRemaining: lifetime
      });
    }
  }
  
  // Create explosion effect that pushes entities away
  function createExplosion(x, y, radius, force, depth = 0) {
    // Add recursion depth limit to prevent infinite chain reactions
    const MAX_EXPLOSION_DEPTH = 3;
    if (depth >= MAX_EXPLOSION_DEPTH) {
        return; // Stop recursion if we've reached the maximum depth
    }

    // MASSIVELY increase explosion radius and force for more noticeable effects
    radius = radius * 5; // Increased from 4x to 5x for wider area of effect
    force = force * 100;  // Increased from 50x to 100x for more dramatic physics

    // Visual effect - particles radiating in all directions
    const particleCount = Math.min(80, Math.floor(radius / 2)); // Increased from 60 for more visual impact
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 400 + Math.random() * 500; // Increased for more dramatic particle effects
        const lifetime = 1.0 + Math.random() * 1.0; // Longer particle lifetime
        const size = 8 + Math.random() * 10; // Larger particles
        
        // Add screen shake effect for explosions
        if (i === 0) {
            screenShake = 1.0; // Increased from 0.8 for more dramatic effect
        }
        
        particles.push({
            x,
            y,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            size,
            color: `hsl(${Math.random() * 30 + 20}, 100%, 60%)`, // Orange-red colors
            lifetime,
            timeRemaining: lifetime
        });
    }
    
    // Apply force to nearby entities
    
    // Affect player if in range
    const playerDx = player.x - x;
    const playerDy = player.y - y;
    const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
    
    if (playerDistance < radius) {
        // Calculate normalized direction away from explosion
        const dirX = playerDx / playerDistance;
        const dirY = playerDy / playerDistance;
        
        // Force decreases with distance (inverse square for more realistic falloff)
        const distanceFactor = Math.pow(1 - (playerDistance / radius), 2);
        const appliedForce = force * distanceFactor;
        
        // Apply impulse to player if not dashing
        if (!player.isDashing) {
            player.velocityX += dirX * appliedForce / player.mass;
            player.velocityY += dirY * appliedForce / player.mass;
        }
    }
    
    // Affect other enemies
    let enemiesAffected = 0;
    for (const enemy of enemies) {
        const enemyDx = enemy.x - x;
        const enemyDy = enemy.y - y;
        const enemyDistance = Math.sqrt(enemyDx * enemyDx + enemyDy * enemyDy);
        
        if (enemyDistance < radius && enemyDistance > 0) {
            enemiesAffected++;
            // Calculate normalized direction away from explosion
            const dirX = enemyDx / enemyDistance;
            const dirY = enemyDy / enemyDistance;
            
            // Force decreases with distance (inverse square for more realistic falloff)
            const distanceFactor = Math.pow(1 - (enemyDistance / radius), 2);
            const appliedForce = force * distanceFactor;
            
            // Apply MUCH stronger impulse to enemy - multiplied by 5 for more dramatic effect
            enemy.velocityX += dirX * appliedForce * 5 / enemy.mass; // Increased from 3x to 5x
            enemy.velocityY += dirY * appliedForce * 5 / enemy.mass; // Increased from 3x to 5x
            
            // Add visual feedback - enemies hit by explosion flash
            enemy.hitFlash = Math.max(enemy.hitFlash, 1.0); // Full flash effect
            
            // REDUCED damage from explosions - now scales less with force
            const explosionDamage = 3 + Math.floor(force / 300) * (1 - enemyDistance/radius); // Reduced from 5 + force/100
            if (explosionDamage > 0) {
                enemy.health -= explosionDamage;
                
                // Remove enemy if health <= 0 (chain reaction!)
                if (enemy.health <= 0) {
                    // Create smaller explosion effect (chain reaction) with increased depth
                    createExplosion(enemy.x, enemy.y, enemy.size * 2, enemy.mass * 5, depth + 1);
                    
                    // Spawn experience gem
                    spawnExperienceGem(enemy.x, enemy.y, enemy.experienceValue);
                    
                    // Remove enemy - but don't do it here to avoid modifying array during iteration
                    enemy.markedForDeletion = true;
                }
            }
        }
    }
    
    // Remove enemies marked for deletion (from chain reactions)
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].markedForDeletion) {
            enemies.splice(i, 1);
        }
    }
    
    // Debug info
    if (debug && enemiesAffected > 0) {
        console.log(`Explosion affected ${enemiesAffected} enemies with force ${force} (depth: ${depth}/${MAX_EXPLOSION_DEPTH})`);
    }
    
    // Affect projectiles
    for (const projectile of projectiles) {
        const projectileDx = projectile.x - x;
        const projectileDy = projectile.y - y;
        const projectileDistance = Math.sqrt(projectileDx * projectileDx + projectileDy * projectileDy);
        
        if (projectileDistance < radius && projectileDistance > 0) {
            // Calculate normalized direction away from explosion
            const dirX = projectileDx / projectileDistance;
            const dirY = projectileDy / projectileDistance;
            
            // Force decreases with distance
            const distanceFactor = Math.pow(1 - (projectileDistance / radius), 2);
            const appliedForce = force * distanceFactor * 1.2; // Increased from 0.8 for more dramatic effect
            
            // Adjust projectile direction
            const currentSpeed = Math.sqrt(
                projectile.dirX * projectile.dirX + 
                projectile.dirY * projectile.dirY
            ) * projectile.speed;
            
            // Add explosion force to direction
            projectile.dirX += dirX * appliedForce / 50; // Increased from 100 for more dramatic effect
            projectile.dirY += dirY * appliedForce / 50; // Increased from 100 for more dramatic effect
            
            // Renormalize direction
            const newMagnitude = Math.sqrt(
                projectile.dirX * projectile.dirX + 
                projectile.dirY * projectile.dirY
            );
            
            projectile.dirX /= newMagnitude;
            projectile.dirY /= newMagnitude;
        }
    }
    
    // Affect experience gems
    for (const gem of experienceGems) {
        const gemDx = gem.x - x;
        const gemDy = gem.y - y;
        const gemDistance = Math.sqrt(gemDx * gemDx + gemDy * gemDy);
        
        if (gemDistance < radius && gemDistance > 0) {
            // Calculate normalized direction away from explosion
            const dirX = gemDx / gemDistance;
            const dirY = gemDy / gemDistance;
            
            // Force decreases with distance
            const distanceFactor = Math.pow(1 - (gemDistance / radius), 2);
            const appliedForce = force * distanceFactor * 12; // Increased from 8 for more dramatic effect
            
            // Move gem away from explosion
            gem.x += dirX * appliedForce * 0.3; // Increased from 0.2 for more dramatic effect
            gem.y += dirY * appliedForce * 0.3; // Increased from 0.2 for more dramatic effect
        }
    }
  }
  
  // Helper function to update shooting direction based on keyboard input
  function updateKeyboardShootingDirection() {
    if (!autoMove) {
      let dx = 0;
      let dy = 0;
      
      if (keys.up) dy -= 1;
      if (keys.down) dy += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;
      
      // Only update if there's actual input
      if (dx !== 0 || dy !== 0) {
        // Normalize direction
        const length = Math.sqrt(dx * dx + dy * dy);
        lockedShootingDirX = dx / length;
        lockedShootingDirY = dy / length;
        shootingDirectionLocked = true;
        
        // Update player's last movement direction too
        player.lastMovementDirX = dx / length;
        player.lastMovementDirY = dy / length;
      } else {
        // If no keys are pressed, unlock the direction
        // ONLY if we're using keyboard controls and no touch is active
        if (!isPointerActive) {
          shootingDirectionLocked = false;
        }
      }
    }
  }
  
  // Draw shooting direction arrow
  function drawShootingDirectionArrow() {
    // Get the current shooting direction
    let dirX = 0;
    let dirY = 0;
    let targetDirX = 0;
    let targetDirY = 0;
    
    if (shootingDirectionLocked) {
      // Use locked direction
      dirX = lockedShootingDirX;
      dirY = lockedShootingDirY;
      
      // Update current rotation to match locked direction immediately
      currentRotationDirX = lockedShootingDirX;
      currentRotationDirY = lockedShootingDirY;
    } else {
      // Find closest enemy for auto-targeting
      let closestEnemy = null;
      let closestDistance = Infinity;
      
      for (const enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      }
      
      if (closestEnemy) {
        // Direction to closest enemy
        const dx = closestEnemy.x - player.x;
        const dy = closestEnemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        targetDirX = dx / distance;
        targetDirY = dy / distance;
      } else {
        // Default direction if no enemies
        targetDirX = player.lastMovementDirX || 0;
        targetDirY = player.lastMovementDirY || 1;
      }
      
      // Smoothly rotate current direction toward target direction
      const deltaTime = 1/60; // Assume 60fps for smooth rotation
      
      // Calculate angle between current and target direction
      const currentAngle = Math.atan2(currentRotationDirY, currentRotationDirX);
      const targetAngle = Math.atan2(targetDirY, targetDirX);
      
      // Find the shortest path to rotate (clockwise or counterclockwise)
      let angleDiff = targetAngle - currentAngle;
      
      // Normalize angle difference to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // Calculate rotation step based on rotation speed
      const rotationStep = rotationSpeed * deltaTime;
      
      // Apply rotation step (clamped to the remaining angle difference)
      const rotationAmount = Math.abs(angleDiff) < rotationStep ? angleDiff : Math.sign(angleDiff) * rotationStep;
      const newAngle = currentAngle + rotationAmount;
      
      // Update current rotation direction
      currentRotationDirX = Math.cos(newAngle);
      currentRotationDirY = Math.sin(newAngle);
      
      // Use the smoothly rotated direction
      dirX = currentRotationDirX;
      dirY = currentRotationDirY;
    }
    
    // Calculate arrow points
    // No camera pan applied to arrow position
    const startX = width / 2;
    const startY = height / 2;
    const endX = startX + dirX * arrowLength;
    const endY = startY + dirY * arrowLength;
    
    // Calculate perpendicular vector for arrow head
    const perpX = -dirY;
    const perpY = dirX;
    
    // Calculate arrow head points
    const headSize = arrowWidth;
    const arrowHead1X = endX - dirX * headSize + perpX * headSize;
    const arrowHead1Y = endY - dirY * headSize + perpY * headSize;
    const arrowHead2X = endX - dirX * headSize - perpX * headSize;
    const arrowHead2Y = endY - dirY * headSize - perpY * headSize;
    
    // Draw arrow shaft
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrow head
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(arrowHead1X, arrowHead1Y);
    ctx.lineTo(arrowHead2X, arrowHead2Y);
    ctx.closePath();
    ctx.fill();
    
    // Draw reticle when shooting direction is locked
    if (shootingDirectionLocked) {
      const reticleRadius = 30;
      const reticleX = startX + dirX * (arrowLength + 20);
      const reticleY = startY + dirY * (arrowLength + 20);
      
      // Draw outer circle
      ctx.strokeStyle = '#ff9900';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(reticleX, reticleY, reticleRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(reticleX - reticleRadius, reticleY);
      ctx.lineTo(reticleX + reticleRadius, reticleY);
      ctx.moveTo(reticleX, reticleY - reticleRadius);
      ctx.lineTo(reticleX, reticleY + reticleRadius);
      ctx.stroke();
      
      // Draw small inner circle
      ctx.beginPath();
      ctx.arc(reticleX, reticleY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw target direction in debug mode
    if (debug && !shootingDirectionLocked) {
      const targetEndX = startX + targetDirX * (arrowLength + 10);
      const targetEndY = startY + targetDirY * (arrowLength + 10);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(targetEndX, targetEndY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  
  // Add function to update camera panning
  function updateCameraPan(deltaTime: number) {
    // Disable camera panning by always setting to 0
    cameraPanX = 0;
    cameraPanY = 0;
    
    // Add debug info for camera panning if debug mode is enabled
    if (debug) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Camera Panning: Disabled', 20, 370);
    }
  }
  
  // Lifecycle hooks
  onMount(() => {
    if (!browser) return;
    
    console.log("Component mounted");
    
    // Initialize game
    initGame();
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Add orientation change listener for mobile
    window.addEventListener('orientationchange', handleResize);
    
    // Add fullscreen change listener
    document.addEventListener('fullscreenchange', () => {
      console.log("Fullscreen state changed:", !!document.fullscreenElement);
    });
    
    // Add mouseleave event listener to detect when mouse leaves the canvas
    if (canvas) {
      canvas.addEventListener('mouseleave', () => {
        isPointerActive = false;
      });
    }
  });
  
  onDestroy(() => {
    if (!browser) return;
    
    console.log("Component being destroyed");
    
    // Cancel animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // Remove event listeners
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    
    if (canvas) {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    }
    
    document.removeEventListener('fullscreenchange', () => {});
  });
  
  function drawDebugInfo() {
    if (!debug) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // Player info
    ctx.fillText(`Position: X=${player.x.toFixed(1)}, Y=${player.y.toFixed(1)}`, 20, 30);
    ctx.fillText(`Velocity: X=${player.velocityX.toFixed(1)}, Y=${player.velocityY.toFixed(1)}`, 20, 50);
    ctx.fillText(`Level: ${player.level} (${player.experience}/${player.experienceToNextLevel} XP)`, 20, 70);
    ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 20, 90);
    
    if (player.dashCooldownRemaining > 0) {
      ctx.fillText(`Dash: ${player.dashCooldownRemaining.toFixed(1)}s`, 20, 110);
    } else {
      ctx.fillText("Dash: Ready", 20, 110);
    }
    
    // Wave info
    ctx.fillText(`Wave: ${currentWave + 1} - ${waveDefinitions[currentWave % waveDefinitions.length].name}`, 20, 130);
    ctx.fillText(`Enemies: ${enemies.length}/${getEnemyCountForWave(currentWave)}`, 20, 150);
    if (waveCompleted) {
      ctx.fillText(`Next wave in: ${(waveTransitionDuration - waveTransitionTimer).toFixed(1)}s`, 20, 170);
    } else {
      ctx.fillText(`Wave progress: ${Math.min(100, (enemiesSpawnedInCurrentWave / getEnemyCountForWave(currentWave) * 100)).toFixed(0)}%`, 20, 170);
    }
    
    // Enemy type counts
    const typeCounts = {};
    for (const enemy of enemies) {
      // Fix hasOwnProperty usage
      if (Object.prototype.hasOwnProperty.call(typeCounts, enemy.type)) {
        typeCounts[enemy.type]++;
      } else {
        typeCounts[enemy.type] = 1;
      }
    }
    
    let y = 190;
    ctx.fillText("Enemy Types:", 20, y);
    y += 20;
    
    for (const type in typeCounts) {
      if (Object.prototype.hasOwnProperty.call(typeCounts, type)) {
        const enemyType = enemyTypes[type];
        ctx.fillStyle = enemyType.color;
        ctx.fillText(`${type}: ${typeCounts[type]} (Speed: ${enemyType.speed}, Health: ${enemyType.health})`, 20, y);
        y += 20;
      }
    }
    
    // Reset text color
    ctx.fillStyle = '#ffffff';
    
    // Draw screen shake indicator if in debug mode
    // ... existing code ...
  }
  
  // Add weapon types
  const weaponTypes = {
    blaster: {
      name: 'Blaster',
      color: '#00ffff',
      projectileSize: 5,
      projectileSpeed: 300,
      damage: 10,
      fireRate: 1.0, // Shots per second
      lockedFireRate: 0.66, // Faster when locked
      description: 'Standard rapid-fire blaster'
    },
    chargeBeam: {
      name: 'Charge Beam',
      color: '#ff00ff',
      projectileSize: 3,
      projectileSpeed: 500,
      baseDamage: 5,
      maxDamage: 50,
      chargeRate: 1.0, // How fast it charges (multiplier)
      description: 'Hold to charge, release for powerful beam'
    },
    flamethrower: {
      name: 'Flamethrower',
      color: '#ff5500',
      projectileSize: 4,
      projectileSpeed: 250,
      damage: 3,
      fireRate: 0.1, // Very fast fire rate
      lockedFireRate: 0.1, // Same when locked
      range: 300, // Shorter range
      spreadAngle: 20, // Degrees of spread
      description: 'Short range, wide spread, creates oil spills'
    }
  };
  
  // Track current weapon name for UI
  let currentWeaponName = '';
  
  // Update current weapon name when component mounts
  $: {
    const weapon = weaponRegistry.get(player.currentWeaponId);
    if (weapon) {
      currentWeaponName = weapon.name;
    }
  }
  
  // Use special ability
  function useSpecialAbility() {
    const weapon = weaponRegistry.get(player.currentWeaponId);
    if (!weapon || !weapon.specialAbility) return;
    
    // Determine direction
    let dirX = 0;
    let dirY = 0;
    
    if (shootingDirectionLocked) {
      dirX = lockedShootingDirX;
      dirY = lockedShootingDirY;
    } else {
      dirX = currentRotationDirX;
      dirY = currentRotationDirY;
    }
    
    // Execute special ability
    const result = weaponService.executeSpecialAbility(
      weapon,
      player.x,
      player.y,
      dirX,
      dirY,
      player.specialAbilityCooldown
    );
    
    if (result.success) {
      // Set cooldown
      player.specialAbilityCooldown = result.cooldown;
      
      // Handle effect
      if (result.effect) {
        handleSpecialAbilityEffect(result.effect);
      }
    } else if (result.message) {
      console.log(result.message);
    }
  }
  
  // Handle special ability effect
  function handleSpecialAbilityEffect(effect: Record<string, unknown>) {
    switch (effect.type) {
      case 'oilSpill':
        // Create oil spill
        player.oilSpills.push({
          x: effect.x as number,
          y: effect.y as number,
          size: effect.radius as number,
          duration: (effect.duration as number) / 1000, // Convert to seconds
          damage: effect.damage as number,
          color: 'rgba(50, 20, 0, 0.7)',
          lifetime: (effect.duration as number) / 1000, // Convert to seconds
          slowFactor: effect.slowFactor as number
        });
        break;
        
      case 'teleport':
        // Teleport player
        player.x = effect.targetX;
        player.y = effect.targetY;
        
        // Add visual effect
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 100 + Math.random() * 200;
          addParticle(
            player.x,
            player.y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#00ffff',
            0.5 + Math.random() * 0.5
          );
        }
        break;
        
      case 'explosion':
        // Damage enemies in radius
        for (const enemy of enemies) {
          const dx = enemy.x - (effect.x as number);
          const dy = enemy.y - (effect.y as number);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= (effect.radius as number)) {
            // Calculate damage falloff based on distance
            const damageMultiplier = 1 - (distance / (effect.radius as number));
            enemy.health -= (effect.damage as number) * damageMultiplier;
            
            // Apply knockback
            const knockbackForce = 1000 * damageMultiplier;
            const dirX = dx / distance;
            const dirY = dy / distance;
            enemy.velocityX += dirX * knockbackForce / enemy.mass;
            enemy.velocityY += dirY * knockbackForce / enemy.mass;
            
            // Add hit flash
            enemy.hitFlash = 0.3;
          }
        }
        
        // Add visual effect
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * (effect.radius as number);
          const x = (effect.x as number) + Math.cos(angle) * distance;
          const y = (effect.y as number) + Math.sin(angle) * distance;
          
          addParticle(
            x,
            y,
            Math.cos(angle) * 200,
            Math.sin(angle) * 200,
            '#ff5500',
            0.5 + Math.random() * 0.5
          );
        }
        
        // Add screen shake
        screenShake = 0.5;
        break;
        
      case 'shield':
        // Add shield
        player.shields.push({
          duration: (effect.duration as number) / 1000, // Convert to seconds
          strength: effect.strength as number,
          lifetime: (effect.duration as number) / 1000 // Convert to seconds
        });
        break;
        
      // Add more effect handlers as needed
    }
  }

  // Add these interface definitions at the top of the script section
  interface FullscreenElement extends HTMLElement {
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }

  interface FullscreenDocument extends Document {
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  }

  // Add special bounce effect for bouncer projectiles
  function addBouncerEffect(x, y, dirX, dirY) {
    // Create a more dramatic effect for bouncer projectiles
    
    // First, add a flash effect
    effects.push({
      type: 'flash',
      x,
      y,
      radius: 15,
      color: { r: 0, g: 255, b: 136 },
      lifetime: 0.3,
      timeRemaining: 0.3
    });
    
    // Then add particles in a circular pattern
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      
      // Add some randomness to the angle
      const randomAngle = angle + (Math.random() * 0.2 - 0.1);
      
      const speed = 200 + Math.random() * 150;
      const lifetime = 0.4 + Math.random() * 0.3;
      const size = 4 + Math.random() * 5;
      
      particles.push({
        x,
        y,
        velocityX: Math.cos(randomAngle) * speed,
        velocityY: Math.sin(randomAngle) * speed,
        size,
        color: '#00ff88', // Match bouncer color
        lifetime,
        timeRemaining: lifetime
      });
    }
  }

  // Handle bouncing projectiles toward nearest enemy
  function handleProjectileBounce(projectile) {
    // Only handle if projectile has bounces left and is of type 'bouncer'
    if (projectile.bounces <= 0 || projectile.type !== 'bouncer') {
      return false;
    }
    
    // Find the nearest enemy
    let nearestEnemy = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    
    for (const enemy of enemies) {
      const dx = enemy.x - projectile.x;
      const dy = enemy.y - projectile.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Skip if too far away (outside homing range)
      if (projectile.homingRange && distance > projectile.homingRange) {
        continue;
      }
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    // If we found a nearby enemy, bounce toward it
    if (nearestEnemy) {
      // Calculate direction to enemy
      const dx = nearestEnemy.x - projectile.x;
      const dy = nearestEnemy.y - projectile.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize direction
      const dirX = dx / distance;
      const dirY = dy / distance;
      
      // Add some randomness to the bounce (controlled by homingStrength)
      const homingStrength = projectile.homingStrength || 0.8;
      const randomFactor = 1 - homingStrength;
      
      // Mix current direction with direction to enemy based on homing strength
      projectile.dirX = projectile.dirX * randomFactor + dirX * homingStrength;
      projectile.dirY = projectile.dirY * randomFactor + dirY * homingStrength;
      
      // Normalize the resulting direction
      const newDirMagnitude = Math.sqrt(projectile.dirX * projectile.dirX + projectile.dirY * projectile.dirY);
      projectile.dirX /= newDirMagnitude;
      projectile.dirY /= newDirMagnitude;
      
      // Reduce bounce count
      projectile.bounces--;
      
      // Add bounce effect
      addBouncerEffect(projectile.x, projectile.y, projectile.dirX, projectile.dirY);
      
      return true;
    }
    
    return false;
  }

  // Function to draw the joystick and dead zone
  function drawJoystick() {
    if (joystick.active) {
      // Draw the base circle (background)
      ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
      ctx.beginPath();
      ctx.arc(joystick.startX, joystick.startY, joystick.maxRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw the dead zone circle
      ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(joystick.startX, joystick.startY, movementDeadZone, 0, Math.PI * 2);
      ctx.stroke();
      
      // Draw the joystick handle
      ctx.fillStyle = hasLeftDeadZone ? `rgba(0, 255, 255, 0.8)` : `rgba(255, 255, 255, 0.8)`;
      ctx.beginPath();
      ctx.arc(joystick.currentX, joystick.currentY, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw a line from start to current position
      ctx.strokeStyle = hasLeftDeadZone ? `rgba(0, 255, 255, 0.6)` : `rgba(255, 255, 255, 0.6)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(joystick.startX, joystick.startY);
      ctx.lineTo(joystick.currentX, joystick.currentY);
      ctx.stroke();
    }
  }
</script>

<div class="game-container" bind:this={container}>
  <!-- Canvas will be added here by JavaScript -->
  
  <!-- Fullscreen button -->
  <button class="fullscreen-btn" on:click={toggleFullscreen}>
    Fullscreen
  </button>
  
  <!-- Toggle controls button -->
  <button class="controls-btn" on:click={() => autoMove = !autoMove}>
    {autoMove ? 'Switch to Manual' : 'Switch to Auto'}
  </button>

  <!-- Weapon toggle button -->
  <button class="weapon-btn" on:click={() => cycleWeapon(1)}>
    {currentWeaponName || 'Next Weapon'}
  </button>
</div>

<style>
  .game-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background-color: #000;
    touch-action: none;
  }
  
  .fullscreen-btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    z-index: 10;
  }
  
  .controls-btn {
    position: absolute;
    bottom: 20px;
    left: 20px;
    padding: 10px 15px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    z-index: 10;
  }
  
  .weapon-btn {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 15px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    z-index: 10;
  }
  
  .fullscreen-btn:hover, .controls-btn:hover, .weapon-btn:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
</style> 