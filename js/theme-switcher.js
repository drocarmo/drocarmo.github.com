document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.querySelector('.theme-switch');
  const switchEl = document.querySelector('.theme-switch .switch');
  const clickMeEl = document.querySelector('.theme-switch .clickme');
  const maxThemes = 6;
  let currentTheme = parseInt(localStorage.getItem('theme')) || 1;

  // #region agent log - script loaded
  try {
    fetch('http://127.0.0.1:7242/ingest/b742c76f-31a7-49f1-a1b4-5f565b762aad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H0',
        location: 'js/theme-switcher.js:DOMContentLoaded',
        message: 'Theme switcher script loaded',
        data: {
          href: typeof window !== 'undefined' ? window.location.href : null,
          protocol: typeof window !== 'undefined' ? window.location.protocol : null,
          themeSwitchFound: !!themeSwitch,
          switchFound: !!switchEl,
          clickMeFound: !!clickMeEl
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
  } catch (e) {
    // swallow logging errors
  }
  // #endregion agent log - script loaded

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

  // #region agent log - hover metrics
  const logHoverMetrics = (phase) => {
    try {
      if (!themeSwitch || !switchEl || !clickMeEl) return;
      const themeRect = themeSwitch.getBoundingClientRect();
      const switchRect = switchEl.getBoundingClientRect();
      const clickRect = clickMeEl.getBoundingClientRect();

      fetch('http://127.0.0.1:7242/ingest/b742c76f-31a7-49f1-a1b4-5f565b762aad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H1',
          location: 'js/theme-switcher.js:logHoverMetrics',
          message: 'Theme switch hover layout metrics',
          data: {
            phase,
            themeRect: { x: themeRect.x, y: themeRect.y, width: themeRect.width, height: themeRect.height },
            switchRect: { x: switchRect.x, y: switchRect.y, width: switchRect.width, height: switchRect.height },
            clickRect: { x: clickRect.x, y: clickRect.y, width: clickRect.width, height: clickRect.height }
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
    } catch (e) {
      // swallow logging errors
    }
  };

  if (themeSwitch) {
    themeSwitch.addEventListener('mouseenter', () => logHoverMetrics('enter'));
    themeSwitch.addEventListener('mouseleave', () => logHoverMetrics('leave'));
  }
  // #endregion agent log - hover metrics

  // Add click event listener
  themeSwitch.addEventListener('click', cycleTheme);

  // Initialize theme on page load
  updateTheme(currentTheme);
  
});