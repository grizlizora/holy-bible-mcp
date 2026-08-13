import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

import uk from '../../messages/uk.json';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

const dictionaries: Record<string, any> = { uk, en, ru };

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: dictionaries[locale] || uk
  };
});
