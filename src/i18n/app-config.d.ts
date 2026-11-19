import type messages from '../../messages/en.json';
import type { routing } from './routing';

// Type-checks message keys and locales in `useTranslations` and friends.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
