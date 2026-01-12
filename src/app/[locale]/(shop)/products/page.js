'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { SlidersHorizontal, X, Package } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/media/utils';

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

    const locale = useLocale();
    const t = useTranslations('Products');

    const getPriceDisplay = (product) => {
        // Fallback to TR logic if EUR is missing or locale is TR
        if (locale !== 'tr' && product.price_eur) {
            return {
                amount: product.price_eur,
                saleAmount: product.sale_price_eur,
                currency: '€'
            };
        }
        return {
            amount: product.price,
            saleAmount: product.sale_price,
            currency: '₺'
        };
    };

    return (
        <div className="container py-12">
            {/* ... header ... */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* ... filters ... */}

                {/* Products Grid */}
                <div className="col-span-3">
                    {/* ... active filters ... */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
                        {loading ? (
                            <div className="col-span-3 text-center py-12 text-muted-foreground">{t('loading')}</div>
                        ) : sortedProducts.length === 0 ? (
                            <div className="col-span-3 text-center py-12">
                                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground mb-4">{t('noProducts')}</p>
                                <button onClick={clearFilters} className="btn btn-outline">
                                    {t('clearFilters')}
                                </button>
                            </div>
                        ) : (
                            sortedProducts.map((product) => {
                                const { amount, saleAmount, currency } = getPriceDisplay(product);
                                return (
                                    <Link key={product.id} href={`/products/${product.id}`} className="group">
                                        <div className="aspect-[3/4] bg-gray-100 dark:bg-zinc-900 rounded-md overflow-hidden mb-4 relative">
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    src={getOptimizedImageUrl(product.images[0], { w: 600, ar: '3:4' })}
                                                    alt={locale === 'en' && product.name_en ? product.name_en : product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    <Package className="w-12 h-12 opacity-50" />
                                                </div>
                                            )}
                                            {saleAmount && (
                                                <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                                                    {locale === 'tr' ? 'İndirim' : 'SALE'}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-base mb-1 group-hover:underline decoration-1 underline-offset-4">
                                            {locale === 'en' && product.name_en ? product.name_en : product.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mb-1">{product.fabric_type}</p>
                                        <div className="flex items-center gap-2 text-sm">
                                            {saleAmount ? (
                                                <>
                                                    <span className="text-red-500 font-semibold">{saleAmount} {currency}</span>
                                                    <span className="text-muted-foreground line-through text-xs">{amount} {currency}</span>
                                                </>
                                            ) : (
                                                <span className="font-semibold">{amount} {currency}</span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductListPage() {
    const t = useTranslations('Products');
    return (
        <Suspense fallback={<div className="container py-24 text-center">{t('loading')}</div>}>
            <ProductListContent />
        </Suspense>
    );
}
