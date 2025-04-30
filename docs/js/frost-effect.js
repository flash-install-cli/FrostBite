/**
 * Frostbite Website Frost Effects
 * Adds interactive frost and snow effects to the website
 */

document.addEventListener('DOMContentLoaded', function() {
  // Create frost overlay
  createFrostOverlay();
  
  // Create snowfall effect
  createSnowfall();
  
  // Apply frost text effect to headings
  applyFrostTextEffect();
  
  // Apply frost card effect
  applyFrostCardEffect();
  
  // Apply frost button effect
  applyFrostButtonEffect();
  
  // Create frost particles on mouse move
  document.addEventListener('mousemove', createFrostParticleOnMove);
});

/**
 * Creates the frost overlay element
 */
function createFrostOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'frost-overlay';
  document.body.appendChild(overlay);
}

/**
 * Creates the snowfall background
 */
function createSnowfall() {
  const snowfall = document.createElement('div');
  snowfall.className = 'snowfall';
  document.body.appendChild(snowfall);
  
  // Create snowflakes
  const snowflakeCount = Math.floor(window.innerWidth / 20); // Adjust density based on screen width
  
  for (let i = 0; i < snowflakeCount; i++) {
    createSnowflake(snowfall);
  }
}

/**
 * Creates a single snowflake element
 */
function createSnowflake(container) {
  const snowflake = document.createElement('div');
  snowflake.className = 'snowflake';
  
  // Random size
  const size = Math.random() * 8 + 2; // 2-10px
  snowflake.style.width = `${size}px`;
  snowflake.style.height = `${size}px`;
  
  // Random position
  snowflake.style.left = `${Math.random() * 100}%`;
  
  // Random animation duration
  const duration = Math.random() * 20 + 10; // 10-30s
  snowflake.style.animationDuration = `${duration}s`;
  
  // Random animation delay
  snowflake.style.animationDelay = `${Math.random() * duration}s`;
  
  // Random opacity
  snowflake.style.opacity = Math.random() * 0.7 + 0.3; // 0.3-1.0
  
  // Add to container
  container.appendChild(snowflake);
  
  // Remove and recreate when animation ends
  snowflake.addEventListener('animationiteration', () => {
    snowflake.remove();
    createSnowflake(container);
  });
}

/**
 * Creates a frost particle at the specified position
 */
function createFrostParticle(x, y) {
  const particle = document.createElement('div');
  particle.className = 'frost-particle';
  
  // Random size
  const size = Math.random() * 5 + 1; // 1-6px
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  
  // Position
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  
  // Random animation duration
  const duration = Math.random() * 5 + 5; // 5-10s
  particle.style.animationDuration = `${duration}s`;
  
  // Add to body
  document.body.appendChild(particle);
  
  // Remove when animation ends
  setTimeout(() => {
    particle.remove();
  }, duration * 1000);
}

/**
 * Creates frost particles on mouse move
 */
function createFrostParticleOnMove(event) {
  // Throttle particle creation to every 100ms
  if (!createFrostParticleOnMove.lastCall || Date.now() - createFrostParticleOnMove.lastCall > 100) {
    createFrostParticleOnMove.lastCall = Date.now();
    
    // Create 1-3 particles
    const particleCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < particleCount; i++) {
      // Add some randomness to position
      const offsetX = Math.random() * 20 - 10; // -10 to 10
      const offsetY = Math.random() * 20 - 10; // -10 to 10
      
      createFrostParticle(event.clientX + offsetX, event.clientY + offsetY);
    }
  }
}

/**
 * Applies frost text effect to headings
 */
function applyFrostTextEffect() {
  // Apply to main heading
  const mainHeading = document.querySelector('.hero h1');
  if (mainHeading) {
    mainHeading.classList.add('frost-text');
  }
  
  // Apply to section headings
  const sectionHeadings = document.querySelectorAll('section h2');
  sectionHeadings.forEach(heading => {
    heading.classList.add('frost-text');
  });
}

/**
 * Applies frost card effect to feature cards
 */
function applyFrostCardEffect() {
  // Apply to feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.classList.add('frost-card');
  });
  
  // Apply to example cards
  const exampleCards = document.querySelectorAll('.example-card');
  exampleCards.forEach(card => {
    card.classList.add('frost-card');
  });
  
  // Apply to docs cards
  const docsCards = document.querySelectorAll('.docs-card');
  docsCards.forEach(card => {
    card.classList.add('frost-card');
  });
}

/**
 * Applies frost button effect to buttons
 */
function applyFrostButtonEffect() {
  // Apply to primary buttons
  const primaryButtons = document.querySelectorAll('.btn-primary');
  primaryButtons.forEach(button => {
    button.classList.add('frost-button');
  });
}
