
import { NextIntlClientProvider } from 'next-intl';
import localFont from 'next/font/local';

// Load Noto Serif Ethiopic font for Amharic support
const notoEthiopic = localFont({
  src: '../../public/fonts/NotoSerifEthiopic-Regular.woff2',
  variable: '--font-noto-ethiopic',
  display: 'swap',
});

export default async function RootLayout({ children, params }) {
  // Validate and extract locale
  const locale = params?.locale || 'en'; // Fallback to 'en' if locale is undefined

  // Dynamically import messages for the current locale
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to English messages
    messages = (await import('../../messages/en.json')).default;
  }

  return (
    <html lang={locale}>
      <head>
        <title>Gold Gym and Fitness Center</title>
        <meta name="description" content="Your complete fitness solution with professional guidance and workout plans." />
      </head>
      <body className={`${notoEthiopic.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}