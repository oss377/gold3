'use client';
import { useTranslations } from 'next-intl';

export default function Login({ onSubmit, toggleAuthType }) {
  const t = useTranslations('auth');

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block text-gray-700 mb-1">{t('emailLabel')}</label>
        <input
          type="email"
          name="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={t('emailPlaceholder')}
        />
      </div>
      <div>
        <label className="block text-gray-700 mb-1">{t('passwordLabel')}</label>
        <input
          type="password"
          name="password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={t('passwordPlaceholder')}
        />
      </div>
      <div className="flex justify-between items-center">
        <label className="flex items-center">
          <input type="checkbox" className="rounded text-indigo-600" />
          <span className="ml-2 text-gray-700">{t('rememberMe')}</span>
        </label>
        <a href="#" className="text-indigo-600 hover:underline">{t('forgotPassword')}</a>
      </div>
      <button
        type="submit"
        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
      >
        {t('loginButton')}
      </button>
      <div className="mt-4 text-center text-gray-600">
        <p>
          {t('noAccount')}{' '}
          <button
            onClick={() => toggleAuthType('register')}
            className="text-indigo-600 hover:underline"
          >
            {t('signUp')}
          </button>
        </p>
      </div>
    </form>
  );
}