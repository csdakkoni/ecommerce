import createMiddleware from 'next-intl/middleware';
import { routing } from './navigation';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request) {
    // Get country from Vercel headers or default to 'TR' for localhost
    const country = request.geo?.country || request.headers.get('x-vercel-ip-country') || 'TR';

    // Developer bypass: Check for 'admin_mode' cookie
    const isAdmin = request.cookies.has('admin_mode');

    const pathname = request.nextUrl.pathname;

    // Logic:
    // IF User is in TR -> FORCE /tr (Turkish + TL)
    // IF User is NOT in TR -> FORCE /en (English + USD/EUR)
    // UNLESS User is Admin (has cookie)

    if (isAdmin) {
        return intlMiddleware(request);
    }

    const isTRUser = country === 'TR';
    const isTrPath = pathname.startsWith('/tr');
    const isEnPath = pathname.startsWith('/en');

    // 1. Prevent TR users from accessing EN site
    if (isTRUser && isEnPath) {
        const newUrl = request.nextUrl.clone();
        newUrl.pathname = pathname.replace(/^\/en/, '/tr');
        return NextResponse.redirect(newUrl);
    }

    // 2. Prevent Global users from accessing TR site
    if (!isTRUser && isTrPath) {
        const newUrl = request.nextUrl.clone();
        newUrl.pathname = pathname.replace(/^\/tr/, '/en');
        return NextResponse.redirect(newUrl);
    }

    // 3. Handle Root path '/'
    if (pathname === '/') {
        const targetLocale = isTRUser ? 'tr' : 'en';
        return NextResponse.redirect(new URL(`/${targetLocale}`, request.url));
    }

    // 4. Continue with next-intl for valid requests
    const response = intlMiddleware(request);
    return response;
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(tr|en)/:path*']
};
