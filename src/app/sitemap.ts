import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://grohnfabrics.com';

    // Static pages
    const staticPages = [
        '',
        '/products',
        '/about',
        '/contact',
        '/faq',
        '/shipping',
        '/track',
        '/login',
        '/register',
        '/cart',
        '/favorites',
    ];

    const staticEntries = staticPages.map((page) => ({
        url: `${baseUrl}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly' as const,
        priority: page === '' ? 1 : page === '/products' ? 0.9 : 0.7,
    }));

    // Category pages
    const categories = ['ipek', 'keten', 'pamuk', 'kadife', 'yun', 'polyester'];
    const categoryEntries = categories.map((cat) => ({
        url: `${baseUrl}/products?type=${cat}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...staticEntries, ...categoryEntries];
}
