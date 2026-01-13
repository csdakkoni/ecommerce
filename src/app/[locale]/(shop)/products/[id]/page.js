'use client';

import { useEffect, useState, use } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import {
    Share2, Heart, MessageCircle, Truck, Shield, RefreshCw,
    Ruler, Package, Scissors, Maximize2, X, ChevronLeft, ChevronRight,
    AlertCircle, Check
} from 'lucide-react';
import ProductInquiryModal from '@/components/ProductInquiryModal';
import MetreSelector from '@/components/MetreSelector';
import SampleRequestModal from '@/components/SampleRequestModal';
import ProductOptions from '@/components/ProductOptions';
import { getOptimizedImageUrl } from '@/lib/media/utils';

export default function ProductDetailPage({ params }) {
    // Safety check for params
    const resolvedParams = params ? (typeof params.then === 'function' ? use(params) : params) : { id: null };
    const id = resolvedParams?.id;

    const t = useTranslations('Product');
    const locale = useLocale();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [inquiryOpen, setInquiryOpen] = useState(false);
    const [sampleRequestOpen, setSampleRequestOpen] = useState(false);
    const [optionGroups, setOptionGroups] = useState([]);
    const [productVariants, setProductVariants] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [calculatedPrice, setCalculatedPrice] = useState(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const toast = useToast();

    useEffect(() => {
        async function fetchProduct() {
            if (!id) return;

            const { data, error } = await supabase
                .from('products')
                .select('*, product_variants(*)')
                .eq('id', id)
                .single();

            if (error) {
                console.error(error);
                setLoading(false);
                return;
            }

            setProduct(data);
            if (data?.product_variants) {
                setProductVariants(data.product_variants);
            }

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
                    const sortedGroups = groups.map(group => ({
                        ...group,
                        values: (group.values || []).sort((a, b) =>
                            (a.sort_order || 0) - (b.sort_order || 0)
                        )
                    }));
                    setOptionGroups(sortedGroups);

                    const defaults = {};
                    sortedGroups.forEach(group => {
                        const defaultValue = group.values?.find(v => v.is_default && v.is_available);
                        if (defaultValue) {
                            defaults[group.id] = defaultValue.id;
                        } else if (group.values?.length > 0) {
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
        fetchProduct();
    }, [id]);

    // Resolve selected variant when options change
    useEffect(() => {
        if (optionGroups.length > 0 && productVariants.length > 0) {
            const currentCombination = {};
            optionGroups.forEach(group => {
                const valueId = selectedOptions[group.id];
                const value = group.values?.find(v => v.id === valueId);
                if (value) {
                    currentCombination[group.name] = value.value;
                }
            });

            const match = productVariants.find(pv =>
                JSON.stringify(pv.option_combination) === JSON.stringify(currentCombination)
            );
            setSelectedVariant(match);
        }
    }, [selectedOptions, optionGroups, productVariants]);

    const getPriceDisplay = () => {
        if (!product) return { amount: 0, saleAmount: null, currency: '₺' };

        // Use variant override if available
        if (selectedVariant?.price_override) {
            return {
                amount: parseFloat(selectedVariant.price_override),
                saleAmount: null,
                currency: '₺'
            };
        }

        if (locale !== 'tr' && product.price_eur) {
            return {
                amount: parseFloat(product.price_eur),
                saleAmount: product.sale_price_eur ? parseFloat(product.sale_price_eur) : null,
                currency: '€'
            };
        }
        return {
            amount: parseFloat(product.price || 0),
            saleAmount: product.sale_price ? parseFloat(product.sale_price) : null,
            currency: '₺'
        };
    };

    const { amount, saleAmount, currency } = getPriceDisplay();

    const getFinalPrice = () => {
        if (selectedVariant?.price_override) {
            return parseFloat(selectedVariant.price_override);
        }
        if (calculatedPrice?.finalPrice) {
            return parseFloat(calculatedPrice.finalPrice);
        }
        return saleAmount || amount;
    };

    const handleOptionChange = (groupId, valueId) => {
        setSelectedOptions(prev => ({ ...prev, [groupId]: valueId }));
    };

    const handleAddToCart = () => {
        if (selectedVariant && (selectedVariant.stock <= 0 || !selectedVariant.is_available)) {
            toast.error(t('outOfStock'));
            return;
        }

        const productWithOptions = {
            ...product,
            price: getFinalPrice(),
            sale_price: null,
            selected_variant_id: selectedVariant?.id,
            selected_options: optionGroups.length > 0 ? selectedOptions : null,
            options_display: optionGroups.length > 0 ? getOptionsDisplayText() : null
        };
        addToCart(productWithOptions, quantity);
        toast.success(t('addedToCart'));
    };

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
            } catch (err) { console.log('Share cancelled'); }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Link kopyalandı!');
        }
    };

    const nextImage = () => {
        if (!product.images || product.images.length <= 1) return;
        setSelectedImage((prev) => (prev + 1) % product.images.length);
    };

    const prevImage = () => {
        if (!product.images || product.images.length <= 1) return;
        setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    };

    const handleMainImageClick = () => {
        if (product.images && product.images.length > 1) nextImage();
        else setIsLightboxOpen(true);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isLightboxOpen) return;
            if (e.key === 'Escape') setIsLightboxOpen(false);
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, product?.images]);

    if (loading) return <div className="container py-24 text-center">Yükleniyor...</div>;
    if (!product) return <div className="container py-24 text-center">Ürün bulunamadı.</div>;

    const isFav = isFavorite(product.id);
    const isOutOfStock = selectedVariant ? (selectedVariant.stock <= 0 || !selectedVariant.is_available) : false;

    return (
        <div className="container py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Images */}
                <div className="space-y-4">
                    <div className="relative group aspect-square bg-gray-100 dark:bg-zinc-900 rounded-lg overflow-hidden cursor-pointer">
                        {product.images && product.images.length > 0 ? (
                            <>
                                <img
                                    src={getOptimizedImageUrl(product.images[selectedImage], { w: 1200, ar: '4:5' })}
                                    alt={locale === 'en' && product.name_en ? product.name_en : product.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onClick={handleMainImageClick}
                                />
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                                    className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black"
                                >
                                    <Maximize2 className="w-5 h-5" />
                                </button>
                                {product.images.length > 1 && (
                                    <>
                                        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                            {selectedImage + 1} / {product.images.length}
                                        </div>
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="p-1 bg-white/50 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black">
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                        </div>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="p-1 bg-white/50 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black">
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">{t('fabricType')}</div>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div>
                    <div className="mb-2 text-sm text-primary font-semibold uppercase tracking-wider">{product.fabric_type || 'Premium'}</div>
                    <h1 className="text-4xl font-bold mb-4">{locale === 'en' && product.name_en ? product.name_en : product.name}</h1>

                    {/* Price Display */}
                    <div className="text-2xl font-medium mb-2">
                        {selectedVariant?.price_override ? (
                            <span className="text-primary">{parseFloat(selectedVariant.price_override).toFixed(2)} {currency}</span>
                        ) : optionGroups.length > 0 && calculatedPrice ? (
                            <>
                                <span className={calculatedPrice.finalPrice !== calculatedPrice.basePrice ? 'text-primary' : ''}>
                                    {calculatedPrice.finalPrice.toFixed(2)} {currency}
                                </span>
                            </>
                        ) : saleAmount ? (
                            <>
                                <span className="text-red-500">{saleAmount} {currency}</span>
                                <span className="text-lg text-muted-foreground line-through ml-3">{amount} {currency}</span>
                            </>
                        ) : (
                            <>{amount} {currency}</>
                        )}
                        <span className="text-sm text-muted-foreground font-normal ml-2">/ {product.unit_type === 'metre' ? 'metre' : 'adet'}</span>
                    </div>

                    {/* Stock Status */}
                    {selectedVariant && (
                        <div className="mb-4">
                            {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    STOKTA YOK
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                    <Check className="w-3.5 h-3.5" />
                                    STOKTA VAR ({selectedVariant.stock} {product.unit_type === 'metre' ? 'mt' : 'adet'})
                                </span>
                            )}
                        </div>
                    )}

                    <div className="prose prose-sm dark:prose-invert mb-8 text-muted-foreground">
                        {locale === 'en' && product.description_en ? product.description_en : product.description}
                    </div>

                    {/* Options Component */}
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

                    {/* Quantity & Add to Cart */}
                    <div className="space-y-6">
                        <MetreSelector
                            unitType={product.unit_type || 'adet'}
                            minQuantity={parseFloat(product.min_order_quantity) || (product.unit_type === 'metre' ? 0.5 : 1)}
                            stepQuantity={parseFloat(product.step_quantity) || (product.unit_type === 'metre' ? 0.5 : 1)}
                            maxQuantity={selectedVariant ? selectedVariant.stock : 100}
                            value={quantity}
                            onChange={setQuantity}
                            price={getFinalPrice()}
                            currency={currency}
                            showPrice={true}
                            size="default"
                        />

                        <button
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className={`btn w-full h-14 text-lg mb-6 ${isOutOfStock ? 'bg-gray-200 cursor-not-allowed text-gray-400' : 'btn-primary'}`}
                        >
                            {isOutOfStock ? 'STOKTA YOK' : `${t('addToCart')} • ${(getFinalPrice() * quantity).toFixed(2)} ${currency}`}
                        </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {product.unit_type === 'metre' && (
                            <button onClick={() => setSampleRequestOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-md border border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary transition-colors">
                                <Scissors className="w-4 h-4" /> {locale === 'tr' ? 'Numune İste' : 'Request Sample'}
                            </button>
                        )}
                        <button onClick={handleToggleFavorite} className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${isFav ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600' : 'hover:bg-muted'}`}>
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} /> {isFav ? t('favoriteAdded') : t('favoriteAdded').replace('!', '')}
                        </button>
                        <button onClick={() => setInquiryOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors">
                            <MessageCircle className="w-4 h-4" /> {t('askSeller')}
                        </button>
                        <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors">
                            <Share2 className="w-4 h-4" /> {t('share')}
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
                        <div className="flex flex-col items-center gap-1"><Truck className="w-5 h-5" /><span>{t('fastShipping')}</span></div>
                        <div className="flex flex-col items-center gap-1"><Shield className="w-5 h-5" /><span>{t('securePayment')}</span></div>
                        <div className="flex flex-col items-center gap-1"><RefreshCw className="w-5 h-5" /><span>{t('easyReturn')}</span></div>
                    </div>
                </div>
            </div>

            <ProductInquiryModal product={product} isOpen={inquiryOpen} onClose={() => setInquiryOpen(false)} />
            <SampleRequestModal product={product} isOpen={sampleRequestOpen} onClose={() => setSampleRequestOpen(false)} />

            {isLightboxOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-12 animate-in fade-in duration-300">
                    <button onClick={() => setIsLightboxOpen(false)} className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors">
                        <X className="w-8 h-8" />
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center">
                        {product.images?.length > 1 && (
                            <>
                                <button onClick={prevImage} className="absolute left-0 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><ChevronLeft className="w-10 h-10" /></button>
                                <button onClick={nextImage} className="absolute right-0 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><ChevronRight className="w-10 h-10" /></button>
                            </>
                        )}
                        <img src={product.images[selectedImage]} alt={product.name} className="max-w-full max-h-full object-contain select-none" />
                        {product.images?.length > 1 && (
                            <div className="absolute bottom-0 text-white/70 text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                                {selectedImage + 1} / {product.images.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
