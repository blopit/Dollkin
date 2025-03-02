<script>
  import { goto } from '$app/navigation';
  
  function startGame() {
    goto('/game');
  }
</script>

<svelte:head>
  <title>Dollkin2 - A Top-Down Adventure Roguelite</title>
</svelte:head>

<div class="home-container">
  <div class="content">
    <h1 class="title">Dollkin2</h1>
    <p class="subtitle">A Top-Down Adventure Roguelite</p>
    
    <div class="buttons">
      <button class="start-button" on:click={startGame}>
        Start Game
      </button>
      
      <a href="https://github.com/yourusername/Dollkin2" target="_blank" rel="noopener noreferrer" class="github-link">
        View on GitHub
      </a>
    </div>
    
    <div class="description">
      <p>
        Explore a mysterious world filled with unique characters, challenging enemies, and powerful abilities.
        Discover the secrets of the Dollkin as you navigate through procedurally generated environments.
      </p>
      
      <h2>Features:</h2>
      <ul>
        <li>Procedurally generated levels</li>
        <li>Unique character abilities</li>
        <li>Challenging combat system</li>
        <li>Roguelite progression</li>
        <li>Beautiful pixel art style</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .home-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #222;
    color: #fff;
    font-family: 'Arial', sans-serif;
    padding: 2rem;
  }
  
  .content {
    max-width: 800px;
    text-align: center;
  }
  
  .title {
    font-size: 4rem;
    margin-bottom: 0.5rem;
    color: #f8f8f8;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  
  .subtitle {
    font-size: 1.5rem;
    margin-bottom: 2rem;
    color: #aaa;
  }
  
  .buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3rem;
    flex-wrap: wrap;
  }
  
  .start-button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    background-color: #4a8;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
  }
  
  .start-button:hover {
    background-color: #5b9;
    transform: translateY(-2px);
  }
  
  .github-link {
    display: inline-block;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    background-color: #333;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background-color 0.3s, transform 0.2s;
  }
  
  .github-link:hover {
    background-color: #444;
    transform: translateY(-2px);
  }
  
  .description {
    text-align: left;
    line-height: 1.6;
    margin-top: 2rem;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 2rem;
    border-radius: 8px;
  }
  
  h2 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    color: #4a8;
  }
  
  ul {
    list-style-type: none;
    padding: 0;
  }
  
  li {
    padding: 0.5rem 0;
    position: relative;
    padding-left: 1.5rem;
  }
  
  li:before {
    content: "•";
    color: #4a8;
    position: absolute;
    left: 0;
  }
  
  @media (max-width: 600px) {
    .title {
      font-size: 3rem;
    }
    
    .subtitle {
      font-size: 1.2rem;
    }
    
    .buttons {
      flex-direction: column;
    }
  }
</style> 