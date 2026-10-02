import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerServiceWorker } from './services/swManager.js'
import { isNativeApp, initNativeNotifications } from './services/nativeNotificationService.js'

// Initialize notifications based on platform
if (isNativeApp()) {
  initNativeNotifications();
} else {
  // Register the Service Worker for web browser background notifications
  registerServiceWorker();
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
