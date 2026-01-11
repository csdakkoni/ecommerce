'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Ürünler</h2>
                    <p className="text-muted-foreground">Mağazanızdaki kumaşları yönetin.</p>
                </div>
                <Link href="/admin/products/new" className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Yeni Ürün Ekle
                </Link>
            </div>

            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Ürün Ara..."
                    className="w-full max-w-sm pl-10 pr-4 py-2 border rounded-md bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        Ürün bulunamadı.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="p-4 font-medium text-sm">Ürün Adı</th>
                                <th className="p-4 font-medium text-sm">Kategori</th>
                                <th className="p-4 font-medium text-sm">Fiyat</th>
                                <th className="p-4 font-medium text-sm">Durum</th>
                                <th className="p-4 font-medium text-sm text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="border-b hover:bg-muted/30">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                                {product.images && product.images[0] ? (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-muted-foreground">{product.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">{product.categories?.name || '-'}</td>
                                    <td className="p-4 text-sm">
                                        <span className="font-medium">{product.price} ₺</span>
                                        {product.sale_price && (
                                            <span className="text-xs text-red-500 ml-2 line-through">{product.sale_price} ₺</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                                            {product.is_active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link href={`/admin/products/${product.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md inline-block mr-1">
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(product.id)}
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
