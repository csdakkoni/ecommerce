'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { Minus, Plus, Share2, Heart, MessageCircle, Truck, Shield, RefreshCw } from 'lucide-react';
import ProductInquiryModal from '@/components/ProductInquiryModal';

export default function ProductDetailPage({ params }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [inquiryOpen, setInquiryOpen] = useState(false);

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

            if (error) console.error(error);
            else setProduct(data);
            setLoading(false);
        }
        if (id) fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        addToCart(product, quantity);
        toast.success('Ürün sepete eklendi!');
    };

    const handleToggleFavorite = () => {
        toggleFavorite(product);
        if (isFavorite(product.id)) {
            toast.info('Favorilerden çıkarıldı');
        } else {
            toast.success('Favorilere eklendi!');
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
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                Ürün Görseli
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
                        {product.fabric_type || 'Premium Koleksiyon'}
                    </div>
                    <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

                    <div className="text-2xl font-medium mb-6">
                        {product.sale_price ? (
                            <>
                                <span className="text-red-500">{product.sale_price} ₺</span>
                                <span className="text-lg text-muted-foreground line-through ml-3">{product.price} ₺</span>
                            </>
                        ) : (
                            <>{product.price} ₺</>
                        )}
                        <span className="text-sm text-muted-foreground font-normal ml-2">/ metre</span>
                    </div>

                    <div className="prose prose-sm dark:prose-invert mb-8 text-muted-foreground">
                        {product.description || "Bu özel kumaş tasarımcılar için özenle seçilmiştir."}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8 border-y border-gray-100 dark:border-zinc-800 py-6">
                        <div>
                            <span className="block text-xs uppercase text-muted-foreground mb-1">Kumaş Tipi</span>
                            <span className="font-medium">{product.fabric_type || '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs uppercase text-muted-foreground mb-1">Genişlik</span>
                            <span className="font-medium">{product.width_cm ? `${product.width_cm} cm` : '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs uppercase text-muted-foreground mb-1">Ağırlık</span>
                            <span className="font-medium">{product.weight_gsm ? `${product.weight_gsm} gr/m²` : '-'}</span>
                        </div>
                        <div>
                            <span className="block text-xs uppercase text-muted-foreground mb-1">Desen</span>
                            <span className="font-medium">{product.pattern || '-'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-md">
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="p-3 hover:bg-muted transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-medium">{quantity}</span>
                            <button
                                onClick={() => setQuantity(q => q + 1)}
                                className="p-3 hover:bg-muted transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="btn btn-primary flex-1 h-auto text-base"
                        >
                            Sepete Ekle
                        </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        <button
                            onClick={handleToggleFavorite}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${isFav ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600' : 'hover:bg-muted'}`}
                        >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                            {isFav ? 'Favorilerde' : 'Favorilere Ekle'}
                        </button>
                        <button
                            onClick={() => setInquiryOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Satıcıya Sor
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-muted transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            Paylaş
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
                        <div className="flex flex-col items-center gap-1">
                            <Truck className="w-5 h-5" />
                            <span>Hızlı Kargo</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Shield className="w-5 h-5" />
                            <span>Güvenli Ödeme</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <RefreshCw className="w-5 h-5" />
                            <span>Kolay İade</span>
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
        </div>
    );
}
