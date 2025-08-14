// Loading screen management for Professional PDF Editor

// Remove loading screen when React app loads
const observer = new MutationObserver((mutations) => {
  const root = document.getElementById('root');
  if (root && root.children.length > 0) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
    observer.disconnect();
  }
});

observer.observe(document.getElementById('root'), {
  childList: true,
  subtree: true
});

// Fallback: Remove loading screen after 10 seconds
setTimeout(() => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen && loadingScreen.style.display !== 'none') {
    loadingScreen.style.display = 'none';
  }
}, 10000);