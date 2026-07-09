import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import es from './locales/es';
import en from './locales/en';
import pt from './locales/pt';

export const SUPPORTED_LANGUAGES = ['es', 'en', 'pt'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: AppLanguage = 'es';

/** Resolve the device language to a supported app language, or fall back. */
export function resolveDeviceLanguage(): AppLanguage {
  try {
    const codes = getLocales().map((l) => l.languageCode?.toLowerCase());
    for (const code of codes) {
      if (code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code)) {
        return code as AppLanguage;
      }
    }
  } catch {
    // expo-localization may be unavailable in some environments
  }
  return FALLBACK_LANGUAGE;
}

// eslint-disable-next-line import/no-named-as-default-member -- `.use()` is the intended i18next chaining API, not the i18next named `use` export
i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
    },
    lng: resolveDeviceLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
