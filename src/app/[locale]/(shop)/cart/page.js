'use client';

import { useCart } from '@/context/CartContext';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';

export default function CartPage() {
    const t = useTranslations('Cart');
    const locale = useLocale();
    const { cart, removeFromCart, cartTotal } = useCart();

    // Currency helper
    const getCurrencySymbol = () => locale === 'tr' ? '₺' : '€';
    const getShippingThreshold = () => locale === 'tr' ? 500 : 50;
    const getShippingCost = () => locale === 'tr' ? 29.90 : 4.90;

    const formatPrice = (price) => {
        return `${price.toFixed(2)} ${getCurrencySymbol()}`;
    };

    if (cart.length === 0) {
        return (
            <div className="container py-24 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="h2 mb-4">{t('emptyTitle')}</h2>
                <p className="p mb-8">{t('emptyMessage')}</p>
                <Link href="/products" className="btn btn-primary">
                    {t('startShopping')}
                </Link>
            </div>
        );
    }

    const shippingCost = cartTotal >= getShippingThreshold() ? 0 : getShippingCost();
    const total = cartTotal + shippingCost;

    return (
        <div className="container py-12">
            <h1 className="h2 mb-8">{t('title')}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-6">
                    {cart.map((item) => (
                        <div key={`${item.id}-${item.variantId}-${item.optionsKey || ''}`} className="flex gap-6 p-4 border rounded-lg">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-900 rounded-md overflow-hidden flex-shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 dark:bg-zinc-800"></div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold">{locale === 'en' && item.name_en ? item.name_en : item.name}</h3>
                                        <button
                                            onClick={() => removeFromCart(item.id, item.variantId, item.optionsKey)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {item.variantName && <p className="text-sm text-gray-500">{item.variantName}</p>}
                                    {item.optionsDisplay && (
                                        <p className="text-sm text-primary mt-1">{item.optionsDisplay}</p>
                                    )}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-sm text-gray-500">
                                        {t('quantity')}: {item.quantity} × {formatPrice(item.price)}
                                    </div>
                                    <div className="font-bold">{formatPrice(item.price * item.quantity)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <div className="card p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4">{t('orderSummary')}</h3>
                        <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('subtotal')}</span>
                                <span>{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('shipping')}</span>
                                <span>{shippingCost === 0 ? t('free') : formatPrice(shippingCost)}</span>
                            </div>
                        </div>
                        <div className="border-t pt-4 flex justify-between font-bold text-lg mb-6">
                            <span>{t('total')}</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                        <Link href="/checkout" className="btn btn-primary w-full h-12">
                            {t('proceedToCheckout')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
