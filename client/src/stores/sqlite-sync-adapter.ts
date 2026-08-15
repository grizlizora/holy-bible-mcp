import { StateStorage } from 'zustand/middleware';

let syncTimeout: any = null;

function saveSettingsToApi(value: string) {
  if (typeof window === 'undefined') return;
  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(() => {
    try {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: value }),
        keepalive: true
      }).catch((err) => {
        console.warn('[STORAGE] Background sync to SQLite disk failed:', err?.message);
      });
    } catch (_) {}
  }, 300);
}

export const customSettingsStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const direct = localStorage.getItem(name);
      if (direct) {
        return direct;
      }

      // Backward compatibility: automatically scan and migrate legacy stores
      const legacyKeys = [
        'liquid-ai-settings-v7',
        'liquid-ai-settings-v6',
        'liquid-ai-settings-v5',
        'liquid-ai-settings-v4',
        'liquid-ai-settings-v3',
        'liquid-ai-settings-v2',
        'liquid-ai-settings-v1',
        'liquid-ai-settings',
        'holy-bible-settings',
        'holy-settings'
      ];

      for (const key of legacyKeys) {
        const legacyVal = localStorage.getItem(key);
        if (legacyVal) {
          try {
            const parsed = JSON.parse(legacyVal);
            const state = parsed?.state || parsed;
            if (state && (state.cloudProviders || state.localProviders || state.selectedModel)) {
              localStorage.setItem(name, legacyVal);
              return legacyVal;
            }
          } catch {}
        }
      }
    } catch {}
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(name, value);
      // 💾 Dual-layer debounced background SQLite disk persistence
      saveSettingsToApi(value);
    } catch (e) {
      console.warn('[STORAGE] Failed to save settings to localStorage:', e);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(name);
    } catch {}
  }
};
