import { useEffect, useState, useCallback } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { isAdFree } from '../utils/adFreeState';
import { AD_FREE_EVENT } from '../pages/SettingsPage';
import { trackAdEvent } from '../utils/adReport';

export function AdMobBanner() {
  const [bannerHeight, setBannerHeight] = useState(50); // Reserve minimal space to prevent layout shift
  const [shouldShowAds, setShouldShowAds] = useState(true);

  // Calculate adaptive banner height based on screen width
  // App is locked to portrait orientation
  const getAdaptiveBannerHeight = () => {
    const width = window.innerWidth;
    const dp = width / window.devicePixelRatio;

    // Google's adaptive banner sizing for portrait orientation
    if (dp >= 728) {
      return 90; // Tablet size
    } else {
      return 32; // Standard phone - matches actual ad height
    }
  };

  const showBanner = useCallback(async () => {
    console.log('[AdMobBanner] Attempting to show banner ad...');
    try {
      // Remove existing banner first to avoid duplication
      console.log('[AdMobBanner] Removing any existing banner...');
      await AdMob.removeBanner().catch(() => {/* Ignore if no banner exists */});

      const options: BannerAdOptions = {
        adId: 'ca-app-pub-3940256099942544/6300978111', // Google TEST banner ID
        adSize: BannerAdSize.ADAPTIVE_BANNER, // Adaptive banner fills width
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true, // Force test ads
      };

      console.log('[AdMobBanner] Showing banner with options:', JSON.stringify(options));
      await AdMob.showBanner(options);
      console.log('[AdMobBanner] ✅ Banner shown successfully');
      trackAdEvent('bannerLoaded');
      trackAdEvent('bannerShown');

      // Set height based on screen width
      const height = getAdaptiveBannerHeight();
      console.log('[AdMobBanner] Setting banner height to:', height);
      setBannerHeight(height);
    } catch (error) {
      console.error('[AdMobBanner] ❌ Error showing banner:', error);
      trackAdEvent('bannerFailed');
    }
  }, []);

  const hideBanner = useCallback(async () => {
    console.log('[AdMobBanner] Hiding banner ad...');
    try {
      await AdMob.removeBanner();
      console.log('[AdMobBanner] ✅ Banner removed successfully');
      setBannerHeight(0);
    } catch (error) {
      console.error('[AdMobBanner] Error removing banner:', error);
    }
  }, []);

  const checkAndUpdateAdStatus = useCallback(async () => {
    console.log('[AdMobBanner] Checking ad-free status...');
    const adFreeStatus = await isAdFree();
    console.log('[AdMobBanner] Is ad-free:', adFreeStatus);
    
    const newShouldShowAds = !adFreeStatus;
    
    if (newShouldShowAds !== shouldShowAds) {
      console.log('[AdMobBanner] Ad status changed. Should show ads:', newShouldShowAds);
      setShouldShowAds(newShouldShowAds);

      if (newShouldShowAds) {
        // Ad-free period ended, show banner again
        console.log('[AdMobBanner] Ad-free period ended, showing banner');
        await showBanner();
      } else {
        // User became ad-free, hide banner
        console.log('[AdMobBanner] User is now ad-free, hiding banner');
        await hideBanner();
      }
    }
    
    return adFreeStatus;
  }, [shouldShowAds, showBanner, hideBanner]);

  useEffect(() => {
    // Only run on Android
    if (Capacitor.getPlatform() !== 'android') {
      console.log('[AdMobBanner] Not on Android, skipping banner');
      return;
    }

    console.log('[AdMobBanner] Component mounted, initializing...');

    const initializeAdMob = async () => {
      try {
        // Check if user is in ad-free period
        const adFreeStatus = await isAdFree();
        console.log('[AdMobBanner] Initial ad-free status:', adFreeStatus);
        setShouldShowAds(!adFreeStatus);

        // If ad-free, don't show banner
        if (adFreeStatus) {
          console.log('[AdMobBanner] User is ad-free on init, not showing banner');
          setBannerHeight(0);
          return;
        }

        // AdMob is already initialized in main.tsx, just show banner
        console.log('[AdMobBanner] User is NOT ad-free, showing banner');
        await showBanner();

      } catch (error) {
        console.error('[AdMobBanner] ❌ AdMob banner initialization error:', error);
        // Keep reserved space even on error to prevent layout shift
      }
    };

    initializeAdMob();

    // Listen for ad-free status changes from rewarded ad
    const handleAdFreeChange = async (event: Event) => {
      const customEvent = event as CustomEvent<{ adFree: boolean }>;
      console.log('[AdMobBanner] Received ad-free status change event:', customEvent.detail);
      
      if (customEvent.detail?.adFree) {
        console.log('[AdMobBanner] User earned reward, hiding banner immediately');
        setShouldShowAds(false);
        await hideBanner();
      }
    };

    window.addEventListener(AD_FREE_EVENT, handleAdFreeChange);
    console.log('[AdMobBanner] Registered event listener for:', AD_FREE_EVENT);

    // Check ad-free status every minute
    const interval = setInterval(async () => {
      console.log('[AdMobBanner] Periodic ad-free status check...');
      await checkAndUpdateAdStatus();
    }, 60000); // Check every minute

    // Cleanup on unmount
    return () => {
      console.log('[AdMobBanner] Component unmounting, cleaning up...');
      clearInterval(interval);
      window.removeEventListener(AD_FREE_EVENT, handleAdFreeChange);
      if (Capacitor.getPlatform() === 'android') {
        AdMob.removeBanner().catch(err => console.error('[AdMobBanner] Error removing banner on unmount:', err));
      }
    };
  }, [showBanner, hideBanner, checkAndUpdateAdStatus]);

  // Update CSS custom property for other components to use
  useEffect(() => {
    document.documentElement.style.setProperty('--banner-height', `${bannerHeight}px`);
    console.log('[AdMobBanner] Updated CSS --banner-height to:', bannerHeight);
  }, [bannerHeight]);

  // Return a spacer div to prevent content overlap with banner
  // This spacer reserves space for the banner ad that's positioned at the bottom
  return (
    <div
      className="banner-spacer"
      style={{
        height: `${bannerHeight}px`,
        flexShrink: 0,
        width: '100%',
      }}
    />
  );
}
