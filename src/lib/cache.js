// Ultra-fast in-memory + localStorage hybrid client cache for PWA 0ms instant page transitions
const STORAGE_PREFIX = 'ft_cache_';

class SimpleCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    // 1. Check in-memory cache first (0ms)
    const entry = this.store.get(key);
    if (entry) {
      if (Date.now() <= entry.expiry) {
        return entry.data;
      }
      this.store.delete(key);
    }

    // 2. Fall back to persistent storage for instant cold starts
    try {
      const serialized = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        if (parsed && parsed.expiry && Date.now() <= parsed.expiry) {
          // Re-hydrate memory store
          this.store.set(key, parsed);
          return parsed.data;
        }
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      }
    } catch {
      // Ignore localStorage errors (e.g. quota, private mode)
    }

    return null;
  }

  set(key, data, ttlMs = 120000) {
    const entry = {
      data,
      expiry: Date.now() + ttlMs,
    };

    // Set memory store
    this.store.set(key, entry);

    // Persist to storage safely
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // Ignore if localStorage is full
    }
  }

  delete(key) {
    this.store.delete(key);
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {}
  }

  invalidatePrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    try {
      const fullPrefix = `${STORAGE_PREFIX}${prefix}`;
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(fullPrefix)) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }

  clear() {
    this.store.clear();
    try {
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

export const fastCache = new SimpleCache();
