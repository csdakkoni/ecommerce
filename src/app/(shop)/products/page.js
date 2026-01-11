'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { SlidersHorizontal, X, Package } from 'lucide-react';

function ProductListContent() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
    const [selectedPattern, setSelectedPattern] = useState('');
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const [sortBy, setSortBy] = useState('newest');

    const fabricTypes = ['Pamuk', 'İpek', 'Keten', 'Kadife', 'Polyester', 'Yün', 'Karışım'];
    const patterns = ['Düz', 'Çizgili', 'Kareli', 'Çiçekli', 'Geometrik', 'Desenli'];

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setProducts(data || []);
        setLoading(false);
    }

    // Apply filters
    const filteredProducts = products.filter(product => {
        if (selectedType && product.fabric_type !== selectedType) return false;
        if (selectedPattern && product.pattern !== selectedPattern) return false;
        if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
        return true;
    });

    // Apply sorting
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'name':
                return a.name.localeCompare(b.name);
            default: // newest
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });

    const clearFilters = () => {
        setSelectedType('');
        setSelectedPattern('');
        setPriceRange([0, 10000]);
    };

    const hasActiveFilters = selectedType || selectedPattern || priceRange[0] > 0 || priceRange[1] < 10000;

    return (
        <div className="container py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <nav className="text-sm text-muted-foreground mb-2">Anasayfa / Kumaşlar</nav>
                    <h1 className="text-4xl font-bold tracking-tight">Kumaş Koleksiyonu</h1>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="md:hidden btn btn-outline flex items-center gap-2"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtreler
                    </button>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="border border-gray-200 dark:border-zinc-800 rounded-md px-4 py-2 bg-transparent text-sm"
                    >
                        <option value="newest">Sıralama: En Yeni</option>
                        <option value="price-low">Fiyat: Düşükten Yükseğe</option>
                        <option value="price-high">Fiyat: Yüksekten Düşüğe</option>
                        <option value="name">İsim: A-Z</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-8 pr-8 border-r border-gray-100 dark:border-zinc-800`}>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            <X className="w-4 h-4" /> Filtreleri Temizle
                        </button>
                    )}

                    {/* Fabric Type Filter */}
                    <div>
                        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Kumaş Tipi</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <button
                                    onClick={() => setSelectedType('')}
                                    className={`${!selectedType ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                                >
                                    Tümü
                                </button>
                            </li>
                            {fabricTypes.map((type) => (
                                <li key={type}>
                                    <button
                                        onClick={() => setSelectedType(type)}
                                        className={`${selectedType === type ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                                    >
                                        {type}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pattern Filter */}
                    <div>
                        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Desen</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <button
                                    onClick={() => setSelectedPattern('')}
                                    className={`${!selectedPattern ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                                >
                                    Tümü
                                </button>
                            </li>
                            {patterns.map((pattern) => (
                                <li key={pattern}>
                                    <button
                                        onClick={() => setSelectedPattern(pattern)}
                                        className={`${selectedPattern === pattern ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'} transition-colors`}
                                    >
                                        {pattern}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="col-span-3">
                    {/* Active Filters Tags */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {selectedType && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full text-sm">
                                    {selectedType}
                                    <button onClick={() => setSelectedType('')}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                            {selectedPattern && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full text-sm">
                                    {selectedPattern}
                                    <button onClick={() => setSelectedPattern('')}><X className="w-3 h-3" /></button>
                                </span>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
                        {loading ? (
                            <div className="col-span-3 text-center py-12 text-muted-foreground">Yükleniyor...</div>
                        ) : sortedProducts.length === 0 ? (
                            <div className="col-span-3 text-center py-12">
                                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground mb-4">Bu kriterlere uygun ürün bulunamadı.</p>
                                <button onClick={clearFilters} className="btn btn-outline">
                                    Filtreleri Temizle
                                </button>
                            </div>
                        ) : (
                            sortedProducts.map((product) => (
                                <Link key={product.id} href={`/products/${product.id}`} className="group">
                                    <div className="aspect-[3/4] bg-gray-100 dark:bg-zinc-900 rounded-md overflow-hidden mb-4 relative">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <Package className="w-12 h-12 opacity-50" />
                                            </div>
                                        )}
                                        {product.sale_price && (
                                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">İndirim</span>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-base mb-1 group-hover:underline decoration-1 underline-offset-4">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-1">{product.fabric_type}</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        {product.sale_price ? (
                                            <>
                                                <span className="text-red-500 font-semibold">{product.sale_price} ₺</span>
                                                <span className="text-muted-foreground line-through text-xs">{product.price} ₺</span>
                                            </>
                                        ) : (
                                            <span className="font-semibold">{product.price} ₺</span>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductListPage() {
    return (
        <Suspense fallback={<div className="container py-24 text-center">Yükleniyor...</div>}>
            <ProductListContent />
        </Suspense>
    );
}
