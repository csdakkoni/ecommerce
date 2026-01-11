'use client';

import Link from 'next/link';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { Heart, ShoppingBag, Trash2, Package } from 'lucide-react';

export default function FavoritesPage() {
    const { favorites, removeFromFavorites } = useFavorites();
    const { addToCart } = useCart();

    const handleAddToCart = (product) => {
        addToCart(product, 1);
        alert('Ürün sepete eklendi!');
    };

    return (
        <div className="container py-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Heart className="w-8 h-8 text-red-500" />
                    <h1 className="text-3xl font-bold">Favorilerim</h1>
                </div>

                {favorites.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h2 className="text-xl font-semibold mb-2">Favorileriniz boş</h2>
                        <p className="text-muted-foreground mb-6">
                            Beğendiğiniz ürünleri favorilere ekleyin ve daha sonra kolayca bulun.
                        </p>
                        <Link href="/products" className="btn btn-primary">
                            Alışverişe Başla
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((product) => (
                            <div key={product.id} className="card overflow-hidden group">
                                <Link href={`/products/${product.id}`}>
                                    <div className="aspect-square bg-muted relative">
                                        {product.images && product.images[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-12 h-12 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <div className="p-4">
                                    <Link href={`/products/${product.id}`}>
                                        <h3 className="font-medium mb-1 hover:underline">{product.name}</h3>
                                    </Link>
                                    <div className="flex items-center gap-2 mb-4">
                                        {product.sale_price ? (
                                            <>
                                                <span className="font-bold text-red-500">{product.sale_price} ₺</span>
                                                <span className="text-sm text-muted-foreground line-through">{product.price} ₺</span>
                                            </>
                                        ) : (
                                            <span className="font-bold">{product.price} ₺</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            className="btn btn-primary flex-1 text-sm h-10"
                                        >
                                            <ShoppingBag className="w-4 h-4 mr-1" />
                                            Sepete Ekle
                                        </button>
                                        <button
                                            onClick={() => removeFromFavorites(product.id)}
                                            className="btn btn-outline h-10 px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
