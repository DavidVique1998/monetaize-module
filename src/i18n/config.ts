import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { cookies } from 'next/headers';
import esMessages from '../messages/es.json';
import enMessages from '../messages/en.json';

const messages = {
  es: esMessages,
  en: enMessages,
};

export default getRequestConfig(async () => {
  // Obtener locale de las cookies o usar default
  const cookieStore = await cookies();
  let locale = (cookieStore.get('NEXT_LOCALE')?.value || routing.defaultLocale) as 'es' | 'en';

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale as 'es' | 'en';
  }

  return {
    locale,
    messages: messages[locale]
  };
});

