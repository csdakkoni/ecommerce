'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { Share2, Heart, MessageCircle, Truck, Shield, RefreshCw, Ruler, Package, Scissors } from 'lucide-react';
import ProductInquiryModal from '@/components/ProductInquiryModal';
import MetreSelector from '@/components/MetreSelector';
import SampleRequestModal from '@/components/SampleRequestModal';
import ProductOptions from '@/components/ProductOptions';

export default function ProductDetailPage({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const t = useTranslations('Product');
    const locale = useLocale();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [inquiryOpen, setInquiryOpen] = useState(false);
    const [sampleRequestOpen, setSampleRequestOpen] = useState(false);
    const [optionGroups, setOptionGroups] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [calculatedPrice, setCalculatedPrice] = useState(null);

    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const toast = useToast();

    useEffect(() => {
        async function fetchProduct() {
            const { data, error } = await supabase
                .from('products')
                .select('*, variants(*)')
                .eq('id', id)
                .single();

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }

            setProduct(data);

            // Fetch option groups if product has variants
            if (data?.has_variants) {
                const { data: groups, error: groupsError } = await supabase
                    .from('product_option_groups')
                    .select(`
                        *,
                        values:product_option_values(*)
                    `)
                    .eq('product_id', id)
                    .order('sort_order', { ascending: true });

                if (!groupsError && groups) {
                    // Sort values within each group
                    const sortedGroups = groups.map(group => ({
                        ...group,
                        values: (group.values || []).sort((a, b) =>
                            (a.sort_order || 0) - (b.sort_order || 0)
                        )
                    }));
                    setOptionGroups(sortedGroups);

                    // Set default selections
                    const defaults = {};
                    sortedGroups.forEach(group => {
                        const defaultValue = group.values?.find(v => v.is_default && v.is_available);
                        if (defaultValue) {
                            defaults[group.id] = defaultValue.id;
                        } else if (group.values?.length > 0) {
                            // If no default, select first available
                            const firstAvailable = group.values.find(v => v.is_available);
                            if (firstAvailable) {
                                defaults[group.id] = firstAvailable.id;
                            }
                        }
                    });
                    setSelectedOptions(defaults);
                }
            }

            setLoading(false);
        }
        if (id) fetchProduct();
    }, [id]);

    const getPriceDisplay = () => {
        if (!product) return { amount: 0, saleAmount: null, currency: '₺' };
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

    const { amount, saleAmount, currency } = getPriceDisplay();

    // Get the final price (considering variants if any)
    const getFinalPrice = () => {
        if (calculatedPrice?.finalPrice) {
            return calculatedPrice.finalPrice;
        }
        return saleAmount || amount;
    };

    const handleOptionChange = (groupId, valueId) => {
        setSelectedOptions(prev => ({
            ...prev,
            [groupId]: valueId
        }));
    };

    const handleAddToCart = () => {
        // Prepare product with variant info
        const productWithOptions = {
            ...product,
            price: getFinalPrice(),
            sale_price: null, // Already factored in
            selected_options: optionGroups.length > 0 ? selectedOptions : null,
            options_display: optionGroups.length > 0 ? getOptionsDisplayText() : null
        };
        addToCart(productWithOptions, quantity);
        toast.success(t('addedToCart'));
    };

    // Get display text for selected options
    const getOptionsDisplayText = () => {
        const parts = [];
        optionGroups.forEach(group => {
            const valueId = selectedOptions[group.id];
            const value = group.values?.find(v => v.id === valueId);
            if (value) {
                parts.push(locale === 'en' && value.value_en ? value.value_en : value.value);
            }
        });
        return parts.join(', ');
    };

    const handleToggleFavorite = () => {
        toggleFavorite(product);
        if (isFavorite(product.id)) {
            toast.info(t('favoriteRemoved'));
        } else {
            toast.success(t('favoriteAdded'));
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.name,
                    text: `Bu harika kumaşı görmelisin: ${product.name}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Link kopyalandı!');
        }
    };

    if (loading) return <div className="container py-24 text-center">Yükleniyor...</div>;
    if (!product) return <div className="container py-24 text-center">Ürün bulunamadı.</div>;

    const isFav = isFavorite(product.id);

    return (
        <div className="container py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Images */}
                <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 dark:bg-zinc-900 rounded-lg overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                            <img
                                src={product.images[selectedImage]}
                                alt={locale === 'en' && product.name_en ? product.name_en : product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                {t('fabricType')}
                            </div>
                        )}
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-4">
                            {product.images.slice(0, 4).map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`aspect-square bg-gray-50 dark:bg-zinc-800 rounded-lg overflow-hidden ${selectedImage === i ? 'ring-2 ring-primary' : 'hover:ring-2 ring-primary/50'}`}
                                >
                                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div>
                    <div className="mb-2 text-sm text-primary font-semibold uppercase tracking-wider">
                        {product.fabric_type || 'Premium'}
                    </div>
                    <h1 className="text-4xl font-bold mb-4">{locale === 'en' && product.name_en ? product.name_en : product.name}</h1>

                    {/* Price Display - Static or Dynamic based on variants */}
                    <div className="text-2xl font-medium mb-2">
                        {optionGroups.length > 0 && calculatedPrice ? (
                            // Variant pricing
                            <>
                                <span className={calculatedPrice.finalPrice !== calculatedPrice.basePrice ? 'text-primary' : ''}>
                                    {calculatedPrice.finalPrice.toFixed(2)} {currency}
                                </span>
                                {calculatedPrice.finalPrice !== calculatedPrice.basePrice && (
                                    <span className="text-sm text-muted-foreground font-normal ml-2">
                                        ({locale === 'en' ? 'Base' : 'Baz'}: {calculatedPrice.basePrice} {currency})
                                    </span>
                                )}
                            </>
                        ) : saleAmount ? (
                            // Sale pricing
                            <>
                                <span className="text-red-500">{saleAmount} {currency}</span>
                                <span className="text-lg text-muted-foreground line-through ml-3">{amount} {currency}</span>
                            </>
                        ) : (
                            // Regular pricing
                            <>{amount} {currency}</>
                        )}
                        <span className="text-sm text-muted-foreground font-normal ml-2">
                            / {product.unit_type === 'metre' ? 'metre' : 'adet'}
                        </span>
                    </div>

                    {/* Unit Type Badge */}
                    <div className="flex items-center gap-2 mb-6">
                        {product.unit_type === 'metre' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                                <Ruler className="w-3 h-3" />
                                Metraj Bazlı Satış
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                                <Package className="w-3 h-3" />
                                Adet Satış
                            </span>
                        )}
                    </div>

                    <div className="prose prose-sm dark:prose-invert mb-8 text-muted-foreground">
                        {locale === 'en' && product.description_en ? product.description_en : product.description}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8 border-y border-gray-100 dark:border-zinc-800 py-6">
                        <div>
                            <span className="block text-xs uppercase text-muted-foreground mb-1">{t('fabricType')}</span>
                            <span className="font-medium">{product.fabric_type || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs uppercase text-muted-foreground mb-1">{t('width')}</span>
                            <span className="font-medium">{product.width_cm ? `${product.width_cm} cm` : '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs uppercase text-muted-foreground mb-1">{t('weight')}</span>
                            <span className="font-medium">{product.weight_gsm ? `${product.weight_gsm} gr/m²` : '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs uppercase text-muted-foreground mb-1">{t('pattern')}</span>
                            <span className="font-medium">{product.pattern || '-'}</span>
                        </div>
                    </div>

                    {/* Product Options / Variants */}
                    {optionGroups.length > 0 && (
                        <div className="mb-8">
                            <ProductOptions
                                product={product}
                                optionGroups={optionGroups}
                                selectedOptions={selectedOptions}
                                onOptionChange={handleOptionChange}
                                onPriceChange={setCalculatedPrice}
                                currency={currency}
                            />
                        </div>
                    )}

                    {/* Quantity Selector - MetreSelector for fabric, simple for others */}
                    <div className="mb-6">
                        <MetreSelector
                            unitType={product.unit_type || 'adet'}
                            minQuantity={parseFloat(product.min_order_quantity) || (product.unit_type === 'metre' ? 0.5 : 1)}
                            stepQuantity={parseFloat(product.step_quantity) || (product.unit_type === 'metre' ? 0.5 : 1)}
                            maxQuantity={100}
                            value={quantity}
                            onChange={setQuantity}
                            price={getFinalPrice()}
                            currency={currency}
                            showPrice={true}
                            size="default"
                        />
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        className="btn btn-primary w-full h-14 text-lg mb-6"
                    >
                        {t('addToCart')} • {(getFinalPrice() * quantity).toFixed(2)} {currency}
                    </button>

                    {/* Secondary Actions */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {/* Sample Request - Only for fabric/metre products */}
                        {product.unit_type === 'metre' && (
                            <button
                                onClick={() => setSampleRequestOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-md border border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
                            >
                                <Scissors className="w-4 h-4" />
                                {locale === 'tr' ? 'Numune İste' : 'Request Sample'}
                            </button>
                        )}
                        <button
                            onClick={handleToggleFavorite}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${isFav ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600' : 'hover:bg-muted'}`}
                        >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                            {isFav ? t('favoriteAdded') : t('favoriteAdded').replace('!', '')}
                        </button>
                        <button
                            onClick={() => setInquiryOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {t('askSeller')}
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            {t('share')}
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
                        <div className="flex flex-col items-center gap-1">
                            <Truck className="w-5 h-5" />
                            <span>{t('fastShipping')}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Shield className="w-5 h-5" />
                            <span>{t('securePayment')}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <RefreshCw className="w-5 h-5" />
                            <span>{t('easyReturn')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inquiry Modal */}
            <ProductInquiryModal
                product={product}
                isOpen={inquiryOpen}
                onClose={() => setInquiryOpen(false)}
            />

            {/* Sample Request Modal */}
            <SampleRequestModal
                product={product}
                isOpen={sampleRequestOpen}
                onClose={() => setSampleRequestOpen(false)}
            />
        </div>
    );
}
