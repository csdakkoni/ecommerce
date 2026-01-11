import { Outfit } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  metadataBase: new URL('https://grohnfabrics.com'),
  title: {
    default: "Grohn Fabrics | Premium Kumaş Mağazası",
    template: "%s | Grohn Fabrics"
  },
  description: "Türkiye'nin en seçkin doğal kumaş koleksiyonu. İpek, keten, pamuk ve daha fazlası. Tasarımcılar ve kumaş tutkunları için premium kalite.",
  // ... other metadata remains same, can be enhanced later
  alternates: {
    canonical: "https://grohnfabrics.com",
    languages: {
      'tr-TR': 'https://grohnfabrics.com/tr',
      'en-US': 'https://grohnfabrics.com/en',
    },
  },
};

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'tr' }];
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {/* Basic head elements, metadata handles most */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#5c8a72" />
      </head>
      <body className={outfit.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
