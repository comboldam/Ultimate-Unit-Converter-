import { useEffect, useCallback, useRef } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { isAdFree } from '../utils/adFreeState';
import { AD_FREE_EVENT } from '../pages/SettingsPage';
import { trackAdEvent } from '../utils/adReport';

// REAL: ca-app-pub-1622404623822707/7041260848
const BANNER_AD_ID = 'ca-app-pub-3940256099942544/6300978111'; // TEST

// Fixed banner height - calculated once, never changes
const FIXED_BANNER_HEIGHT = 50; // Standard mobile banner height

// Event dispatched when interstitial/app-open ads close
export const FULLSCREEN_AD_CLOSED_EVENT = 'fullscreenAdClosed';

export function AdMobBanner() {
  const bannerVisibleRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdFreeRef = useRef(false);

  const showBanner = useCallback(async (isRetry = false) => {
    // Check ad-free status before showing
    const adFreeStatus = await isAdFree();
    isAdFreeRef.current = adFreeStatus;
    
    if (adFreeStatus) {
      console.log('[AdMobBanner] User is ad-free, not showing banner');
      bannerVisibleRef.current = false;
      return false;
    }

    console.log(`[AdMobBanner] ${isRetry ? '🔄 Retrying' : 'Attempting'} to show banner ad...`);
    
    try {
      // Remove existing banner first (silently)
      await AdMob.removeBanner().catch(() => {});

      const options: BannerAdOptions = {
        adId: BANNER_AD_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true,
      };

      await AdMob.showBanner(options);
      console.log('[AdMobBanner] ✅ Banner shown successfully');
      trackAdEvent('bannerLoaded');
      trackAdEvent('bannerShown');
      
      bannerVisibleRef.current = true;
      
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      return true;
    } catch (error) {
      console.error('[AdMobBanner] ❌ Error showing banner:', error);
      trackAdEvent('bannerFailed');
      bannerVisibleRef.current = false;
      
      // Schedule retry after 1 second (fast retry)
      if (!retryTimeoutRef.current) {
        console.log('[AdMobBanner] Scheduling retry in 1 second...');
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          showBanner(true);
        }, 1000);
      }
      
      return false;
    }
  }, []);

  const hideBanner = useCallback(async () => {
    console.log('[AdMobBanner] Hiding banner ad...');
    
    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    try {
      await AdMob.removeBanner();
      console.log('[AdMobBanner] ✅ Banner removed successfully');
      bannerVisibleRef.current = false;
    } catch (error) {
      console.error('[AdMobBanner] Error removing banner:', error);
    }
  }, []);

  const refreshBanner = useCallback(async () => {
    // Check ad-free first
    const adFreeStatus = await isAdFree();
    isAdFreeRef.current = adFreeStatus;
    
    if (adFreeStatus) {
      console.log('[AdMobBanner] User is ad-free, not refreshing banner');
      if (bannerVisibleRef.current) {
        await hideBanner();
      }
      return;
    }
    
    console.log('[AdMobBanner] Refreshing banner...');
    await showBanner();
  }, [showBanner, hideBanner]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') {
      console.log('[AdMobBanner] Not on Android, skipping banner');
      return;
    }

    console.log('[AdMobBanner] Component mounted, initializing...');

    // Initial banner show
    const initializeBanner = async () => {
      const adFreeStatus = await isAdFree();
      isAdFreeRef.current = adFreeStatus;
      console.log('[AdMobBanner] Initial ad-free status:', adFreeStatus);

      if (!adFreeStatus) {
        await showBanner();
      }
    };

    initializeBanner();

    // Listen for app resume - refresh banner
    const appStateListener = App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive && !isAdFreeRef.current) {
        console.log('[AdMobBanner] 📱 App resumed, refreshing banner...');
        // Quick refresh after resume
        setTimeout(() => refreshBanner(), 300);
      }
    });

    // Listen for ad-free status changes (rewarded ad watched)
    const handleAdFreeChange = async (event: Event) => {
      const customEvent = event as CustomEvent<{ adFree: boolean }>;
      console.log('[AdMobBanner] Received ad-free status change:', customEvent.detail);
      
      if (customEvent.detail?.adFree) {
        console.log('[AdMobBanner] User earned reward, hiding banner');
        isAdFreeRef.current = true;
        await hideBanner();
      }
    };

    // Listen for fullscreen ad closed - refresh banner immediately
    const handleFullscreenAdClosed = () => {
      console.log('[AdMobBanner] Fullscreen ad closed, refreshing banner in 500ms...');
      setTimeout(() => refreshBanner(), 500);
    };

    window.addEventListener(AD_FREE_EVENT, handleAdFreeChange);
    window.addEventListener(FULLSCREEN_AD_CLOSED_EVENT, handleFullscreenAdClosed);

    // Periodic check every 10 seconds - re-show if needed
    const interval = setInterval(async () => {
      const adFreeStatus = await isAdFree();
      isAdFreeRef.current = adFreeStatus;
      
      if (adFreeStatus) {
        if (bannerVisibleRef.current) {
          console.log('[AdMobBanner] Periodic: ad-free, hiding banner');
          await hideBanner();
        }
        return;
      }
      
      // If not ad-free and banner not visible, refresh
      if (!bannerVisibleRef.current) {
        console.log('[AdMobBanner] Periodic: banner not visible, refreshing...');
        await showBanner(true);
      }
    }, 10000);

    // Cleanup
    return () => {
      console.log('[AdMobBanner] Component unmounting, cleaning up...');
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      window.removeEventListener(AD_FREE_EVENT, handleAdFreeChange);
      window.removeEventListener(FULLSCREEN_AD_CLOSED_EVENT, handleFullscreenAdClosed);
      appStateListener.then(listener => listener.remove());
      if (Capacitor.getPlatform() === 'android') {
        AdMob.removeBanner().catch(() => {});
      }
    };
  }, [showBanner, hideBanner, refreshBanner]);

  // Fixed height spacer - never changes size
  return (
    <div
      className="banner-spacer"
      style={{
        height: `${FIXED_BANNER_HEIGHT}px`,
        flexShrink: 0,
        width: '100%',
      }}
    />
  );
}
