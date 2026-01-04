import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import type { AdLoadInfo, AdMobError } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { isAdFree } from './adFreeState';
import { trackAdEvent } from './adReport';

// Google TEST Interstitial ad ID (skippable after 1-2 sec with X button)
const TEST_INTERSTITIAL_AD_ID = 'ca-app-pub-3940256099942544/1033173712';

// Probability of showing ad (10%)
const SHOW_AD_PROBABILITY = 0.1;

let adLoaded = false;
let isShowingAd = false;
let listenersSetUp = false;

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
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: AdMobError) => {
    console.error('[NavInterstitial] ❌ Failed to load:', JSON.stringify(error));
    trackAdEvent('interstitialFailed');
    adLoaded = false;
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
    // Preload next ad for future navigation
    preloadNavigationAd();
  });
  
  await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (error: AdMobError) => {
    console.error('[NavInterstitial] ❌ Failed to show:', JSON.stringify(error));
    trackAdEvent('interstitialFailed');
    isShowingAd = false;
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
  
  try {
    await setupListeners();
    
    console.log('[NavInterstitial] Preloading ad...');
    await AdMob.prepareInterstitial({
      adId: TEST_INTERSTITIAL_AD_ID,
      isTesting: true,
    });
    console.log('[NavInterstitial] ✅ Preload initiated');
  } catch (error) {
    console.error('[NavInterstitial] ❌ Error preloading:', error);
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
    // Still preload for next time
    if (!adLoaded) {
      preloadNavigationAd();
    }
    return false;
  }
  
  console.log('[NavInterstitial] 🎲 Random check PASSED (< 0.1)! Will show ad...');
  
  // If ad not loaded, try to load it now
  if (!adLoaded) {
    console.log('[NavInterstitial] Ad not preloaded, loading now...');
    try {
      await setupListeners();
      await AdMob.prepareInterstitial({
        adId: TEST_INTERSTITIAL_AD_ID,
        isTesting: true,
      });
      
      // Wait for the ad to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!adLoaded) {
        console.log('[NavInterstitial] Ad still not ready after waiting');
        return false;
      }
    } catch (error) {
      console.error('[NavInterstitial] ❌ Error loading ad:', error);
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
  
  // Preload ad in background for faster display later
  await preloadNavigationAd();
  
  console.log('[NavInterstitial] ✅ Initialized');
}
