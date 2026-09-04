/**
 * expiringStorage.js
 * 
 * Provides TTL-aware localStorage helpers with a default 1-hour expiration (3600000 ms).
 * Ensures client-side caches automatically invalidate after 1 hour, deferring to the 
 * database as the single source of truth.
 * Also automatically purges any legacy section or URL keys from localStorage.
 */

export const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Store a value in localStorage with an expiration timestamp.
 * @param {string} key 
 * @param {any} value 
 * @param {number} [ttlMs=3600000] - Time to live in ms (default: 1 hour)
 */
export function setExpiringItem(key, value, ttlMs = ONE_HOUR_MS) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const envelope = {
      __expiring: true,
      data: value,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch (e) {
    console.warn(`[expiringStorage] Failed to set ${key}:`, e);
  }
}

/**
 * Retrieve a value from localStorage, automatically expiring and removing it
 * if it is older than 1 hour (or its custom TTL).
 * @param {string} key 
 * @param {any} [defaultValue=null] 
 * @returns {any}
 */
export function getExpiringItem(key, defaultValue = null) {
  if (typeof window === "undefined" || !window.localStorage) return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;

    // Purge forbidden URL or active_section keys immediately
    if (
      key === "forge_launch_active_section" ||
      key === "forge_launch_active_section_prev" ||
      key.includes("_url")
    ) {
      window.localStorage.removeItem(key);
      return defaultValue;
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.__expiring === true && "timestamp" in parsed) {
      const now = Date.now();
      const age = now - parsed.timestamp;
      const maxAge = typeof parsed.ttl === "number" ? parsed.ttl : ONE_HOUR_MS;
      if (age > maxAge) {
        // Expired (> 1 hour): Remove from localStorage and return fallback
        window.localStorage.removeItem(key);
        return defaultValue;
      }
      return parsed.data !== undefined ? parsed.data : defaultValue;
    }

    // Legacy un-enveloped JSON value: wrap it with fresh 1-hour expiration so it automatically expires
    if (parsed !== null && parsed !== undefined) {
      setExpiringItem(key, parsed, ONE_HOUR_MS);
      return parsed;
    }

    return defaultValue;
  } catch {
    // String or non-JSON value
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        setExpiringItem(key, raw, ONE_HOUR_MS);
      }
      return raw ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

/**
 * Remove an item from localStorage.
 * @param {string} key 
 */
export function removeExpiringItem(key) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch (e) {}
}

/**
 * Sweep and clean up all expired forge_* items and legacy URL/section storage keys.
 */
export function cleanupExpiredForgeStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    // 1. Explicitly purge any keys that store sections, URLs, or redirection flags
    const forbiddenKeys = [
      "forge_launch_active_section",
      "forge_launch_active_section_prev",
      "forge_launch_last_url",
      "forge_redirect_url",
      "forge_last_route",
    ];
    forbiddenKeys.forEach((k) => window.localStorage.removeItem(k));

    // 2. Iterate through all localStorage keys starting with forge_
    const now = Date.now();
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("forge_")) continue;

      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && parsed.__expiring === true && "timestamp" in parsed) {
          const age = now - parsed.timestamp;
          const maxAge = typeof parsed.ttl === "number" ? parsed.ttl : ONE_HOUR_MS;
          if (age > maxAge) {
            keysToRemove.push(key);
          }
        }
      } catch {
        // Not a JSON envelope
      }
    }

    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch (e) {
    console.warn("[expiringStorage] Cleanup error:", e);
  }
}

// Automatically sweep and purge expired/forbidden keys on load
cleanupExpiredForgeStorage();
