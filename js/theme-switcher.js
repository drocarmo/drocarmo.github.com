document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.querySelector('.theme-switch');
  const maxThemes = 6;
  let currentTheme = parseInt(localStorage.getItem('theme')) || 1;

  const cycleTheme = () => {
    currentTheme = (currentTheme % maxThemes) + 1;
    updateTheme(currentTheme);
  };

  const updateTheme = (themeNumber) => {
    if (themeSwitch) {
      themeSwitch.setAttribute('data-theme', themeNumber);
    }
    document.documentElement.setAttribute('data-theme', themeNumber);
    localStorage.setItem('theme', themeNumber.toString());
  };

  if (themeSwitch) {
    themeSwitch.addEventListener('click', cycleTheme);
  }

  updateTheme(currentTheme);
});