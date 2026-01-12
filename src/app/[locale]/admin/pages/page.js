'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Pencil, Eye, EyeOff } from 'lucide-react';

export default function AdminPagesPage() {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPages();
    }, []);

    async function fetchPages() {
        const { data, error } = await supabase
            .from('site_pages')
            .select('*')
            .order('title');

        if (!error) {
            setPages(data || []);
        }
        setLoading(false);
    }

    const togglePublish = async (id, currentStatus) => {
        const { error } = await supabase
            .from('site_pages')
            .update({ is_published: !currentStatus })
            .eq('id', id);

        if (!error) {
            fetchPages();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold">Sayfalar</h2>
                    <p className="text-muted-foreground">Site sayfalarını yönetin (Hakkımızda, İletişim, vb.)</p>
                </div>
                {/* Site Preview Links */}
                <div className="flex gap-2">
                    <Link href="/tr" target="_blank" className="btn btn-outline text-sm flex items-center gap-2">
                        🇹🇷 TR Site
                    </Link>
                    <Link href="/en" target="_blank" className="btn btn-outline text-sm flex items-center gap-2">
                        🇬🇧 EN Site
                    </Link>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : pages.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        Henüz sayfa bulunmuyor. SQL migration'ı çalıştırın.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="p-4 font-medium text-sm">Sayfa</th>
                                <th className="p-4 font-medium text-sm">Slug</th>
                                <th className="p-4 font-medium text-sm">İngilizce</th>
                                <th className="p-4 font-medium text-sm">Durum</th>
                                <th className="p-4 font-medium text-sm text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.map((page) => (
                                <tr key={page.id} className="border-b hover:bg-muted/30">
                                    <td className="p-4 font-medium">{page.title}</td>
                                    <td className="p-4 text-muted-foreground font-mono text-sm">/{page.slug}</td>
                                    <td className="p-4 text-sm">
                                        {page.title_en ? (
                                            <span className="text-green-600">✓ {page.title_en}</span>
                                        ) : (
                                            <span className="text-orange-500">Eksik</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => togglePublish(page.id, page.is_published)}
                                            className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${page.is_published
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                        >
                                            {page.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {page.is_published ? 'Yayında' : 'Taslak'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/admin/pages/${page.slug}`}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md inline-block"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
