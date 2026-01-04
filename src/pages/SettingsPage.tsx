import { useState, useEffect } from 'react';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import type { AdMobRewardItem, AdLoadInfo, AdMobError } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { getAdFreeUntil, setAdFreeFor3Hours, formatAdFreeEndTime, getTimeRemaining } from '../utils/adFreeState';
import { trackAdEvent } from '../utils/adReport';
import './SettingsPage.css';

// Custom event to notify banner to hide
export const AD_FREE_EVENT = 'adFreeStatusChanged';

// REAL: ca-app-pub-1622404623822707/8330291785
const REWARDED_AD_ID = 'ca-app-pub-3940256099942544/5224354917'; // TEST

export function SettingsPage() {
  const [systemLanguage] = useState(() => navigator.language || 'en-US');
  const [adFreeUntil, setAdFreeUntilState] = useState<number | null>(null);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [buttonText, setButtonText] = useState('Watch an ad → Remove ads for 3 hours');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Load ad-free status on mount and periodically
  useEffect(() => {
    console.log('[SettingsPage] Component mounted');
    loadAdFreeStatus();

    const statusInterval = setInterval(loadAdFreeStatus, 60000);
    const countdownInterval = setInterval(() => {
      if (adFreeUntil && adFreeUntil > Date.now()) {
        setTimeRemaining(getTimeRemaining(adFreeUntil));
      } else if (adFreeUntil) {
        console.log('[SettingsPage] Ad-free expired, reloading status');
        loadAdFreeStatus();
      }
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(countdownInterval);
    };
  }, [adFreeUntil]);

  const loadAdFreeStatus = async () => {
    console.log('[SettingsPage] loadAdFreeStatus() called');
    const timestamp = await getAdFreeUntil();
    console.log('[SettingsPage] adFreeUntil =', timestamp, timestamp ? `(${new Date(timestamp).toLocaleString()})` : '');
    setAdFreeUntilState(timestamp);
    if (timestamp && timestamp > Date.now()) {
      setTimeRemaining(getTimeRemaining(timestamp));
      console.log('[SettingsPage] User IS ad-free');
    } else {
      console.log('[SettingsPage] User is NOT ad-free');
    }
  };

  const handleWatchRewardedAd = async () => {
    console.log('[Rewarded] ====== BUTTON CLICKED ======');
    
    if (Capacitor.getPlatform() !== 'android') {
      console.log('[Rewarded] Not Android, aborting');
      alert('Rewarded ads only work on Android.');
      return;
    }

    if (isLoadingAd) {
      console.log('[Rewarded] Already loading, ignoring');
      return;
    }

    setIsLoadingAd(true);
    setButtonText('Loading...');

    // Track reward state and listener handles
    let rewarded = false;
    const handles: { remove: () => Promise<void> }[] = [];

    const cleanup = async () => {
      console.log('[Rewarded] Cleaning up listeners...');
      for (const h of handles) {
        try { await h.remove(); } catch (e) { /* ignore */ }
      }
      handles.length = 0;
    };

    const resetButton = () => {
      setIsLoadingAd(false);
      setButtonText('Watch an ad → Remove ads for 3 hours');
    };

    try {
      // Set up listeners BEFORE preparing ad
      console.log('[Rewarded] Setting up listeners...');

      const h1 = await AdMob.addListener(RewardAdPluginEvents.Loaded, async (info: AdLoadInfo) => {
        console.log('[Rewarded] EVENT: Loaded', JSON.stringify(info));
        trackAdEvent('rewardedLoaded');
        try {
          console.log('[Rewarded] Calling showRewardVideoAd()...');
          await AdMob.showRewardVideoAd();
          console.log('[Rewarded] showRewardVideoAd() success');
        } catch (e) {
          console.error('[Rewarded] showRewardVideoAd() error:', e);
          trackAdEvent('rewardedFailed');
          resetButton();
          await cleanup();
          alert('Error showing ad.');
        }
      });
      handles.push(h1);

      const h2 = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, async (err: AdMobError) => {
        console.error('[Rewarded] EVENT: FailedToLoad', JSON.stringify(err));
        trackAdEvent('rewardedFailed');
        resetButton();
        await cleanup();
        alert('Unable to load ad. Check internet connection.');
      });
      handles.push(h2);

      const h3 = await AdMob.addListener(RewardAdPluginEvents.Showed, () => {
        console.log('[Rewarded] EVENT: Showed (ad is visible)');
        trackAdEvent('rewardedShown');
      });
      handles.push(h3);

      const h4 = await AdMob.addListener(RewardAdPluginEvents.Rewarded, async (reward: AdMobRewardItem) => {
        console.log('[Rewarded] EVENT: Rewarded!', JSON.stringify(reward));
        trackAdEvent('rewardedCompleted');
        rewarded = true;

        // Save ad-free timestamp: now + 3 hours
        console.log('[Rewarded] Saving ad-free for 3 hours...');
        await setAdFreeFor3Hours();

        // Update state
        await loadAdFreeStatus();

        // Notify banner to hide
        console.log('[Rewarded] Dispatching AD_FREE_EVENT');
        window.dispatchEvent(new CustomEvent(AD_FREE_EVENT, { detail: { adFree: true } }));

        // Remove banner
        try {
          await AdMob.removeBanner();
          console.log('[Rewarded] Banner removed');
        } catch (e) {
          console.log('[Rewarded] No banner to remove');
        }
      });
      handles.push(h4);

      const h5 = await AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
        console.log('[Rewarded] EVENT: Dismissed');
        trackAdEvent('rewardedDismissed');
        resetButton();
        await cleanup();
        if (rewarded) {
          setTimeout(() => alert('Thank you! Ads removed for 3 hours.'), 100);
        }
      });
      handles.push(h5);

      const h6 = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, async (err: AdMobError) => {
        console.error('[Rewarded] EVENT: FailedToShow', JSON.stringify(err));
        trackAdEvent('rewardedFailed');
        resetButton();
        await cleanup();
        alert('Unable to show ad.');
      });
      handles.push(h6);

      console.log('[Rewarded] Listeners ready. Preparing ad with ID:', REWARDED_AD_ID);

      // Prepare the rewarded ad
      await AdMob.prepareRewardVideoAd({
        adId: REWARDED_AD_ID,
        isTesting: false,
      });

      console.log('[Rewarded] prepareRewardVideoAd() called, waiting for Loaded event...');

    } catch (error) {
      console.error('[Rewarded] ERROR:', error);
      resetButton();
      alert('Error: ' + String(error));
    }
  };

  const handleRateApp = () => {
    window.open('https://play.google.com/store/apps/details?id=app.ultimateconverter', '_blank');
  };

  const handleShareApp = async () => {
    const url = 'https://play.google.com/store/apps/details?id=app.ultimateconverter';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ultimate Unit Converter', text: 'Check it out!', url });
      } catch (e) { console.error(e); }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  const handleSupport = () => {
    window.location.href = 'mailto:ultimateconverterapp@gmail.com';
  };

  const handleLanguage = () => {
    alert('Go to device Settings > Apps > Ultimate Unit Converter > Language');
  };

  const handleTerms = () => {
    window.open('https://comboldam.github.io/Ultimate-Unit-Converter-/terms.html', '_blank');
  };

  const handlePrivacy = () => {
    window.open('https://comboldam.github.io/Ultimate-Unit-Converter-/privacy-policy.html', '_blank');
  };

  const isAdFree = adFreeUntil !== null && adFreeUntil > Date.now();

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-list">
        {/* Ads Section */}
        <div className="settings-section">
          <div className="settings-section-header">Ads</div>
          {isAdFree ? (
            <div className="settings-item" style={{ cursor: 'default' }}>
              <span className="settings-item-title">Ads removed for {timeRemaining}</span>
              <span className="settings-item-value">Until {formatAdFreeEndTime(adFreeUntil!)}</span>
            </div>
          ) : (
            <button
              className="settings-item"
              onClick={handleWatchRewardedAd}
              disabled={isLoadingAd}
            >
              <span className="settings-item-title">{buttonText}</span>
              <span className="settings-item-arrow">›</span>
            </button>
          )}
        </div>

        {/* General Settings Section */}
        <div className="settings-section">
          <div className="settings-section-header">General</div>
          <button className="settings-item" onClick={handleRateApp}>
            <span className="settings-item-title">Rate the App</span>
            <span className="settings-item-arrow">›</span>
          </button>

          <button className="settings-item" onClick={handleShareApp}>
            <span className="settings-item-title">Share App</span>
            <span className="settings-item-arrow">›</span>
          </button>

          <button className="settings-item" onClick={handleSupport}>
            <span className="settings-item-title">Support</span>
            <span className="settings-item-value">ultimateconverterapp@gmail.com</span>
            <span className="settings-item-arrow">›</span>
          </button>

          <button className="settings-item" onClick={handleLanguage}>
            <span className="settings-item-title">Language</span>
            <span className="settings-item-value">{systemLanguage}</span>
            <span className="settings-item-arrow">›</span>
          </button>

          <button className="settings-item" onClick={handleTerms}>
            <span className="settings-item-title">Terms of Use</span>
            <span className="settings-item-arrow">›</span>
          </button>

          <button className="settings-item" onClick={handlePrivacy}>
            <span className="settings-item-title">Privacy Policy</span>
            <span className="settings-item-arrow">›</span>
          </button>

          <p className="settings-legal-text">
            By using this app, you agree to our Privacy Policy and Terms of Use.
          </p>
        </div>
      </div>
    </div>
  );
}
