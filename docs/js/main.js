document.addEventListener('DOMContentLoaded', function() {
  // Initialize ClipboardJS
  const clipboard = new ClipboardJS('.copy-btn');
  
  clipboard.on('success', function(e) {
    const button = e.trigger;
    const originalHTML = button.innerHTML;
    
    // Change icon to checkmark
    button.innerHTML = '<i class="fas fa-check"></i>';
    
    // Reset after 2 seconds
    setTimeout(function() {
      button.innerHTML = originalHTML;
    }, 2000);
    
    e.clearSelection();
  });
  
  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Mobile menu
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const body = document.body;
  
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      // Create mobile menu if it doesn't exist
      if (!document.querySelector('.mobile-menu')) {
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        
        const mobileMenuContent = `
          <div class="mobile-menu-header">
            <div class="logo">
              <img src="images/frostbite-logo-64.png" alt="Frostbite Logo">
              <span>Frostbite</span>
            </div>
            <button class="mobile-menu-close">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="mobile-menu-links">
            <a href="#features">Features</a>
            <a href="#usage">Usage</a>
            <a href="#examples">Examples</a>
            <a href="#docs">Documentation</a>
            <a href="https://github.com/yourusername/frostbite" class="github-link"><i class="fab fa-github"></i> GitHub</a>
          </div>
        `;
        
        mobileMenu.innerHTML = mobileMenuContent;
        body.appendChild(mobileMenu);
        
        // Close menu when clicking close button
        const closeBtn = mobileMenu.querySelector('.mobile-menu-close');
        closeBtn.addEventListener('click', () => {
          mobileMenu.classList.remove('active');
        });
        
        // Close menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('.mobile-menu-links a');
        mobileLinks.forEach(link => {
          link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
          });
        });
      }
      
      // Toggle mobile menu
      const mobileMenu = document.querySelector('.mobile-menu');
      mobileMenu.classList.add('active');
    });
  }
  
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Animate elements when they come into view
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.feature-card, .install-card, .example-card, .docs-card');
    
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (elementPosition < windowHeight - 100) {
        element.classList.add('fade-in');
      }
    });
  };
  
  // Run on load
  animateOnScroll();
  
  // Run on scroll
  window.addEventListener('scroll', animateOnScroll);
});
