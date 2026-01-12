import createMiddleware from 'next-intl/middleware';
import { routing } from './navigation';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request) {
    const pathname = request.nextUrl.pathname;
    const host = request.headers.get('host') || '';

    // DEVELOPMENT MODE: No geo-restrictions on localhost or Vercel preview
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isPreview = host.includes('vercel.app') && !host.includes('grohn'); // Preview deployments

    if (isLocalhost || isPreview) {
        // Allow free navigation between /tr and /en
        return intlMiddleware(request);
    }

    // PRODUCTION MODE: IP-based geo-routing
    const country = request.geo?.country || request.headers.get('x-vercel-ip-country') || 'TR';
    const isTRUser = country === 'TR';
    const isTrPath = pathname.startsWith('/tr');
    const isEnPath = pathname.startsWith('/en');

    // Prevent TR users from accessing EN site
    if (isTRUser && isEnPath) {
        const newUrl = request.nextUrl.clone();
        newUrl.pathname = pathname.replace(/^\/en/, '/tr');
        return NextResponse.redirect(newUrl);
    }

    // Prevent Global users from accessing TR site
    if (!isTRUser && isTrPath) {
        const newUrl = request.nextUrl.clone();
        newUrl.pathname = pathname.replace(/^\/tr/, '/en');
        return NextResponse.redirect(newUrl);
    }

    // Handle Root path '/'
    if (pathname === '/') {
        const targetLocale = isTRUser ? 'tr' : 'en';
        return NextResponse.redirect(new URL(`/${targetLocale}`, request.url));
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ['/', '/(tr|en)/:path*']
};
