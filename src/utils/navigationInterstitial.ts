import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import type { AdLoadInfo, AdMobError } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { isAdFree } from './adFreeState';
import { trackAdEvent } from './adReport';

// REAL: ca-app-pub-1622404623822707/4911767431
const INTERSTITIAL_AD_ID = 'ca-app-pub-3940256099942544/1033173712'; // TEST

// Probability of showing ad (10%)
const SHOW_AD_PROBABILITY = 0.1;

// Cooldown settings to prevent "too many requests" errors
const MIN_REQUEST_INTERVAL_MS = 30000; // 30 seconds between requests
const FAILURE_COOLDOWN_MS = 60000; // 60 seconds after a failure before retrying

let adLoaded = false;
let isShowingAd = false;
let listenersSetUp = false;
let lastRequestTime = 0;
let lastFailureTime = 0;
let isCurrentlyLoading = false;

/**
 * Check if we can make a new ad request (rate limiting)
 */
function canMakeRequest(): boolean {
  const now = Date.now();
  
  // If we're already loading, don't start another request
  if (isCurrentlyLoading) {
    console.log('[NavInterstitial] ⏳ Already loading, skipping duplicate request');
    return false;
  }
  
  // If we failed recently, wait for cooldown
  if (lastFailureTime > 0 && now - lastFailureTime < FAILURE_COOLDOWN_MS) {
    const waitTime = Math.ceil((FAILURE_COOLDOWN_MS - (now - lastFailureTime)) / 1000);
    console.log(`[NavInterstitial] ⏳ In failure cooldown, wait ${waitTime}s`);
    return false;
  }
  
  // If we made a request recently, wait
  if (lastRequestTime > 0 && now - lastRequestTime < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = Math.ceil((MIN_REQUEST_INTERVAL_MS - (now - lastRequestTime)) / 1000);
    console.log(`[NavInterstitial] ⏳ Rate limiting, wait ${waitTime}s`);
    return false;
  }
  
  return true;
}

/**
 * Set up listeners for navigation interstitial ad events
 */
async function setupListeners(): Promise<void> {
  if (listenersSetUp) return;
  
  console.log('[NavInterstitial] Setting up listeners...');
  
  await AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
    console.log('[NavInterstitial] ✅ Ad loaded:', JSON.stringify(info));
    trackAdEvent('interstitialLoaded');
    adLoaded = true;
    isCurrentlyLoading = false;
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: AdMobError) => {
    console.error('[NavInterstitial] ❌ Failed to load:', JSON.stringify(error));
    trackAdEvent('interstitialFailed');
    adLoaded = false;
    isCurrentlyLoading = false;
    lastFailureTime = Date.now(); // Start cooldown
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
    console.log('[NavInterstitial] 📺 Ad SHOWED');
    trackAdEvent('interstitialShown');
    isShowingAd = true;
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    console.log('[NavInterstitial] 👋 Ad DISMISSED (user closed/skipped)');
    trackAdEvent('interstitialDismissed');
    isShowingAd = false;
    adLoaded = false;
    // Schedule preload after a delay (not immediately)
    setTimeout(() => {
      preloadNavigationAd();
    }, MIN_REQUEST_INTERVAL_MS);
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: AdMobError) => {
    console.error('[NavInterstitial] ❌ Failed to show:', JSON.stringify(error));
    trackAdEvent('interstitialFailed');
    isShowingAd = false;
    lastFailureTime = Date.now();
  });
  
  listenersSetUp = true;
  console.log('[NavInterstitial] ✅ Listeners set up');
}

/**
 * Preload an interstitial ad in the background
 */
