import { Outfit } from "next/font/google";
import "./globals.css";

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
  keywords: [
    "kumaş", "fabric", "ipek", "silk", "keten", "linen", "pamuk", "cotton",
    "kadife", "velvet", "tekstil", "textile", "türkiye", "istanbul",
    "doğal kumaş", "organik kumaş", "premium kumaş", "kumaş mağazası",
    "ev tekstili", "moda kumaş", "terzi kumaş", "elbiselik kumaş"
  ],
  authors: [{ name: "Grohn Fabrics" }],
  creator: "Grohn Fabrics",
  publisher: "Grohn Fabrics",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://grohnfabrics.com",
    siteName: "Grohn Fabrics",
    title: "Grohn Fabrics | Premium Kumaş Mağazası",
    description: "Türkiye'nin en seçkin doğal kumaş koleksiyonu. İpek, keten, pamuk ve daha fazlası.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Grohn Fabrics - Premium Kumaş Koleksiyonu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grohn Fabrics | Premium Kumaş Mağazası",
    description: "Türkiye'nin en seçkin doğal kumaş koleksiyonu.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these after setting up in Google/Bing
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: "https://grohnfabrics.com",
    languages: {
      'tr-TR': 'https://grohnfabrics.com',
    },
  },
};

// JSON-LD Structured Data for Organization
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Grohn Fabrics',
  url: 'https://grohnfabrics.com',
  logo: 'https://grohnfabrics.com/logo.png',
  description: 'Türkiye\'nin en seçkin doğal kumaş koleksiyonu',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Laleli Tekstil Merkezi',
    addressLocality: 'Fatih',
    addressRegion: 'İstanbul',
    postalCode: '34134',
    addressCountry: 'TR'
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+90-212-XXX-XXXX',
    contactType: 'customer service',
    availableLanguage: ['Turkish', 'English']
  },
  sameAs: [
    'https://instagram.com/grohnfabrics',
    'https://facebook.com/grohnfabrics',
    'https://pinterest.com/grohnfabrics'
  ]
};

// JSON-LD for WebSite with SearchAction (helps Google show search box in results)
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Grohn Fabrics',
  url: 'https://grohnfabrics.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://grohnfabrics.com/products?search={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#5c8a72" />
      </head>
      <body className={outfit.className}>
        {children}
      </body>
    </html>
  );
}
