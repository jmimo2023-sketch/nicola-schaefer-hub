/**
 * Analytics Cache Service
 * Implements stale-while-revalidate pattern for Meta API data
 */

import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

interface AnalyticsData {
  summary: {
    total_views: number;
    avg_er: number;
    total_follows: number;
    total_saves: number;
    total_stories: number;
    story_retention: number;
  };
  top_reels: Array<{
    desc: string;
    date: string;
    views: number;
    er: number;
    follows: number;
  }>;
  by_month: Array<{ name: string; views: number }>;
  by_hour: Array<{ hour: string; views: number }>;
}

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const STALE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Get cached analytics data with stale-while-revalidate
 */
export async function getCachedAnalytics(): Promise<CacheEntry<AnalyticsData> | null> {
  try {
    const cacheDoc = await getDoc(doc(db, 'cache', 'analytics'));

    if (!cacheDoc.exists()) {
      return null;
    }

    const cached = cacheDoc.data() as CacheEntry<AnalyticsData>;
    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if data is stale
    const isStale = age > STALE_DURATION;

    return {
      ...cached,
      isStale
    };
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Set cached analytics data
 */
export async function setCachedAnalytics(data: AnalyticsData): Promise<void> {
  try {
    const entry: CacheEntry<AnalyticsData> = {
      data,
      timestamp: Date.now(),
      isStale: false
    };

    await setDoc(doc(db, 'cache', 'analytics'), {
      ...entry,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Check if cache needs refresh
 */
export function isCacheStale(entry: CacheEntry<AnalyticsData> | null): boolean {
  if (!entry) return true;
  return entry.isStale || (Date.now() - entry.timestamp > CACHE_DURATION);
}

/**
 * Get analytics with fallback to cache
 */
export async function getAnalyticsWithFallback(
  fetcher: () => Promise<AnalyticsData>
): Promise<{ data: AnalyticsData | null; isStale: boolean; source: 'api' | 'cache' }> {
  // Try cache first
  const cached = await getCachedAnalytics();

  if (cached && !isCacheStale(cached)) {
    // Cache is fresh, return it
    return {
      data: cached.data,
      isStale: false,
      source: 'cache'
    };
  }

  // Try to fetch fresh data
  try {
    const freshData = await fetcher();
    await setCachedAnalytics(freshData);

    return {
      data: freshData,
      isStale: false,
      source: 'api'
    };
  } catch (error) {
    // Fetch failed, use stale cache if available
    console.error('Analytics fetch failed, using cache:', error);

    if (cached) {
      return {
        data: cached.data,
        isStale: true,
        source: 'cache'
      };
    }

    // No cache available
    return {
      data: null,
      isStale: true,
      source: 'cache'
    };
  }
}

/**
 * Clear analytics cache
 */
export async function clearAnalyticsCache(): Promise<void> {
  try {
    await setDoc(doc(db, 'cache', 'analytics'), {
      clearedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Get time until cache expires
 */
export function getCacheTTL(entry: CacheEntry<AnalyticsData> | null): number {
  if (!entry) return 0;
  const age = Date.now() - entry.timestamp;
  return Math.max(0, CACHE_DURATION - age);
}