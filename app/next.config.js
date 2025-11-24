/** @type {import('next').NextConfig} */
const { routing } = require('./i18n-setup');

const nextConfig = {
  i18n: {
    locales: routing.locales,
    defaultLocale: routing.defaultLocale,
    localeDetection: true
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
};

module.exports = nextConfig;