import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { isAdFree } from './adFreeState';
import { trackAdEvent } from './adReport';
import { App } from '@capacitor/app';

// REAL: ca-app-pub-1622404623822707/3161725584
const APP_OPEN_AD_ID = 'ca-app-pub-3940256099942544/9257395921'; // TEST

// Probability of showing ad (30%)
const SHOW_AD_PROBABILITY = 0.3;

// Cooldown settings
const MIN_REQUEST_INTERVAL_MS = 30000; // 30 seconds between requests
const FAILURE_COOLDOWN_MS = 60000; // 60 seconds after failure

let adLoaded = false;
let isShowingAd = false;
let lastRequestTime = 0;
let lastFailureTime = 0;
let isCurrentlyLoading = false;
let listenersSetUp = false;

/**
 * Check if we can make a new ad request (rate limiting)
 */
function canMakeRequest(): boolean {
  const now = Date.now();
  
  if (isCurrentlyLoading) {
    console.log('[AppOpenAd] ⏳ Already loading, skipping duplicate request');
    return false;
  }
  
  if (lastFailureTime > 0 && now - lastFailureTime < FAILURE_COOLDOWN_MS) {
    const waitTime = Math.ceil((FAILURE_COOLDOWN_MS - (now - lastFailureTime)) / 1000);
    console.log(`[AppOpenAd] ⏳ In failure cooldown, wait ${waitTime}s`);
    return false;
  }
  
  if (lastRequestTime > 0 && now - lastRequestTime < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = Math.ceil((MIN_REQUEST_INTERVAL_MS - (now - lastRequestTime)) / 1000);
    console.log(`[AppOpenAd] ⏳ Rate limiting, wait ${waitTime}s`);
    return false;
  }
  
  return true;
}

/**
 * Set up listeners for App Open ad events
 */
async function setupListeners(): Promise<void> {
  if (listenersSetUp) return;
  
  console.log('[AppOpenAd] Setting up listeners...');
  
  // Note: App Open ads use the same events as Interstitial in this plugin
  // We'll use prepareInterstitial/showInterstitial but with app open ad ID
  
  listenersSetUp = true;
  console.log('[AppOpenAd] ✅ Listeners set up');
}

/**
 * Preload an App Open ad in the background
 */
export async function preloadAppOpenAd(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') {
    return;
  }
  
  const adFreeStatus = await isAdFree();
  if (adFreeStatus) {
    console.log('[AppOpenAd] User is ad-free, skipping preload');
    return;
  }
  
  if (adLoaded) {
    console.log('[AppOpenAd] Ad already loaded, skipping preload');
    return;
  }
  
  if (!canMakeRequest()) {
    return;
  }
  
  try {
    await setupListeners();
    
    isCurrentlyLoading = true;
    lastRequestTime = Date.now();
    
    console.log('[AppOpenAd] Preloading app open ad...');
    trackAdEvent('appOpenLoad');
    
    await AdMob.prepareInterstitial({
      adId: APP_OPEN_AD_ID,
      isTesting: true,
    });
    
    adLoaded = true;
    isCurrentlyLoading = false;
    console.log('[AppOpenAd] ✅ Preload complete');
    trackAdEvent('appOpenLoaded');
  } catch (error) {
    console.error('[AppOpenAd] ❌ Error preloading:', error);
    isCurrentlyLoading = false;
    lastFailureTime = Date.now();
    trackAdEvent('appOpenFailed');
  }
}

/**
 * Try to show App Open ad with 30% probability
 */
export async function maybeShowAppOpenAd(): Promise<boolean> {
  console.log('[AppOpenAd] === TRIGGER: maybeShowAppOpenAd() ===');
  
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[AppOpenAd] Not on Android, skipping');
    return false;
  }
  
  if (isShowingAd) {
    console.log('[AppOpenAd] Already showing an ad, skipping');
    return false;
  }
  
  const adFreeStatus = await isAdFree();
  if (adFreeStatus) {
    console.log('[AppOpenAd] ⏭️ User is AD-FREE, skipping app open ad');
    trackAdEvent('appOpenSkippedAdFree');
    return false;
  }
  
  // Random 30% chance
  const random = Math.random();
  console.log('[AppOpenAd] 🎲 Random:', random.toFixed(3), '| Threshold:', SHOW_AD_PROBABILITY);
  
  if (random >= SHOW_AD_PROBABILITY) {
    console.log('[AppOpenAd] 🎲 Random check FAILED (>= 0.3), NOT showing ad');
    trackAdEvent('appOpenSkippedChance');
    if (!adLoaded && !isCurrentlyLoading) {
      preloadAppOpenAd();
    }
    return false;
  }
  
  console.log('[AppOpenAd] 🎲 Random check PASSED (< 0.3)! Will show ad...');
  
  if (!adLoaded) {
    console.log('[AppOpenAd] Ad not preloaded');
    
    if (!canMakeRequest()) {
      console.log('[AppOpenAd] Cannot load now due to rate limiting');
      return false;
    }
    
    console.log('[AppOpenAd] Loading ad now...');
    try {
      await setupListeners();
      
      isCurrentlyLoading = true;
      lastRequestTime = Date.now();
      trackAdEvent('appOpenLoad');
      
      await AdMob.prepareInterstitial({
        adId: APP_OPEN_AD_ID,
        isTesting: true,
      });
      
      // Wait for ad to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      adLoaded = true;
      isCurrentlyLoading = false;
      trackAdEvent('appOpenLoaded');
    } catch (error) {
      console.error('[AppOpenAd] ❌ Error loading ad:', error);
      isCurrentlyLoading = false;
      lastFailureTime = Date.now();
      trackAdEvent('appOpenFailed');
      return false;
    }
  }
  
  try {
    console.log('[AppOpenAd] 📺 SHOWING APP OPEN AD NOW');
    isShowingAd = true;
    trackAdEvent('appOpenShown');
    
    await AdMob.showInterstitial();
    
    console.log('[AppOpenAd] ✅ Ad shown successfully');
    adLoaded = false;
    isShowingAd = false;
    
    // Preload next ad after a delay
    setTimeout(() => {
      preloadAppOpenAd();
    }, MIN_REQUEST_INTERVAL_MS);
    
    return true;
  } catch (error) {
    console.error('[AppOpenAd] ❌ Error showing ad:', error);
    isShowingAd = false;
    lastFailureTime = Date.now();
    trackAdEvent('appOpenFailed');
    return false;
  }
}

/**
 * Initialize App Open Ad - call once on app start
 */
export async function initAppOpenAd(): Promise<void> {
  console.log('[AppOpenAd] Initializing...');
  
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[AppOpenAd] Not on Android, skipping init');
    return;
  }
  
  // Show app open ad on first launch (with 30% chance)
  setTimeout(async () => {
    await maybeShowAppOpenAd();
  }, 2000); // Wait 2 seconds after app start
  
  // Listen for app resume events
  App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      console.log('[AppOpenAd] App resumed from background');
      // Small delay to let the app fully resume
      setTimeout(async () => {
        await maybeShowAppOpenAd();
      }, 500);
    }
  });
  
  // Preload ad in background
  setTimeout(async () => {
    await preloadAppOpenAd();
  }, 5000);
  
  console.log('[AppOpenAd] ✅ Initialized');
}
