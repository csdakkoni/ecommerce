'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Link } from '@/navigation';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Search } from 'lucide-react';

export default function AdminBlogPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    async function fetchPosts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) setPosts(data || []);
        setLoading(false);
    }

    const handleDelete = async (id) => {
        if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (!error) fetchPosts();
    };

    const togglePublish = async (post) => {
        const newStatus = post.status === 'published' ? 'draft' : 'published';
        const { error } = await supabase
            .from('blog_posts')
            .update({
                status: newStatus,
                published_at: newStatus === 'published' ? new Date().toISOString() : null
            })
            .eq('id', post.id);

        if (!error) fetchPosts();
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Blog Yazıları</h2>
                    <p className="text-muted-foreground">Blog içeriklerinizi yönetin.</p>
                </div>
                <Link href="/admin/blog/new" className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Yeni Yazı
                </Link>
            </div>

            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Yazı Ara..."
                    className="w-full max-w-sm pl-10 pr-4 py-2 border rounded-md bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Henüz yazı yok. İlk yazınızı ekleyin!
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="p-4 font-medium text-sm">Başlık</th>
                                <th className="p-4 font-medium text-sm">Kategori</th>
                                <th className="p-4 font-medium text-sm">Durum</th>
                                <th className="p-4 font-medium text-sm">Tarih</th>
                                <th className="p-4 font-medium text-sm">Görüntülenme</th>
                                <th className="p-4 font-medium text-sm text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPosts.map((post) => (
                                <tr key={post.id} className="border-b hover:bg-muted/30">
                                    <td className="p-4">
                                        <div className="font-medium">{post.title}</div>
                                        <div className="text-xs text-muted-foreground">{post.slug}</div>
                                    </td>
                                    <td className="p-4 text-sm">{post.category || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${post.status === 'published'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {post.status === 'published' ? 'Yayında' : 'Taslak'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {new Date(post.created_at).toLocaleDateString('tr')}
                                    </td>
                                    <td className="p-4 text-sm">{post.view_count || 0}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => togglePublish(post)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md inline-block mr-1"
                                            title={post.status === 'published' ? 'Yayından Kaldır' : 'Yayınla'}
                                        >
                                            {post.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <Link
                                            href={`/admin/blog/${post.id}/edit`}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md inline-block mr-1"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
