/**
 * Ad Report - Tracks ad impressions and events
 * Saved in localStorage, logged to console on app start
 * For debugging purposes only - not shown to users
 */

const AD_REPORT_KEY = 'adReport';

export interface AdReportData {
  // Banner
  bannerLoaded: number;
  bannerShown: number;
  bannerFailed: number;
  
  // Rewarded
  rewardedLoaded: number;
  rewardedShown: number;
  rewardedCompleted: number;
  rewardedDismissed: number;
  rewardedFailed: number;
  
  // Navigation Interstitial
  interstitialLoaded: number;
  interstitialShown: number;
  interstitialDismissed: number;
  interstitialFailed: number;
  interstitialSkippedChance: number; // Didn't pass 10% check
  interstitialSkippedAdFree: number; // User was ad-free
  
  // Timestamps
  lastReset: string;
  lastUpdated: string;
}

const defaultReport: AdReportData = {
  bannerLoaded: 0,
  bannerShown: 0,
  bannerFailed: 0,
  
  rewardedLoaded: 0,
  rewardedShown: 0,
  rewardedCompleted: 0,
  rewardedDismissed: 0,
  rewardedFailed: 0,
  
  interstitialLoaded: 0,
  interstitialShown: 0,
  interstitialDismissed: 0,
  interstitialFailed: 0,
  interstitialSkippedChance: 0,
  interstitialSkippedAdFree: 0,
  
  lastReset: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
};

/**
 * Get current ad report from localStorage
 */
export function getAdReport(): AdReportData {
  try {
    const stored = localStorage.getItem(AD_REPORT_KEY);
    if (stored) {
      return { ...defaultReport, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('[AdReport] Error reading report:', e);
  }
  return { ...defaultReport };
}

/**
 * Save ad report to localStorage
 */
function saveAdReport(report: AdReportData): void {
  try {
    report.lastUpdated = new Date().toISOString();
    localStorage.setItem(AD_REPORT_KEY, JSON.stringify(report));
  } catch (e) {
    console.error('[AdReport] Error saving report:', e);
  }
}

/**
 * Increment a specific counter in the ad report
 */
export function trackAdEvent(event: keyof Omit<AdReportData, 'lastReset' | 'lastUpdated'>): void {
  const report = getAdReport();
  report[event]++;
  saveAdReport(report);
  console.log(`[AdReport] 📊 ${event}: ${report[event]}`);
}

/**
 * Reset all ad counters
 */
export function resetAdReport(): void {
  const report = { ...defaultReport, lastReset: new Date().toISOString() };
  saveAdReport(report);
  console.log('[AdReport] 🔄 Report reset');
}

/**
 * Print full ad report to console
 */
export function logAdReport(): void {
  const report = getAdReport();
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║              📊 AD REPORT (Debug)                ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║ BANNER ADS                                       ║');
  console.log(`║   Loaded: ${String(report.bannerLoaded).padEnd(6)} Shown: ${String(report.bannerShown).padEnd(6)} Failed: ${report.bannerFailed}`.padEnd(51) + '║');
  console.log('║                                                  ║');
  console.log('║ REWARDED ADS                                     ║');
  console.log(`║   Loaded: ${String(report.rewardedLoaded).padEnd(6)} Shown: ${String(report.rewardedShown).padEnd(6)} Completed: ${report.rewardedCompleted}`.padEnd(51) + '║');
  console.log(`║   Dismissed: ${String(report.rewardedDismissed).padEnd(5)} Failed: ${report.rewardedFailed}`.padEnd(51) + '║');
  console.log('║                                                  ║');
  console.log('║ INTERSTITIAL ADS (Navigation)                    ║');
  console.log(`║   Loaded: ${String(report.interstitialLoaded).padEnd(6)} Shown: ${String(report.interstitialShown).padEnd(6)} Dismissed: ${report.interstitialDismissed}`.padEnd(51) + '║');
  console.log(`║   Failed: ${String(report.interstitialFailed).padEnd(6)} Skipped (chance): ${report.interstitialSkippedChance}`.padEnd(51) + '║');
  console.log(`║   Skipped (ad-free): ${report.interstitialSkippedAdFree}`.padEnd(51) + '║');
  console.log('║                                                  ║');
  console.log(`║ Last Reset: ${report.lastReset.substring(0, 19)}`.padEnd(51) + '║');
  console.log(`║ Last Updated: ${report.lastUpdated.substring(0, 19)}`.padEnd(51) + '║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
}

/**
 * Get summary string for quick display
 */
export function getAdSummary(): string {
  const r = getAdReport();
  return `Ads: banner ${r.bannerShown}, interstitial ${r.interstitialShown}, rewarded ${r.rewardedCompleted}`;
}
