'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Save, Image, Eye } from 'lucide-react';
import { Link } from '@/navigation';

export default function NewBlogPostPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        title_en: '',
        slug: '',
        excerpt: '',
        excerpt_en: '',
        content: '',
        content_en: '',
        category: '',
        featured_image: '',
        meta_title: '',
        meta_description: '',
        status: 'draft',
    });

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            slug: generateSlug(title),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const postData = {
            ...formData,
            published_at: formData.status === 'published' ? new Date().toISOString() : null,
        };

        const { data, error } = await supabase
            .from('blog_posts')
            .insert([postData])
            .select()
            .single();

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            router.push('/admin/blog');
        }
        setLoading(false);
    };

    const categories = [
        { value: 'tekstil-rehberi', label: 'Tekstil Rehberi' },
        { value: 'kumas-bakim', label: 'Kumaş Bakımı' },
        { value: 'dekorasyon', label: 'Dekorasyon' },
        { value: 'moda', label: 'Moda' },
        { value: 'haberler', label: 'Haberler' },
    ];

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/blog" className="p-2 hover:bg-muted rounded-md">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold">Yeni Blog Yazısı</h2>
                    <p className="text-muted-foreground">Yeni bir blog yazısı oluşturun.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Başlık (TR) *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 border rounded-md bg-background"
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    placeholder="Yazı başlığı..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Başlık (EN)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-md bg-background"
                                    value={formData.title_en}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                                    placeholder="Post title..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">URL Slug</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-md bg-background font-mono text-sm"
                                    value={formData.slug}
                                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Özet (TR)</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-3 border rounded-md bg-background"
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                    placeholder="Kısa açıklama..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">İçerik (TR) *</label>
                                <textarea
                                    rows={15}
                                    required
                                    className="w-full p-3 border rounded-md bg-background font-mono text-sm"
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Markdown desteklenir..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">İçerik (EN)</label>
                                <textarea
                                    rows={10}
                                    className="w-full p-3 border rounded-md bg-background font-mono text-sm"
                                    value={formData.content_en}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                                    placeholder="English content..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publish */}
                        <div className="card p-6">
                            <h3 className="font-semibold mb-4">Yayın Durumu</h3>
                            <select
                                className="w-full p-3 border rounded-md bg-background mb-4"
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="draft">Taslak</option>
                                <option value="published">Yayınla</option>
                            </select>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>

                        {/* Category */}
                        <div className="card p-6">
                            <h3 className="font-semibold mb-4">Kategori</h3>
                            <select
                                className="w-full p-3 border rounded-md bg-background"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <option value="">Kategori Seç</option>
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Featured Image */}
                        <div className="card p-6">
                            <h3 className="font-semibold mb-4">Öne Çıkan Görsel</h3>
                            <input
                                type="url"
                                className="w-full p-3 border rounded-md bg-background"
                                value={formData.featured_image}
                                onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                                placeholder="https://..."
                            />
                            {formData.featured_image && (
                                <img src={formData.featured_image} alt="Preview" className="mt-3 rounded-md w-full" />
                            )}
                        </div>

                        {/* SEO */}
                        <div className="card p-6">
                            <h3 className="font-semibold mb-4">SEO</h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-md bg-background text-sm"
                                    value={formData.meta_title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                                    placeholder="Meta başlık (max 70)"
                                    maxLength={70}
                                />
                                <textarea
                                    rows={2}
                                    className="w-full p-3 border rounded-md bg-background text-sm"
                                    value={formData.meta_description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                                    placeholder="Meta açıklama (max 160)"
                                    maxLength={160}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
