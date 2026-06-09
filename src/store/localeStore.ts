import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import i18n, { AppLanguage, resolveDeviceLanguage } from '../i18n';

// 'system' follows the phone language; otherwise an explicit app language.
export type LanguagePreference = 'system' | AppLanguage;

const KEY = 'pl-language';

function applyToI18n(pref: LanguagePreference) {
  const lng = pref === 'system' ? resolveDeviceLanguage() : pref;
  if (i18n.language !== lng) {
    i18n.changeLanguage(lng);
  }
}

interface LocaleState {
  preference: LanguagePreference;
  isLoaded: boolean;
  // Hydrate the stored preference and apply it to i18next.
  load: () => Promise<void>;
  // Persist + apply a new preference.
  setPreference: (pref: LanguagePreference) => Promise<void>;
}

export const useLocaleStore = create<LocaleState>()((set) => ({
  preference: 'system',
  isLoaded: false,

  load: async () => {
    let pref: LanguagePreference = 'system';
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw === 'es' || raw === 'en' || raw === 'pt' || raw === 'system') {
        pref = raw;
      }
    } catch {
      // ignore — fall back to system
    }
    applyToI18n(pref);
    set({ preference: pref, isLoaded: true });
  },

  setPreference: async (pref) => {
    applyToI18n(pref);
    set({ preference: pref });
    try {
      await SecureStore.setItemAsync(KEY, pref);
    } catch {
      // ignore persistence failures
    }
  },
}));
