'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Boxes, Search, AlertTriangle, Package, Filter, RefreshCw, Plus, Minus } from 'lucide-react';

export default function StockManagement() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, low, out
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [adjustmentModal, setAdjustmentModal] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState('in');
    const [adjustmentQty, setAdjustmentQty] = useState(1);
    const [adjustmentNote, setAdjustmentNote] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                is_active,
                variants (
                    id,
                    name,
                    color_code,
                    stock_quantity,
                    sku,
                    low_stock_threshold
                )
            `)
            .order('name');

        if (!error && data) {
            setProducts(data);
        }
        setLoading(false);
    }

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.variants?.some(v => v.name?.toLowerCase().includes(search.toLowerCase()) || v.sku?.toLowerCase().includes(search.toLowerCase()));

        if (!matchesSearch) return false;

        if (filter === 'all') return true;
        if (filter === 'low') {
            return product.variants?.some(v => v.stock_quantity > 0 && v.stock_quantity <= (v.low_stock_threshold || 5));
        }
        if (filter === 'out') {
            return product.variants?.some(v => v.stock_quantity <= 0);
        }
        return true;
    });

    const totalVariants = products.reduce((sum, p) => sum + (p.variants?.length || 0), 0);
    const lowStockCount = products.reduce((sum, p) =>
        sum + (p.variants?.filter(v => v.stock_quantity > 0 && v.stock_quantity <= (v.low_stock_threshold || 5)).length || 0), 0);
    const outOfStockCount = products.reduce((sum, p) =>
        sum + (p.variants?.filter(v => v.stock_quantity <= 0).length || 0), 0);

    const openAdjustment = (variant, type) => {
        setSelectedVariant(variant);
        setAdjustmentType(type);
        setAdjustmentQty(1);
        setAdjustmentNote('');
        setAdjustmentModal(true);
    };

    const handleAdjustment = async () => {
        if (!selectedVariant || adjustmentQty <= 0) return;

        const newQty = adjustmentType === 'in'
            ? selectedVariant.stock_quantity + adjustmentQty
            : Math.max(0, selectedVariant.stock_quantity - adjustmentQty);

        // Update variant stock
        const { error } = await supabase
            .from('variants')
            .update({ stock_quantity: newQty })
            .eq('id', selectedVariant.id);

        if (!error) {
            // Log stock movement
            await supabase.from('stock_movements').insert({
                variant_id: selectedVariant.id,
                type: adjustmentType === 'in' ? 'in' : 'out',
                quantity: adjustmentQty,
                balance_after: newQty,
                reason: 'manual',
                notes: adjustmentNote || null
            });

            setAdjustmentModal(false);
            fetchProducts();
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Boxes className="w-7 h-7" />
                        Stok Yönetimi
                    </h1>
                    <p className="text-muted-foreground">Ürün stoklarını takip edin ve yönetin</p>
                </div>
                <button
                    onClick={fetchProducts}
                    className="btn btn-outline flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Yenile
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{totalVariants}</p>
                        <p className="text-sm text-muted-foreground">Toplam Varyant</p>
                    </div>
                </div>
                <div
                    className={`card p-4 flex items-center gap-4 cursor-pointer transition-colors ${filter === 'low' ? 'ring-2 ring-amber-500' : ''}`}
                    onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}
                >
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{lowStockCount}</p>
                        <p className="text-sm text-muted-foreground">Düşük Stok</p>
                    </div>
                </div>
                <div
                    className={`card p-4 flex items-center gap-4 cursor-pointer transition-colors ${filter === 'out' ? 'ring-2 ring-red-500' : ''}`}
                    onClick={() => setFilter(filter === 'out' ? 'all' : 'out')}
                >
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                        <Boxes className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{outOfStockCount}</p>
                        <p className="text-sm text-muted-foreground">Stok Yok</p>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Ürün veya SKU ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10 w-full"
                    />
                </div>
                <div className="flex gap-2">
                    {[
                        { value: 'all', label: 'Tümü' },
                        { value: 'low', label: 'Düşük Stok' },
                        { value: 'out', label: 'Stok Yok' }
                    ].map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${filter === f.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {search || filter !== 'all' ? 'Sonuç bulunamadı' : 'Henüz ürün yok'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left p-4 font-medium">Ürün</th>
                                    <th className="text-left p-4 font-medium">Varyant</th>
                                    <th className="text-left p-4 font-medium">SKU</th>
                                    <th className="text-center p-4 font-medium">Stok</th>
                                    <th className="text-center p-4 font-medium">Durum</th>
                                    <th className="text-center p-4 font-medium">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredProducts.map(product => (
                                    product.variants?.map((variant, vi) => (
                                        <tr key={variant.id} className="hover:bg-muted/30">
                                            <td className="p-4">
                                                {vi === 0 && (
                                                    <span className="font-medium">{product.name}</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {variant.color_code && (
                                                        <div
                                                            className="w-5 h-5 rounded-full border"
                                                            style={{ backgroundColor: variant.color_code }}
                                                        />
                                                    )}
                                                    <span>{variant.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                    {variant.sku || '-'}
                                                </code>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`font-bold ${variant.stock_quantity <= 0 ? 'text-red-600' :
                                                        variant.stock_quantity <= (variant.low_stock_threshold || 5) ? 'text-amber-600' :
                                                            'text-green-600'
                                                    }`}>
                                                    {variant.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {variant.stock_quantity <= 0 ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Stokta Yok</span>
                                                ) : variant.stock_quantity <= (variant.low_stock_threshold || 5) ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Düşük</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Yeterli</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openAdjustment(variant, 'in')}
                                                        className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                                                        title="Stok Ekle"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openAdjustment(variant, 'out')}
                                                        className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                                        title="Stok Çıkar"
                                                        disabled={variant.stock_quantity <= 0}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Adjustment Modal */}
            {adjustmentModal && selectedVariant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {adjustmentType === 'in' ? 'Stok Ekle' : 'Stok Çıkar'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-muted-foreground">Varyant</label>
                                <p className="font-medium">{selectedVariant.name}</p>
                                <p className="text-sm text-muted-foreground">Mevcut: {selectedVariant.stock_quantity} adet</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Miktar</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={adjustmentQty}
                                    onChange={(e) => setAdjustmentQty(parseInt(e.target.value) || 0)}
                                    className="input w-full"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">Not (opsiyonel)</label>
                                <textarea
                                    value={adjustmentNote}
                                    onChange={(e) => setAdjustmentNote(e.target.value)}
                                    className="input w-full"
                                    rows={2}
                                    placeholder="Örn: Tedarikçiden alım, sayım düzeltmesi..."
                                />
                            </div>

                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm">
                                    Yeni stok: <span className="font-bold">
                                        {adjustmentType === 'in'
                                            ? selectedVariant.stock_quantity + adjustmentQty
                                            : Math.max(0, selectedVariant.stock_quantity - adjustmentQty)
                                        }
                                    </span> adet
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setAdjustmentModal(false)}
                                    className="btn btn-outline flex-1"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleAdjustment}
                                    className={`btn flex-1 ${adjustmentType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                                >
                                    {adjustmentType === 'in' ? 'Stok Ekle' : 'Stok Çıkar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
