import { Preferences } from '@capacitor/preferences';

const AD_FREE_UNTIL_KEY = 'adFreeUntil';

/**
 * Get the timestamp when ad-free period ends
 * @returns timestamp in milliseconds, or null if not ad-free
 */
export async function getAdFreeUntil(): Promise<number | null> {
  try {
    console.log('[adFreeState] Getting ad-free timestamp...');
    const { value } = await Preferences.get({ key: AD_FREE_UNTIL_KEY });
    console.log('[adFreeState] Raw value from storage:', value);
    
    if (!value) {
      console.log('[adFreeState] No value found, user is not ad-free');
      return null;
    }

    const timestamp = parseInt(value, 10);
    if (isNaN(timestamp)) {
      console.log('[adFreeState] Invalid timestamp value, clearing');
      await clearAdFree();
      return null;
    }

    const now = Date.now();
    console.log('[adFreeState] Current time:', now, '| Ad-free until:', timestamp);
    
    // Check if timestamp is in the future
    if (timestamp > now) {
      const remainingMs = timestamp - now;
      const remainingMin = Math.floor(remainingMs / 60000);
      console.log('[adFreeState] ✅ User is ad-free for', remainingMin, 'more minutes');
      return timestamp;
    }

    // Expired, clean up
    console.log('[adFreeState] Ad-free period has expired, clearing');
    await clearAdFree();
    return null;
  } catch (error) {
    console.error('[adFreeState] ❌ Error reading ad-free state:', error);
    return null;
  }
}

/**
 * Set ad-free period for 3 hours from now
 */
export async function setAdFreeFor3Hours(): Promise<void> {
  try {
    const threeHoursInMs = 3 * 60 * 60 * 1000; // 10800000 ms
    const now = Date.now();
    const adFreeUntil = now + threeHoursInMs;
    
    console.log('[adFreeState] Setting ad-free period:');
    console.log('[adFreeState]   Current time:', now);
    console.log('[adFreeState]   3 hours in ms:', threeHoursInMs);
    console.log('[adFreeState]   Ad-free until:', adFreeUntil);
    console.log('[adFreeState]   Until (readable):', new Date(adFreeUntil).toLocaleString());
    
    await Preferences.set({
      key: AD_FREE_UNTIL_KEY,
      value: adFreeUntil.toString(),
    });
    
    console.log('[adFreeState] ✅ Ad-free period saved successfully');
  } catch (error) {
    console.error('[adFreeState] ❌ Error setting ad-free state:', error);
    throw error;
  }
}

/**
 * Clear ad-free state
 */
export async function clearAdFree(): Promise<void> {
  try {
    console.log('[adFreeState] Clearing ad-free state...');
    await Preferences.remove({ key: AD_FREE_UNTIL_KEY });
    console.log('[adFreeState] ✅ Ad-free state cleared');
  } catch (error) {
    console.error('[adFreeState] ❌ Error clearing ad-free state:', error);
  }
}

/**
 * Check if currently in ad-free period
 */
export async function isAdFree(): Promise<boolean> {
  const adFreeUntil = await getAdFreeUntil();
  const result = adFreeUntil !== null;
  console.log('[adFreeState] isAdFree() =', result);
  return result;
}

/**
 * Format the ad-free end time as a readable string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns formatted time string like "3:45 PM"
 */
export function formatAdFreeEndTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get time remaining until ad-free period ends
 * @param timestamp - Unix timestamp in milliseconds
 * @returns formatted string like "2h 15m" or "45m" or "5m"
 */
export function getTimeRemaining(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;

  if (diff <= 0) return '0m';

  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
