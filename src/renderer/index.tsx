import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import BasicApp from './BasicApp';
import './styles/index.css';
import './styles/themes.css';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Fix for global not defined
if (typeof global === 'undefined') {
  (window as any).global = window;
}

// Initialize the application
const initializeApp = () => {
  try {
    // Check if root element exists
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Root element not found');
      // Create root element if missing
      const root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }
    
    // Create React root and render app
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    
    // Use the full-featured App with all professional capabilities
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    // Show error in UI
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: #1e1e1e;
        color: #e0e0e0;
        font-family: system-ui, sans-serif;
      ">
        <div style="text-align: center; padding: 40px;">
          <h1 style="color: #ff6b6b;">Application Error</h1>
          <p>Failed to initialize the PDF Editor</p>
          <pre style="
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            text-align: left;
            max-width: 600px;
            overflow: auto;
          ">${error}</pre>
          <button onclick="window.location.reload()" style="
            margin-top: 20px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">Reload Application</button>
        </div>
      </div>
    `;
  }
};

// Wait for DOM content to be loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for debugging
(window as any).appVersion = '2.0.0';
