<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

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
  let player = {
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
    // Add dash properties
    dashSpeed: 800,
    dashDuration: 0.2, // seconds
    dashCooldown: 1.0, // seconds
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
    trail: []
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
  
  // Projectiles
  let projectiles = [];
  let projectileTimer = 0;
  let projectileInterval = 0.5; // Seconds
  
  // Experience gems
  let experienceGems = [];
  
  // Touch gesture tracking
  let touchStartPosition = { x: 0, y: 0 };
  let touchStartTime = 0;
  let lastTouchPosition = { x: 0, y: 0 };
  const SWIPE_THRESHOLD = 80; // pixels
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
    }, 100) as unknown as number;
  }
  
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
    
    // Spawn enemies
    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer >= enemySpawnInterval) {
      spawnEnemy();
      enemySpawnTimer = 0;
    }
    
    // Auto-shoot projectiles
    projectileTimer += deltaTime;
    if (projectileTimer >= projectileInterval) {
      shootProjectile();
      projectileTimer = 0;
    }
    
    // Draw UI
    drawUI();
    
    // Request next frame
    animationFrameId = requestAnimationFrame(gameLoop);
  }
  
  // Draw grid
  function drawGrid() {
    const gridSize = 50;
    const offsetX = player.x % gridSize;
    const offsetY = player.y % gridSize;
    
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
    const originX = width / 2 - player.x % gridSize;
    const originY = height / 2 - player.y % gridSize;
    
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
    // Handle dash cooldown
    if (player.dashCooldownRemaining > 0) {
      player.dashCooldownRemaining -= deltaTime;
    }
    
    // Add trail point if dashing
    if (player.isDashing) {
      // Add current position to trail
      player.trail.push({
        x: player.x,
        y: player.y,
        size: player.size * 0.8,
        alpha: 1.0,
        age: 0
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
      
      // Draw trail point
      const screenX = width / 2 + (trailPoint.x - player.x);
      const screenY = height / 2 + (trailPoint.y - player.y);
      
      ctx.fillStyle = `rgba(0, 255, 255, ${trailPoint.alpha})`;
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
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, player.size, 0, Math.PI * 2);
    ctx.fill();
    
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
    const healthBarWidth = player.size * 2;
    const healthBarHeight = 5;
    const healthPercentage = player.health / player.maxHealth;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(width / 2 - healthBarWidth / 2, height / 2 - player.size - 10, healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(width / 2 - healthBarWidth / 2, height / 2 - player.size - 10, healthBarWidth * healthPercentage, healthBarHeight);
  }
  
  // Update enemies
  function updateEnemies(deltaTime: number) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      
      // Move enemy towards player
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize direction
      const dirX = dx / distance;
      const dirY = dy / distance;
      
      // Move enemy
      enemy.x += dirX * enemy.speed * deltaTime;
      enemy.y += dirY * enemy.speed * deltaTime;
      
      // Calculate screen position
      const screenX = width / 2 + (enemy.x - player.x);
      const screenY = height / 2 + (enemy.y - player.y);
      
      // Check if enemy is on screen
      if (screenX > -enemy.size && screenX < width + enemy.size &&
          screenY > -enemy.size && screenY < height + enemy.size) {
        
        // Draw enemy
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Check collision with player
        const playerDistance = Math.sqrt(
          Math.pow(screenX - width / 2, 2) + 
          Math.pow(screenY - height / 2, 2)
        );
        
        if (playerDistance < player.size + enemy.size) {
          // Damage player
          player.health -= enemy.damage * deltaTime;
          
          // Game over if health <= 0
          if (player.health <= 0) {
            player.health = 0;
            console.log("Game Over!");
            // Implement game over logic here
          }
        }
      }
      
      // Remove enemies that are too far away
      if (distance > 1000) {
        enemies.splice(i, 1);
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
      
      // Calculate screen position
      const screenX = width / 2 + (projectile.x - player.x);
      const screenY = height / 2 + (projectile.y - player.y);
      
      // Check if projectile is on screen
      if (screenX > -projectile.size && screenX < width + projectile.size &&
          screenY > -projectile.size && screenY < height + projectile.size) {
        
        // Draw projectile
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, projectile.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Check collision with enemies
        let hitEnemy = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          const enemyScreenX = width / 2 + (enemy.x - player.x);
          const enemyScreenY = height / 2 + (enemy.y - player.y);
          
          const distance = Math.sqrt(
            Math.pow(screenX - enemyScreenX, 2) + 
            Math.pow(screenY - enemyScreenY, 2)
          );
          
          if (distance < projectile.size + enemy.size) {
            // Damage enemy
            enemy.health -= projectile.damage;
            
            // Remove enemy if health <= 0
            if (enemy.health <= 0) {
              // Spawn experience gem
              spawnExperienceGem(enemy.x, enemy.y, enemy.experienceValue);
              
              // Remove enemy
              enemies.splice(j, 1);
            }
            
            hitEnemy = true;
            break;
          }
        }
        
        // Remove projectile if it hit an enemy
        if (hitEnemy) {
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
      
      // Calculate screen position
      const screenX = width / 2 + (gem.x - player.x);
      const screenY = height / 2 + (gem.y - player.y);
      
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
            projectileInterval = Math.max(0.1, projectileInterval * 0.9);
            
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
    // Spawn enemy outside the screen
    const angle = Math.random() * Math.PI * 2;
    const distance = 400 + Math.random() * 100; // Spawn just outside the visible area
    
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    
    // Create enemy
    const enemy = {
      x,
      y,
      size: 15 + Math.random() * 10,
      speed: 50 + Math.random() * 30,
      color: '#ff0000',
      health: 30 + player.level * 5,
      damage: 10 + player.level,
      experienceValue: 10 + Math.floor(player.level * 2)
    };
    
    enemies.push(enemy);
  }
  
  // Shoot projectile
  function shootProjectile() {
    // Find closest enemy
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
    
    // If no enemies, shoot in random direction
    let dirX = Math.random() * 2 - 1;
    let dirY = Math.random() * 2 - 1;
    
    // Normalize direction
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    dirX /= length;
    dirY /= length;
    
    // If there's a closest enemy, shoot towards it
    if (closestEnemy) {
      const dx = closestEnemy.x - player.x;
      const dy = closestEnemy.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      dirX = dx / distance;
      dirY = dy / distance;
    }
    
    // Create projectile
    const projectile = {
      x: player.x,
      y: player.y,
      size: 5,
      speed: 300,
      dirX,
      dirY,
      color: '#00ffff',
      damage: 10 + player.level * 2,
      lifetime: 2 // Seconds
    };
    
    projectiles.push(projectile);
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
    // Draw experience bar
    const expBarWidth = width - 40;
    const expBarHeight = 10;
    const expPercentage = player.experience / player.experienceToNextLevel;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 20, expBarWidth, expBarHeight);
    
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(20, 20, expBarWidth * expPercentage, expBarHeight);
    
    // Draw level
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${player.level}`, 20, 50);
    
    // Draw time
    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 70);
    
    // Draw enemy count
    ctx.fillText(`Enemies: ${enemies.length}`, 20, 90);
    
    // Draw dash status
    if (player.dashCooldownRemaining > 0) {
      ctx.fillText(`Dash: ${player.dashCooldownRemaining.toFixed(1)}s`, 20, 110);
    } else {
      ctx.fillText(`Dash: Ready`, 20, 110);
    }
    
    // Draw joystick status if in debug mode
    if (debug) {
      ctx.fillText(`Joystick: ${joystick.active ? 'Active' : 'Inactive'}`, 20, 130);
      if (joystick.active) {
        const dx = joystick.currentX - joystick.startX;
        const dy = joystick.currentY - joystick.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        ctx.fillText(`Joystick distance: ${distance.toFixed(1)}`, 20, 150);
      }
    }
    
    // Draw pointer active status if in debug mode
    if (debug) {
      ctx.fillText(`Pointer active: ${isPointerActive ? 'Yes' : 'No'}`, 20, 170);
    }
    
    // Draw controls info
    ctx.textAlign = 'right';
    ctx.fillText(`Controls: ${autoMove ? 'Joystick (touch)' : 'Manual (WASD)'}`, width - 20, 50);
    ctx.fillText(`Press 'C' to toggle control mode`, width - 20, 70);
    ctx.fillText(`Press 'F' for fullscreen`, width - 20, 90);
    ctx.fillText(`Swipe or Space to dash`, width - 20, 110);
    
    // Draw friction info
    if (debug) {
      ctx.textAlign = 'left';
      ctx.fillText(`Friction: ${player.friction.toFixed(2)}`, 20, 190);
    }
  }
  
  // Input handlers
  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        keys.up = true;
        break;
      case 's':
      case 'arrowdown':
        keys.down = true;
        break;
      case 'a':
      case 'arrowleft':
        keys.left = true;
        break;
      case 'd':
      case 'arrowright':
        keys.right = true;
        break;
      case 'c':
        // Toggle control mode
        autoMove = !autoMove;
        console.log(`Control mode: ${autoMove ? 'Auto' : 'Manual'}`);
        break;
      case 'f':
        // Toggle fullscreen
        toggleFullscreen();
        break;
      case ' ':
        // Space bar dash in movement direction
        let dashX = 0;
        let dashY = 0;
        
        if (autoMove) {
          // Use direction to mouse
          const centerX = width / 2;
          const centerY = height / 2;
          dashX = mousePosition.x - centerX;
          dashY = mousePosition.y - centerY;
        } else {
          // Use keyboard direction
          if (keys.up) dashY -= 1;
          if (keys.down) dashY += 1;
          if (keys.left) dashX -= 1;
          if (keys.right) dashX += 1;
        }
        
        performDash(dashX, dashY);
        break;
    }
  }
  
  function handleKeyUp(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        keys.up = false;
        break;
      case 's':
      case 'arrowdown':
        keys.down = false;
        break;
      case 'a':
      case 'arrowleft':
        keys.left = false;
        break;
      case 'd':
      case 'arrowright':
        keys.right = false;
        break;
    }
  }
  
  function handleMouseMove(event: MouseEvent) {
    mousePosition.x = event.clientX;
    mousePosition.y = event.clientY;
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
    
    // Check for swipe gesture
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const touchEndTime = performance.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // Calculate swipe distance and direction
      const dx = touch.clientX - touchStartPosition.x;
      const dy = touch.clientY - touchStartPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If it's a quick swipe with enough distance, perform a dash
      if (touchDuration < SWIPE_TIME_THRESHOLD && distance > SWIPE_THRESHOLD) {
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
        else if ((container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        }
        // For Firefox
        else if ((container as any).mozRequestFullScreen) {
          (container as any).mozRequestFullScreen();
        }
        // For IE/Edge
        else if ((container as any).msRequestFullscreen) {
          (container as any).msRequestFullscreen();
        } else {
          console.error("Fullscreen API not supported");
        }
      } else {
        console.log("Attempting to exit fullscreen mode");
        
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        // For Safari
        else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        // For Firefox
        else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        }
        // For IE/Edge
        else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
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
  
  .fullscreen-btn:hover, .controls-btn:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
</style> 