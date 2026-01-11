import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'tr'],

    // Used when no locale matches
    defaultLocale: 'tr',

    // Always show the locale prefix in the URL (e.g. /tr/products)
    // Options: 'always' | 'as-needed' | 'never'
    localePrefix: 'always'
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(tr|en)/:path*']
};
