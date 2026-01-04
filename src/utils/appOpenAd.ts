import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import type { AdLoadInfo, AdMobError } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { isAdFree } from './adFreeState';

// Google TEST Interstitial ad ID (App Open style - full screen with X)
const TEST_INTERSTITIAL_AD_ID = 'ca-app-pub-3940256099942544/1033173712';

// Probability of showing ad (30%)
const SHOW_AD_PROBABILITY = 0.3;

let adLoaded = false;
let isShowingAd = false;
let listenersSetUp = false;

/**
 * Set up listeners for interstitial ad events
 */
async function setupListeners(): Promise<void> {
  if (listenersSetUp) return;
  
  console.log('[AppOpenAd] Setting up listeners...');
  
  await AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
    console.log('[AppOpenAd] ✅ Ad loaded:', JSON.stringify(info));
    adLoaded = true;
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: AdMobError) => {
    console.error('[AppOpenAd] ❌ Failed to load:', JSON.stringify(error));
    adLoaded = false;
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
    console.log('[AppOpenAd] 📺 Ad showed');
    isShowingAd = true;
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    console.log('[AppOpenAd] 👋 Ad dismissed');
    isShowingAd = false;
    adLoaded = false;
    // Preload next ad
    preloadAd();
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: AdMobError) => {
    console.error('[AppOpenAd] ❌ Failed to show:', JSON.stringify(error));
    isShowingAd = false;
  });
  
  listenersSetUp = true;
  console.log('[AppOpenAd] ✅ Listeners set up');
}

/**
 * Preload an interstitial ad in the background
 */
export async function preloadAd(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[AppOpenAd] Not on Android, skipping preload');
    return;
  }
  
  // Check if user is ad-free
  const adFreeStatus = await isAdFree();
  if (adFreeStatus) {
    console.log('[AppOpenAd] User is ad-free, skipping preload');
    return;
  }
  
  try {
    await setupListeners();
    
    console.log('[AppOpenAd] Preloading ad...');
    await AdMob.prepareInterstitial({
      adId: TEST_INTERSTITIAL_AD_ID,
      isTesting: true,
    });
    console.log('[AppOpenAd] ✅ Preload initiated');
  } catch (error) {
    console.error('[AppOpenAd] ❌ Error preloading:', error);
  }
}

/**
 * Try to show the App Open Ad with 30% probability
 * Returns true if ad was shown, false otherwise
 */
export async function maybeShowAppOpenAd(): Promise<boolean> {
  console.log('[AppOpenAd] maybeShowAppOpenAd() called');
  
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[AppOpenAd] Not on Android, skipping');
    return false;
  }
  
  // Check if already showing
  if (isShowingAd) {
    console.log('[AppOpenAd] Already showing an ad, skipping');
    return false;
  }
  
  // Check if user is ad-free
  const adFreeStatus = await isAdFree();
  if (adFreeStatus) {
    console.log('[AppOpenAd] User is ad-free, NOT showing ad');
    return false;
  }
  
  // Random 30% chance
  const random = Math.random();
  console.log('[AppOpenAd] Random value:', random.toFixed(3), '| Threshold:', SHOW_AD_PROBABILITY);
  
  if (random >= SHOW_AD_PROBABILITY) {
    console.log('[AppOpenAd] 🎲 Random check failed, NOT showing ad this time');
    // Still preload for next time
    if (!adLoaded) {
      preloadAd();
    }
    return false;
  }
  
  console.log('[AppOpenAd] 🎲 Random check passed! Attempting to show ad...');
  
  // If ad not loaded, try to load and show
  if (!adLoaded) {
    console.log('[AppOpenAd] Ad not preloaded, loading now...');
    try {
      await setupListeners();
      await AdMob.prepareInterstitial({
        adId: TEST_INTERSTITIAL_AD_ID,
        isTesting: true,
      });
      
      // Wait a bit for the ad to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!adLoaded) {
        console.log('[AppOpenAd] Ad still not ready after waiting');
        return false;
      }
    } catch (error) {
      console.error('[AppOpenAd] ❌ Error loading ad:', error);
      return false;
    }
  }
  
  // Show the ad
  try {
    console.log('[AppOpenAd] 📺 Showing ad NOW!');
    await AdMob.showInterstitial();
    return true;
  } catch (error) {
    console.error('[AppOpenAd] ❌ Error showing ad:', error);
    return false;
  }
}

/**
 * Initialize App Open Ads - call this on app start
 */
export async function initAppOpenAds(): Promise<void> {
  console.log('[AppOpenAd] Initializing...');
  
  if (Capacitor.getPlatform() !== 'android') {
    console.log('[AppOpenAd] Not on Android, skipping init');
    return;
  }
  
  // Preload ad in background
  await preloadAd();
  
  // Set up visibility change listener for app resume
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      console.log('[AppOpenAd] App became visible (resumed)');
      await maybeShowAppOpenAd();
    }
  });
  
  // Also listen for Capacitor resume event
  document.addEventListener('resume', async () => {
    console.log('[AppOpenAd] Capacitor resume event');
    await maybeShowAppOpenAd();
  });
  
  console.log('[AppOpenAd] ✅ Initialized');
}
