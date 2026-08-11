// Safe storage utility with in-memory fallback for iOS Safari Private Browsing & restricted storage contexts

const memoryStorage = new Map();

export const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Fallback to in-memory store in case of SecurityError / Safari private mode
    }
    return memoryStorage.get(key) ?? null;
  },

  setItem: (key, value) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      // Fallback to in-memory store in case of QuotaExceededError / SecurityError
    }
    memoryStorage.set(key, String(value));
  },

  removeItem: (key) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      // Ignore
    }
    memoryStorage.delete(key);
  },

  clear: () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
        return;
      }
    } catch (e) {
      // Ignore
    }
    memoryStorage.clear();
  }
};

export default safeStorage;
