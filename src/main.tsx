import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err));
  });
}

window.addEventListener('appinstalled', () => {
  if ((window as any).gtag) {
    (window as any).gtag('event', 'pwa_installed', { 'platform': 'Android/PWA' });
  }
});
