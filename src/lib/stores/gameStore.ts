import { writable } from 'svelte/store';

export interface GameState {
  playerHealth: number;
  maxPlayerHealth: number;
  score: number;
  level: number;
  gameOver: boolean;
  paused: boolean;
  victory: boolean;
}

const initialState: GameState = {
  playerHealth: 100,
  maxPlayerHealth: 100,
  score: 0,
  level: 1,
  gameOver: false,
  paused: false,
  victory: false
};

// Create a custom store with helper methods
function createGameStore() {
  const { subscribe, set, update } = writable<GameState>(initialState);
  
  return {
    subscribe,
    set,
    update,
    
    // Helper methods for common operations
    resetGame: () => set({ ...initialState }),
    
    damagePlayer: (amount: number) => {
      update(state => {
        const newHealth = Math.max(0, state.playerHealth - amount);
        const gameOver = newHealth <= 0;
        
        return {
          ...state,
          playerHealth: newHealth,
          gameOver
        };
      });
    },
    
    healPlayer: (amount: number) => {
      update(state => {
        return {
          ...state,
          playerHealth: Math.min(state.maxPlayerHealth, state.playerHealth + amount)
        };
      });
    },
    
    addScore: (points: number) => {
      update(state => {
        return {
          ...state,
          score: state.score + points
        };
      });
    },
    
    togglePause: () => {
      update(state => {
        return {
          ...state,
          paused: !state.paused
        };
      });
    },
    
    nextLevel: () => {
      update(state => {
        return {
          ...state,
          level: state.level + 1
        };
      });
    },
    
    setVictory: () => {
      update(state => {
        return {
          ...state,
          victory: true
        };
      });
    }
  };
}

export const gameState = createGameStore();

// Helper function to save game progress to localStorage
export function saveGameProgress() {
  let gameStateValue: GameState = { ...initialState }; // Initialize with default values
  
  // Get current state value from the store
  const unsubscribe = gameState.subscribe(value => {
    gameStateValue = value;
  });
  unsubscribe();
  
  // Only save necessary information (not the full state)
  const progress = {
    level: gameStateValue.level,
    score: gameStateValue.score
    // Add other persistent data as needed
  };
  
  try {
    localStorage.setItem('dollkin2_progress', JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save game progress:', e);
  }
}

// Helper function to load game progress from localStorage
export function loadGameProgress(): boolean {
  try {
    const savedProgress = localStorage.getItem('dollkin2_progress');
    if (!savedProgress) return false;
    
    const progress = JSON.parse(savedProgress);
    
    gameState.update(state => ({
      ...state,
      level: progress.level || state.level,
      score: progress.score || state.score
      // Restore other persistent data as needed
    }));
    
    return true;
  } catch (e) {
    console.error('Failed to load game progress:', e);
    return false;
  }
} 