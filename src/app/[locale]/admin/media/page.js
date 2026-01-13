'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getOptimizedImageUrl } from '@/lib/media/utils';
import {
    Image as ImageIcon, Trash2, Search, Loader2, Copy, Check,
    ExternalLink, RefreshCw, Filter, Grid, List as ListIcon
} from 'lucide-react';

export default function MediaLibraryPage() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // grid, list
    const [copiedId, setCopiedId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchImages();
    }, []);

    async function fetchImages() {
        setLoading(true);
        const { data, error } = await supabase
            .storage
            .from('products')
            .list('originals', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) {
            console.error('Error fetching images:', error);
        } else {
            // Filter out empty entries and system files if any
            setImages(data || []);
        }
        setLoading(false);
    }

    const getFullUrl = (name) => {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/originals/${name}`;
    };

    const getDisplayUrl = (name) => {
        // Use our proxy for the thumbnail
        const baseUrl = `/api/image/products/${name}`;
        return getOptimizedImageUrl(baseUrl, { w: 300, q: 75, fm: 'webp' });
    };

    const handleDelete = async (name) => {
        if (!confirm('Bu görseli kalıcı olarak silmek istediğinize emin misiniz?')) return;

        setDeletingId(name);
        const { error } = await supabase
            .storage
            .from('products')
            .remove([`originals/${name}`]);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            setImages(prev => prev.filter(img => img.name !== name));
        }
        setDeletingId(null);
    };

    const copyToClipboard = (name) => {
        const url = getFullUrl(name);
        navigator.clipboard.writeText(url);
        setCopiedId(name);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredImages = images.filter(img =>
        img.name.toLowerCase().includes(search.toLowerCase())
    );

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ImageIcon className="w-7 h-7" />
                        Medya Kütüphanesi
                    </h1>
                    <p className="text-muted-foreground">Tüm ürün görsellerini buradan yönetebilirsiniz</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchImages}
                        className="btn btn-outline flex items-center gap-2"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Yenile
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Görsel ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10 w-full"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin mb-4" />
                    <p>Medya dosyaları yükleniyor...</p>
                </div>
            ) : filteredImages.length === 0 ? (
                <div className="card p-24 text-center">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-semibold">Görsel bulunamadı</h3>
                    <p className="text-muted-foreground">Arama kriterlerinize uygun görsel yok veya henüz görsel yüklenmemiş.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredImages.map((img) => (
                        <div key={img.name} className="group card overflow-hidden flex flex-col relative aspect-square">
                            <img
                                src={getDisplayUrl(img.name)}
                                alt={img.name}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => copyToClipboard(img.name)}
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm"
                                        title="Bağlantıyı Kopyala"
                                    >
                                        {copiedId === img.name ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                    <a
                                        href={getFullUrl(img.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(img.name)}
                                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm"
                                        disabled={deletingId === img.name}
                                    >
                                        {deletingId === img.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-white/70 truncate w-full px-2">{img.name}</p>
                                    <p className="text-[10px] text-white/50">{formatSize(img.metadata?.size)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-muted text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">Görsel</th>
                                <th className="p-4">Dosya Adı</th>
                                <th className="p-4">Boyut</th>
                                <th className="p-4">Tarih</th>
                                <th className="p-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredImages.map((img) => (
                                <tr key={img.name} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                                            <img
                                                src={getDisplayUrl(img.name)}
                                                className="w-full h-full object-cover"
                                                alt=""
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-medium truncate max-w-[200px]">{img.name}</p>
                                    </td>
                                    <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                                        {formatSize(img.metadata?.size)}
                                    </td>
                                    <td className="p-4 text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(img.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => copyToClipboard(img.name)}
                                                className="p-2 hover:bg-muted rounded-lg"
                                                title="Kopyala"
                                            >
                                                {copiedId === img.name ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(img.name)}
                                                className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                                                disabled={deletingId === img.name}
                                            >
                                                {deletingId === img.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
