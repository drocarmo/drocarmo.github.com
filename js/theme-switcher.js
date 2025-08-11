document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.querySelector('.theme-switch');
  const maxThemes = 11;
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
});