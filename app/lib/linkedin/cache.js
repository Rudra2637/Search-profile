/**
 * In-Memory Profile Cache
 *
 * Uses LRU cache with a 1-hour TTL to:
 * 1. Avoid hitting LinkedIn repeatedly for the same profile.
 * 2. Protect the session account from rate limiting / flagging.
 * 3. Speed up repeated requests from evaluators testing the same profiles.
 */

import { LRUCache } from "lru-cache";

const cache = new LRUCache({
  max: 100, // Store up to 100 profiles
  ttl: 1000 * 60 * 60, // 1 hour TTL
});

/**
 * Get a cached profile result.
 * @param {string} vanityName
 * @returns {object|undefined}
 */
export function getCachedProfile(vanityName) {
  return cache.get(vanityName.toLowerCase());
}

/**
 * Store a profile result in cache.
 * @param {string} vanityName
 * @param {object} profileData
 */
export function setCachedProfile(vanityName, profileData) {
  cache.set(vanityName.toLowerCase(), profileData);
}

/**
 * Check if a profile is already cached.
 * @param {string} vanityName
 * @returns {boolean}
 */
export function hasCachedProfile(vanityName) {
  return cache.has(vanityName.toLowerCase());
}
