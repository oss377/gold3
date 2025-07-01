import { createIntlMiddleware } from 'next-intl/server';
import { routing } from './i18n-setup';

export default createIntlMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};