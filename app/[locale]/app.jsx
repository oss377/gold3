'use client';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '../../i18n-setup';
import { useState } from 'react';

export default function Home() {
  const t = useTranslations('home');
  const router = useRouter();
  const [locale, setLocale] = useState('en');

  const handleLanguageChange = (newLocale) => {
    setLocale(newLocale);
    router.push(router.pathname, { locale: newLocale });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="mb-4">{t('description')}</p>
      
      <div className="mb-4">
        <label htmlFor="language-select" className="mr-2">
          {useTranslations()('switchLanguage')}:
        </label>
        <select
          id="language-select"
          value={locale}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="border rounded p-1"
        >
          <option value="en">English</option>
          <option value="am">አማርኛ</option>
        </select>
      </div>

      <Link href="/about" className="text-blue-600 hover:underline">
        {useTranslations()('greeting')}
      </Link>
    </div>
  );
}