'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus, Edit, Trash2, Search, Package, Check, X, Download,
    MoreHorizontal, Filter, AlertCircle, Loader2
} from 'lucide-react';

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    }

    const handleDelete = async (id) => {
        if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            fetchProducts();
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`${selectedIds.length} ürünü silmek istediğinize emin misiniz?`)) return;

        setProcessing(true);
        const { error } = await supabase
            .from('products')
            .delete()
            .in('id', selectedIds);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            setSelectedIds([]);
            fetchProducts();
        }
        setProcessing(false);
    };

    const handleBulkStatus = async (isActive) => {
        if (!selectedIds.length) return;

        setProcessing(true);
        const { error } = await supabase
            .from('products')
            .update({ is_active: isActive })
            .in('id', selectedIds);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            setSelectedIds([]);
            fetchProducts();
        }
        setProcessing(false);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredProducts.length && filteredProducts.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProducts.map(p => p.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Ürün Adı', 'Kategori', 'Fiyat', 'Durum', 'Eklenme Tarihi'];
        const rows = filteredProducts.map(p => [
            p.id,
            `"${p.name.replace(/"/g, '""')}"`,
            `"${p.categories?.name || '-'}"`,
            p.price,
            p.is_active ? 'Aktif' : 'Pasif',
            new Date(p.created_at).toLocaleDateString('tr-TR')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `agoraloom_urunler_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Ürünler</h2>
                    <p className="text-muted-foreground">Mağazanızdaki kumaşları yönetin.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Dışa Aktar
                    </button>
                    <Link href="/admin/products/new" className="btn btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Yeni Ürün
                    </Link>
                </div>
            </div>

            {/* Selection Banner */}
            {selectedIds.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                        <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {selectedIds.length}
                        </span>
                        <span className="text-sm font-medium">Ürün seçildi</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBulkStatus(true)}
                            disabled={processing}
                            className="px-3 py-1.5 bg-background hover:bg-muted text-xs font-medium rounded-lg border transition-colors flex items-center gap-1"
                        >
                            <Check className="w-3 h-3 text-green-600" /> Aktif Et
                        </button>
                        <button
                            onClick={() => handleBulkStatus(false)}
                            disabled={processing}
                            className="px-3 py-1.5 bg-background hover:bg-muted text-xs font-medium rounded-lg border transition-colors flex items-center gap-1"
                        >
                            <X className="w-3 h-3 text-red-600" /> Pasif Et
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            disabled={processing}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" /> Sil
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Ürün Ara..."
                        className="input pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        Yükleniyor...
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        Ürün bulunamadı.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="p-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Ürün Bilgisi</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Kategori</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Fiyat</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Durum</th>
                                    <th className="p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                {filteredProducts.map((product) => {
                                    const isSelected = selectedIds.includes(product.id);
                                    return (
                                        <tr key={product.id} className={`hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(product.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                                        {product.images?.[0] ? (
                                                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="w-5 h-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold truncate max-w-[200px]">{product.name}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono uppercase">{product.slug}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm bg-muted px-2 py-1 rounded text-muted-foreground">
                                                    {product.categories?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-medium">
                                                <div className="flex flex-col">
                                                    <span>{product.price} ₺</span>
                                                    {product.sale_price && (
                                                        <span className="text-[10px] text-red-500 line-through opacity-70">{product.sale_price} ₺</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {product.is_active ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link href={`/admin/products/${product.id}/edit`} className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                        <Edit className="w-4 h-4 text-blue-600" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
