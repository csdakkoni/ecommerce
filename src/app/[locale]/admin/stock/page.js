'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Boxes, Search, AlertTriangle, Package, Filter, RefreshCw, Plus, Minus, AlertCircle } from 'lucide-react';

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

    const fetchProducts = async () => {
        setLoading(true);
        // product_variants ve ilişkili ürün ismini getir
        const { data, error } = await supabase
            .from('product_variants')
            .select(`
                *,
                products:product_id (
                    name,
                    name_en,
                    unit_type
                )
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProducts(data);
        }
        setLoading(false);
    };

    const handleAdjustment = async () => {
        if (!selectedVariant) return;

        const currentStock = selectedVariant.stock || 0;
        const newQty = adjustmentType === 'in' ? currentStock + adjustmentQty : Math.max(0, currentStock - adjustmentQty);

        // 1. Stok güncelle
        const { error: updateError } = await supabase
            .from('product_variants')
            .update({ stock: newQty })
            .eq('id', selectedVariant.id);

        if (updateError) {
            alert('Stok güncellenirken hata oluştu');
            return;
        }

        // 2. Stok hareketi kaydet
        await supabase
            .from('stock_movements')
            .insert({
                product_variant_id: selectedVariant.id, // product_id yerine product_variant_id (tablo yapısına göre kontrol edilmeli)
                product_id: selectedVariant.product_id,
                quantity: adjustmentType === 'in' ? adjustmentQty : -adjustmentQty,
                type: adjustmentType === 'in' ? 'purchase' : 'sale',
                notes: adjustmentNote || (adjustmentType === 'in' ? 'Manuel Giriş' : 'Manuel Çıkış')
            });

        setAdjustmentModal(false);
        setAdjustmentQty(1);
        setAdjustmentNote('');
        fetchProducts();
    };

    const filteredProducts = products.filter(pv => {
        const productName = (pv.products?.name || '').toLowerCase();
        const sku = (pv.sku || '').toLowerCase();
        const searchMatch = productName.includes(search.toLowerCase()) || sku.includes(search.toLowerCase());

        if (!searchMatch) return false;

        if (filter === 'low') return pv.stock > 0 && pv.stock <= 5;
        if (filter === 'out') return pv.stock <= 0;
        return true;
    });

    const formatCombination = (combination) => {
        if (!combination) return '-';
        return Object.entries(combination)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Boxes className="w-6 h-6 text-primary" />
                        Stok Yönetimi
                    </h1>
                    <p className="text-muted-foreground text-sm">Ürün varyant stoğu ve depo takibi</p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Ürün adı veya SKU ile ara..."
                        className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex bg-muted/50 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setFilter('low')}
                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${filter === 'low' ? 'bg-background shadow-sm text-amber-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Kritik Stok
                    </button>
                    <button
                        onClick={() => setFilter('out')}
                        className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${filter === 'out' ? 'bg-background shadow-sm text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Tükendi
                    </button>
                </div>
                <button
                    onClick={fetchProducts}
                    className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                </button>
            </div>

            {/* Table */}
            <div className="bg-card border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">Ürün / Varyant</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4 text-center">Mevcut Stok</th>
                                <th className="px-6 py-4 text-center">Durum</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                        <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        Ürün bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((pv) => (
                                    <tr key={pv.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-sm">{pv.products?.name}</div>
                                            <div className="text-xs text-primary font-medium mt-0.5">
                                                {formatCombination(pv.option_combination)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{pv.sku || '-'}</code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-center font-semibold">
                                                {pv.stock} <span className="text-[10px] text-muted-foreground font-normal">{pv.products?.unit_type === 'metre' ? 'mt' : 'adet'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {pv.stock <= 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                                                        TÜKENDİ
                                                    </span>
                                                ) : pv.stock <= 5 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                                        KRİTİK
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                                                        OK
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedVariant(pv); setAdjustmentModal(true); }}
                                                    className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-muted-foreground"
                                                    title="Stok Ayarla"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjustment Modal */}
            {adjustmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b bg-muted/30">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Package className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg">Stok Ayarla</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {selectedVariant?.products?.name} - {formatCombination(selectedVariant?.option_combination)}
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl">
                                <button
                                    onClick={() => setAdjustmentType('in')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${adjustmentType === 'in' ? 'bg-background shadow-lg text-green-600' : 'text-muted-foreground'}`}
                                >
                                    <Plus className="w-4 h-4" /> Stok Girişi
                                </button>
                                <button
                                    onClick={() => setAdjustmentType('out')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${adjustmentType === 'out' ? 'bg-background shadow-lg text-red-600' : 'text-muted-foreground'}`}
                                >
                                    <Minus className="w-4 h-4" /> Stok Çıkışı
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Miktar</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full pl-4 pr-12 py-3 bg-muted/50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-lg font-bold"
                                            value={adjustmentQty}
                                            onChange={(e) => setAdjustmentQty(parseFloat(e.target.value) || 0)}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                            {selectedVariant?.products?.unit_type === 'metre' ? 'mt' : 'adet'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Not (Opsiyonel)</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-muted/50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                                        placeholder="Örn: İade geldi, fire verildi..."
                                        value={adjustmentNote}
                                        onChange={(e) => setAdjustmentNote(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10 mb-6">
                                    <span className="text-sm">Yeni Stok Seviyesi:</span>
                                    <span className="font-bold text-lg">
                                        {adjustmentType === 'in'
                                            ? (selectedVariant?.stock || 0) + adjustmentQty
                                            : Math.max(0, (selectedVariant?.stock || 0) - adjustmentQty)
                                        } {selectedVariant?.products?.unit_type === 'metre' ? 'mt' : 'adet'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setAdjustmentModal(false)}
                                        className="py-3 px-4 rounded-xl border font-semibold hover:bg-muted transition-colors"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={handleAdjustment}
                                        className={`py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${adjustmentType === 'in' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}
                                    >
                                        Onayla
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
