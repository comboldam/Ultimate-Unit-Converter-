import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AdMob } from '@capacitor-community/admob'
import { Capacitor } from '@capacitor/core'
import { initAppOpenAds, maybeShowAppOpenAd } from './utils/appOpenAd'

// Initialize AdMob globally on app start
if (Capacitor.getPlatform() === 'android') {
  console.log('[Main] Android detected, initializing AdMob...');
  
  AdMob.initialize({
    initializeForTesting: true,
  }).then(async () => {
    console.log('[Main] ✅ AdMob initialized successfully');
    
    // Initialize App Open Ads
    await initAppOpenAds();
    
    // Try to show App Open Ad on initial app launch (30% chance)
    console.log('[Main] Checking if should show App Open Ad on launch...');
    await maybeShowAppOpenAd();
    
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
