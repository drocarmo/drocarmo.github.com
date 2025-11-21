document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.querySelector('.theme-switch');
  const maxThemes = 6;
  let currentTheme = parseInt(localStorage.getItem('theme')) || 1;

  // Function to cycle themes in order
  const cycleTheme = () => {
    // Increment theme and reset to 1 if we exceed maxThemes
    currentTheme = (currentTheme % maxThemes) + 1;
    
    // Apply the new theme
    updateTheme(currentTheme);
  };

  // Function to update theme
  const updateTheme = (themeNumber) => {
    // Update DOM elements
    themeSwitch.setAttribute('data-theme', themeNumber);
    document.documentElement.setAttribute('data-theme', themeNumber);
    
    // Save to localStorage
    localStorage.setItem('theme', themeNumber.toString());
  };

  // Add click event listener
  themeSwitch.addEventListener('click', cycleTheme);

  // Initialize theme on page load
  updateTheme(currentTheme);

  // Image hover swap functionality with smooth crossfade transition
  const introImageContainer = document.querySelector('.intro-image');
  const introImage = introImageContainer?.querySelector('img');
  
  if (introImage && introImageContainer) {
    const originalSrc = introImage.src;
    const hoverSrc = originalSrc.replace('self.jpg', 'self-hover.jpg').replace('self.JPG', 'self-hover.jpg');
    
    // Preload the hover image
    const hoverImagePreload = new Image();
    hoverImagePreload.src = hoverSrc;
    
    // Create overlay image element for crossfade effect
    const hoverImageOverlay = document.createElement('img');
    hoverImageOverlay.src = hoverSrc;
    hoverImageOverlay.alt = introImage.alt;
    hoverImageOverlay.className = 'intro-image-overlay';
    
    // Append overlay image to container
    introImageContainer.appendChild(hoverImageOverlay);
    
    // Track state for mobile tap cycling
    let isShowingHover = false;
    
    // Detect if device supports touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Mobile tap functionality - cycle between images
    if (isTouchDevice) {
      introImageContainer.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Toggle between base and hover image
        isShowingHover = !isShowingHover;
        
        if (isShowingHover) {
          hoverImageOverlay.classList.remove('fading-out');
          hoverImageOverlay.style.opacity = '1';
        } else {
          hoverImageOverlay.classList.add('fading-out');
          hoverImageOverlay.style.opacity = '0';
        }
      });
    }
    
    // Desktop hover functionality
    // Crossfade to hover image on mouseenter (faster, smooth ease-out)
    introImageContainer.addEventListener('mouseenter', () => {
      if (!isTouchDevice) {
        hoverImageOverlay.classList.remove('fading-out');
        hoverImageOverlay.style.opacity = '1';
      }
    });
    
    // Crossfade back to original image on mouseleave (slower, gentler ease-in)
    introImageContainer.addEventListener('mouseleave', () => {
      if (!isTouchDevice) {
        hoverImageOverlay.classList.add('fading-out');
        hoverImageOverlay.style.opacity = '0';
      }
    });
  }
});