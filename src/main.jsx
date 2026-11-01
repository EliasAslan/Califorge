import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import App from '@/App.jsx'
import '@/index.css'
import { loadSettings } from '@/lib/storage'
import { applyAppearance } from '@/lib/appearance'

applyAppearance(loadSettings())

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
// Install the app shell for repeat visits and offline use. User data stays in IndexedDB.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('APEX offline support could not be enabled.', error);
    });
  });
}
