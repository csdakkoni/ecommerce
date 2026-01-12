'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Save, Eye } from 'lucide-react';

export default function EditPagePage({ params }) {
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        title_en: '',
        content: '',
        content_en: '',
        meta_title: '',
        meta_title_en: '',
        meta_description: '',
        meta_description_en: '',
        is_published: true,
    });

    useEffect(() => {
        fetchPage();
    }, [slug]);

    async function fetchPage() {
        const { data, error } = await supabase
            .from('site_pages')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !data) {
            alert('Sayfa bulunamadı');
            router.push('/admin/pages');
            return;
        }

        setFormData({
            title: data.title || '',
            title_en: data.title_en || '',
            content: data.content || '',
            content_en: data.content_en || '',
            meta_title: data.meta_title || '',
            meta_title_en: data.meta_title_en || '',
            meta_description: data.meta_description || '',
            meta_description_en: data.meta_description_en || '',
            is_published: data.is_published ?? true,
        });
        setLoading(false);
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const { error } = await supabase
            .from('site_pages')
            .update({
                ...formData,
                updated_at: new Date().toISOString(),
            })
            .eq('slug', slug);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            router.push('/admin/pages');
        }
        setSaving(false);
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link href="/admin/pages" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Sayfalara Dön
            </Link>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Sayfa Düzenle: {formData.title}</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            name="is_published"
                            checked={formData.is_published}
                            onChange={handleChange}
                            className="rounded"
                        />
                        Yayında
                    </label>
                    <Link href={`/${slug}`} target="_blank" className="btn btn-outline text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Önizle
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Turkish Content */}
                <div className="card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        🇹🇷 Türkçe İçerik
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Sayfa Başlığı</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full border rounded-md p-3 bg-background"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">İçerik (HTML destekler)</label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows={10}
                                className="w-full border rounded-md p-3 bg-background font-mono text-sm"
                                placeholder="<h2>Başlık</h2><p>İçerik...</p>"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">SEO Başlığı</label>
                                <input
                                    type="text"
                                    name="meta_title"
                                    value={formData.meta_title}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                    placeholder="Sayfa başlığı | Site Adı"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">SEO Açıklaması</label>
                                <input
                                    type="text"
                                    name="meta_description"
                                    value={formData.meta_description}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                    placeholder="Sayfa açıklaması..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* English Content */}
                <div className="card p-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        🇬🇧 English Content
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Page Title</label>
                            <input
                                type="text"
                                name="title_en"
                                value={formData.title_en}
                                onChange={handleChange}
                                className="w-full border rounded-md p-3 bg-background"
                                placeholder="About Us"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Content (HTML supported)</label>
                            <textarea
                                name="content_en"
                                value={formData.content_en}
                                onChange={handleChange}
                                rows={10}
                                className="w-full border rounded-md p-3 bg-background font-mono text-sm"
                                placeholder="<h2>Title</h2><p>Content...</p>"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">SEO Title</label>
                                <input
                                    type="text"
                                    name="meta_title_en"
                                    value={formData.meta_title_en}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">SEO Description</label>
                                <input
                                    type="text"
                                    name="meta_description_en"
                                    value={formData.meta_description_en}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Link href="/admin/pages" className="btn btn-outline">İptal</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
}
