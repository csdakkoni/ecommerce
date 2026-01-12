'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useLocale } from 'next-intl';
import { Link } from '@/navigation';
import { Calendar, User, Eye, ArrowRight, Tag } from 'lucide-react';

/**
 * Blog List Page
 */
export default function BlogPage() {
    const locale = useLocale();
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        fetchPosts();
        fetchCategories();
    }, [selectedCategory]);

    async function fetchPosts() {
        setLoading(true);
        let query = supabase
            .from('blog_posts')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });

        if (selectedCategory) {
            query = query.eq('category', selectedCategory);
        }

        const { data, error } = await query;
        if (!error) setPosts(data || []);
        setLoading(false);
    }

    async function fetchCategories() {
        const { data } = await supabase
            .from('blog_categories')
            .select('*')
            .order('sort_order');
        setCategories(data || []);
    }

    const labels = {
        title: locale === 'tr' ? 'Blog' : 'Blog',
        subtitle: locale === 'tr' ? 'Tekstil dünyasından haberler, ipuçları ve rehberler' : 'News, tips and guides from the textile world',
        readMore: locale === 'tr' ? 'Devamını Oku' : 'Read More',
        allPosts: locale === 'tr' ? 'Tüm Yazılar' : 'All Posts',
        noPosts: locale === 'tr' ? 'Henüz yazı yok.' : 'No posts yet.',
        views: locale === 'tr' ? 'görüntülenme' : 'views',
    };

    return (
        <div className="container py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">{labels.title}</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">{labels.subtitle}</p>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${!selectedCategory
                                ? 'bg-primary text-white'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                    >
                        {labels.allPosts}
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.slug)}
                            className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedCategory === cat.slug
                                    ? 'bg-primary text-white'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                        >
                            {cat.icon} {locale === 'en' && cat.name_en ? cat.name_en : cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Posts Grid */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">{labels.noPosts}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
                        <article key={post.id} className="card overflow-hidden group">
                            {/* Featured Image */}
                            {post.featured_image && (
                                <Link href={`/blog/${post.slug}`}>
                                    <div className="aspect-[16/10] overflow-hidden">
                                        <img
                                            src={post.featured_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                </Link>
                            )}

                            <div className="p-6">
                                {/* Category */}
                                {post.category && (
                                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded-full mb-3">
                                        {post.category}
                                    </span>
                                )}

                                {/* Title */}
                                <Link href={`/blog/${post.slug}`}>
                                    <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                        {locale === 'en' && post.title_en ? post.title_en : post.title}
                                    </h2>
                                </Link>

                                {/* Excerpt */}
                                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                                    {locale === 'en' && post.excerpt_en ? post.excerpt_en : post.excerpt}
                                </p>

                                {/* Meta */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(post.published_at).toLocaleDateString(locale)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {post.view_count || 0}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/blog/${post.slug}`}
                                        className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                        {labels.readMore}
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
