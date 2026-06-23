import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { colorScheme } from 'nativewind';

// 'system' follows the phone appearance; otherwise a forced app theme.
export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'pl-theme';

// Drive the change through NativeWind so both inline `isDark` styles and
// Tailwind `dark:` classes stay in sync.
function applyScheme(pref: ThemePreference) {
  colorScheme.set(pref);
}

interface ThemeState {
  preference: ThemePreference;
  isLoaded: boolean;
  // Hydrate the stored preference and apply it to NativeWind.
  load: () => Promise<void>;
  // Persist + apply a new preference.
  setPreference: (pref: ThemePreference) => Promise<void>;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  preference: 'system',
  isLoaded: false,

  load: async () => {
    let pref: ThemePreference = 'system';
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        pref = raw;
      }
    } catch {
      // ignore — fall back to system
    }
    applyScheme(pref);
    set({ preference: pref, isLoaded: true });
  },

  setPreference: async (pref) => {
    applyScheme(pref);
    set({ preference: pref });
    try {
      await SecureStore.setItemAsync(KEY, pref);
    } catch {
      // ignore persistence failures
    }
  },
}));
