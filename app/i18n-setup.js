import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

// Define supported locales
export const locales = ['en', 'am'];
export const defaultLocale = 'en';

// Routing configuration
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always' // Prefix URLs with locale (e.g., /en/about)
});

// Create navigation utilities
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

// Translation files (for reference, create these in /messages directory)
export const translationFiles = {
  en: {
    greeting: 'Hello, welcome to our app!',
    switchLanguage: 'Switch language',
    home: {
      title: 'Home',
      description: 'Welcome to the homepage'
    }
  },
  am: {
    greeting: 'ሰላም፣ ወደ መተግበሪያችን እንኳን ደህና መጡ!',
    switchLanguage: 'ቋንቋ ቀይር',
    home: {
      title: 'መነሻ',
      description: 'ወደ መነሻ ገፅ እንኳን ደህና መጡ'
    }
  }
};