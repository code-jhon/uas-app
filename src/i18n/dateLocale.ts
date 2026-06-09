import { es, enUS, ptBR, type Locale } from 'date-fns/locale';
import i18n from './index';

const DATE_LOCALES: Record<string, Locale> = {
  es,
  en: enUS,
  pt: ptBR,
};

const NUMBER_LOCALE_TAGS: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR',
};

/** date-fns Locale for the active app language (for use with format()). */
export function getDateLocale(): Locale {
  return DATE_LOCALES[i18n.language] ?? es;
}

/** BCP-47 tag for the active app language (for Number/Date toLocaleString). */
export function getNumberLocaleTag(): string {
  return NUMBER_LOCALE_TAGS[i18n.language] ?? 'es-CO';
}
