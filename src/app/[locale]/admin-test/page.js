'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function AdminTestPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id');

        if (data) setProducts(data);
        setLoading(false);
    }

    const updateProduct = async (id, field, value) => {
        // Optimistic update
        setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const saveProduct = async (product) => {
        const { error } = await supabase
            .from('products')
            .update({
                name_en: product.name_en,
                description_en: product.description_en,
                price_usd: product.price_usd,
                price_eur: product.price_eur
            })
            .eq('id', product.id);

        if (error) {
            toast.error('Hata oluştu: ' + error.message);
        } else {
            toast.success('Kaydedildi! Şimdi diğer dilde test edebilirsiniz.');
        }
    };

    if (loading) return <div className="p-10">Yükleniyor...</div>;

    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-6 text-red-600">Admin / Çeviri Yönetim Paneli (Demo)</h1>
            <p className="mb-8 text-muted-foreground">
                Burada ürünlerin "İngilizce" karşılıklarını ve "Döviz" fiyatlarını girebilirsiniz.
                Kaydettikten sonra siteyi İngilizce (veya yurt dışından) gezenler bu değerleri görecek.
            </p>

            <div className="grid gap-6">
                {products.map(product => (
                    <div key={product.id} className="border p-6 rounded-lg bg-card shadow-sm">
                        <div className="mb-4 pb-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">{product.name} <span className="text-sm font-normal text-muted-foreground">(Orijinal TR)</span></h3>
                            <span className="badge badge-outline">{product.price} ₺</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* English Info */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm uppercase text-blue-600">🇬🇧 İngilizce Bilgiler</h4>
                                <div>
                                    <label className="block text-xs mb-1">Product Name (EN)</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={product.name_en || ''}
                                        onChange={e => updateProduct(product.id, 'name_en', e.target.value)}
                                        placeholder={product.name} // Placeholder as fallback
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1">Description (EN)</label>
                                    <textarea
                                        className="w-full border p-2 rounded text-sm"
                                        rows={3}
                                        value={product.description_en || ''}
                                        onChange={e => updateProduct(product.id, 'description_en', e.target.value)}
                                        placeholder="Enter English description..."
                                    />
                                </div>
                            </div>

                            {/* Currency Info */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm uppercase text-green-600">💲 Global Fiyatlar</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs mb-1">Price (USD $)</label>
                                        <input
                                            type="number"
                                            className="w-full border p-2 rounded"
                                            value={product.price_usd || ''}
                                            onChange={e => updateProduct(product.id, 'price_usd', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1">Price (EUR €)</label>
                                        <input
                                            type="number"
                                            className="w-full border p-2 rounded"
                                            value={product.price_eur || ''}
                                            onChange={e => updateProduct(product.id, 'price_eur', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={() => saveProduct(product)}
                                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition"
                                    >
                                        <Save className="w-4 h-4" />
                                        Kaydet & Güncelle
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