export async function preloadNavigationAd(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') {
    return;
  }
  
  // Check if user is ad-free
  const adFreeStatus = await isAdFree();
  if (adFreeStatus) {
    console.log('[NavInterstitial] User is ad-free, skipping preload');
    return;
  }
  
  // Check if ad already loaded
  if (adLoaded) {
    console.log('[NavInterstitial] Ad already loaded, skipping preload');
    return;
  }
  
  // Rate limiting check
  if (!canMakeRequest()) {
    return;
  }
  
  try {
    await setupListeners();
    
    isCurrentlyLoading = true;
    lastRequestTime = Date.now();
    
    console.log('[NavInterstitial] Preloading ad...');
    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_ID,
      isTesting: false,
    });
    console.log('[NavInterstitial] ✅ Preload initiated');
  } catch (error) {
    console.error('[NavInterstitial] ❌ Error preloading:', error);
    isCurrentlyLoading = false;
    lastFailureTime = Date.now();
  }
}

/**
 * Try to show navigation interstitial with 10% probability
 * No reward is given - this is just a regular ad
 * Returns true if ad was shown, false otherwise
 */
export async function maybeShowNavigationInterstitial(): Promise<boolean> {
  console.log('[NavInterstitial] === TRIGGER: maybeShowNavigationInterstitial() ===');
  
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[NavInterstitial] Not on Android, skipping');
    return false;
  }
  
  // Check if already showing
  if (isShowingAd) {
    console.log('[NavInterstitial] Already showing an ad, skipping');
    return false;
  }
  
  // Check if user is ad-free (respects rewarded ad period)
  const adFreeStatus = await isAdFree();
  if (adFreeStatus) {
    console.log('[NavInterstitial] ⏭️ User is AD-FREE, skipping interstitial');
    trackAdEvent('interstitialSkippedAdFree');
    return false;
  }
  
  // Random 10% chance
  const random = Math.random();
  console.log('[NavInterstitial] 🎲 Random:', random.toFixed(3), '| Threshold:', SHOW_AD_PROBABILITY);
  
  if (random >= SHOW_AD_PROBABILITY) {
    console.log('[NavInterstitial] 🎲 Random check FAILED (>= 0.1), NOT showing ad');
    trackAdEvent('interstitialSkippedChance');
    // Still try to preload for next time (with rate limiting)
    if (!adLoaded && !isCurrentlyLoading) {
      preloadNavigationAd();
    }
    return false;
  }
  
  console.log('[NavInterstitial] 🎲 Random check PASSED (< 0.1)! Will show ad...');
  
  // If ad not loaded, check if we can load now
  if (!adLoaded) {
    console.log('[NavInterstitial] Ad not preloaded');
    
    // Check rate limiting before trying to load
    if (!canMakeRequest()) {
      console.log('[NavInterstitial] Cannot load now due to rate limiting');
      return false;
    }
    
    console.log('[NavInterstitial] Loading ad now...');
    try {
      await setupListeners();
      
      isCurrentlyLoading = true;
      lastRequestTime = Date.now();
      
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_AD_ID,
        isTesting: false,
      });
      
      // Wait for the ad to load (max 3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (!adLoaded) {
        console.log('[NavInterstitial] Ad still not ready after waiting');
        return false;
      }
    } catch (error) {
      console.error('[NavInterstitial] ❌ Error loading ad:', error);
      isCurrentlyLoading = false;
      lastFailureTime = Date.now();
      return false;
    }
  }
  
  // Show the ad (no reward - just a regular interstitial)
  try {
    console.log('[NavInterstitial] 📺 SHOWING AD NOW (skippable with X/Skip button)');
    await AdMob.showInterstitial();
    return true;
  } catch (error) {
    console.error('[NavInterstitial] ❌ Error showing ad:', error);
    lastFailureTime = Date.now();
    return false;
  }
}

/**
 * Initialize navigation interstitial - call once on app start
 */
export async function initNavigationInterstitial(): Promise<void> {
  console.log('[NavInterstitial] Initializing...');
  
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[NavInterstitial] Not on Android, skipping init');
    return;
  }
  
  // Delay initial preload to let AdMob fully initialize
  setTimeout(async () => {
    await preloadNavigationAd();
  }, 5000);
  
  console.log('[NavInterstitial] ✅ Initialized (preload scheduled)');
}
