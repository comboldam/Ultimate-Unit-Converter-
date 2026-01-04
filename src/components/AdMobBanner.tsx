import { useEffect, useState, useCallback, useRef } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import type { BannerAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { isAdFree } from '../utils/adFreeState';
import { AD_FREE_EVENT } from '../pages/SettingsPage';
import { trackAdEvent } from '../utils/adReport';

// REAL: ca-app-pub-1622404623822707/7041260848
const BANNER_AD_ID = 'ca-app-pub-3940256099942544/6300978111'; // TEST

export function AdMobBanner() {
  const [bannerHeight, setBannerHeight] = useState(50);
  const [, setShouldShowAds] = useState(true);
  const bannerVisibleRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAdaptiveBannerHeight = () => {
    const width = window.innerWidth;
    const dp = width / window.devicePixelRatio;
    if (dp >= 728) {
      return 90;
    } else {
      return 32;
    }
  };

  const showBanner = useCallback(async (isRetry = false) => {
    // Check ad-free status before showing
    const adFreeStatus = await isAdFree();
    if (adFreeStatus) {
      console.log('[AdMobBanner] User is ad-free, not showing banner');
      bannerVisibleRef.current = false;
      setBannerHeight(0);
      return false;
    }

    console.log(`[AdMobBanner] ${isRetry ? '🔄 Retrying' : 'Attempting'} to show banner ad...`);
    
    try {
      // Remove existing banner first
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
      setBannerHeight(getAdaptiveBannerHeight());
      
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
      
      // Schedule retry after 10 seconds
      if (!retryTimeoutRef.current) {
        console.log('[AdMobBanner] Scheduling retry in 10 seconds...');
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          showBanner(true);
        }, 10000);
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
      setBannerHeight(0);
    } catch (error) {
      console.error('[AdMobBanner] Error removing banner:', error);
    }
  }, []);

  const ensureBannerVisible = useCallback(async () => {
    // Check ad-free first
    const adFreeStatus = await isAdFree();
    
    if (adFreeStatus) {
      console.log('[AdMobBanner] User is ad-free, ensuring banner hidden');
      if (bannerVisibleRef.current) {
        await hideBanner();
      }
      setShouldShowAds(false);
      return;
    }
    
    setShouldShowAds(true);
    
    // Always try to show banner on resume/check
    console.log('[AdMobBanner] Ensuring banner is visible...');
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
      console.log('[AdMobBanner] Initial ad-free status:', adFreeStatus);
      setShouldShowAds(!adFreeStatus);

      if (adFreeStatus) {
        console.log('[AdMobBanner] User is ad-free on init, not showing banner');
        setBannerHeight(0);
        return;
      }

      await showBanner();
    };

    initializeBanner();

    // Listen for app resume - re-show banner
    const appStateListener = App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        console.log('[AdMobBanner] 📱 App resumed, ensuring banner visible...');
        // Small delay to let app fully resume
        setTimeout(() => {
          ensureBannerVisible();
        }, 500);
      }
    });

    // Listen for ad-free status changes
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

    // Periodic check every 30 seconds - re-show if needed
    const interval = setInterval(async () => {
      const adFreeStatus = await isAdFree();
      
      if (adFreeStatus) {
        if (bannerVisibleRef.current) {
          console.log('[AdMobBanner] Periodic check: ad-free, hiding banner');
          await hideBanner();
        }
        setShouldShowAds(false);
        return;
      }
      
      // If not ad-free and banner not visible, try to show
      if (!bannerVisibleRef.current) {
        console.log('[AdMobBanner] Periodic check: banner not visible, re-showing...');
        await showBanner(true);
      }
    }, 30000);

    // Cleanup
    return () => {
      console.log('[AdMobBanner] Component unmounting, cleaning up...');
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      window.removeEventListener(AD_FREE_EVENT, handleAdFreeChange);
      appStateListener.then(listener => listener.remove());
      if (Capacitor.getPlatform() === 'android') {
        AdMob.removeBanner().catch(() => {});
      }
    };
  }, [showBanner, hideBanner, ensureBannerVisible]);

  // Update CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--banner-height', `${bannerHeight}px`);
  }, [bannerHeight]);

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
