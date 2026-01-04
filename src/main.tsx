import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AdMob } from '@capacitor-community/admob'
import { Capacitor } from '@capacitor/core'
import { initNavigationInterstitial } from './utils/navigationInterstitial'
import { initAppOpenAd } from './utils/appOpenAd'
import { logAdReport } from './utils/adReport'

// Log ad report on app start (debug only)
console.log('[Main] App starting...');
logAdReport();

// Initialize AdMob globally on app start
if (Capacitor.getPlatform() === 'android') {
  console.log('[Main] Android detected, initializing AdMob...');
  
  AdMob.initialize({
    initializeForTesting: true, // Using test ads
  }).then(async () => {
    console.log('[Main] ✅ AdMob initialized successfully');
    
    // Initialize App Open Ad (30% chance on start/resume)
    await initAppOpenAd();
    
    // Initialize Navigation Interstitial (10% chance on navigation)
    await initNavigationInterstitial();
    
  }).catch((error) => {
    console.error('[Main] ❌ AdMob initialization error:', error);
  });
} else {
  console.log('[Main] Not on Android, skipping AdMob initialization');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
