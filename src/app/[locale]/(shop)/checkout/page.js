'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useTranslations, useLocale } from 'next-intl';

export default function CheckoutPage() {
    const t = useTranslations('Checkout');
    const locale = useLocale();
    const { cart, cartTotal, removeFromCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Currency helper
    const getCurrencySymbol = () => locale === 'tr' ? '₺' : '€';
    const getShippingThreshold = () => locale === 'tr' ? 500 : 50;
    const getShippingCost = () => locale === 'tr' ? 29.90 : 4.90;
    const getCurrency = () => locale === 'tr' ? 'TRY' : 'EUR';

    const formatPrice = (price) => {
        return `${price.toFixed(2)} ${getCurrencySymbol()}`;
    };

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        zipCode: '',
        country: locale === 'tr' ? 'Türkiye' : '',
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const shippingCost = cartTotal >= getShippingThreshold() ? 0 : getShippingCost();
    const total = cartTotal + shippingCost;

    const handleSubmitOrder = async () => {
        setLoading(true);

        const orderData = {
            guest_email: formData.email,
            guest_info: {
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
            },
            shipping_address: {
                address: formData.address,
                city: formData.city,
                district: formData.district,
                zip_code: formData.zipCode,
                country: formData.country,
            },
            billing_address: {
                address: formData.address,
                city: formData.city,
                district: formData.district,
                zip_code: formData.zipCode,
                country: formData.country,
            },
            total_amount: total,
            currency: getCurrency(),
            locale: locale,
            status: 'pending',
        };

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) {
            alert('Error: ' + orderError.message);
            setLoading(false);
            return;
        }

        const orderItems = cart.map(item => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            variant_name: item.variantName,
            price: item.price,
            quantity: item.quantity,
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            alert('Error: ' + itemsError.message);
            setLoading(false);
            return;
        }

        localStorage.removeItem('grohnfabrics_cart');
        router.push(`/checkout/success?order=${order.id}`);
    };

    if (cart.length === 0) {
        return (
            <div className="container py-24 text-center">
                <h2 className="h2 mb-4">{t('emptyTitle')}</h2>
                <p className="text-muted-foreground mb-8">{t('emptyMessage')}</p>
                <button onClick={() => router.push('/products')} className="btn btn-primary">
                    {t('startShopping')}
                </button>
            </div>
        );
    }

    return (
        <div className="container py-12">
            <h1 className="h2 mb-8">{t('title')}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    {/* Step Indicator */}
                    <div className="flex items-center mb-8 border-b pb-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                            {t('step1')}
                        </div>
                        <div className="flex-1 h-px bg-border mx-4"></div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</span>
                            {t('step2')}
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">{t('contactInfo')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">{t('email')}</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" placeholder="example@email.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('firstName')}</label>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('lastName')}</label>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">{t('phone')}</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mt-8">{t('shippingAddress')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {locale !== 'tr' && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">{t('country')}</label>
                                        <input type="text" name="country" value={formData.country} onChange={handleChange} required
                                            className="w-full border rounded-md p-3 bg-background" />
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">{t('address')}</label>
                                    <textarea name="address" value={formData.address} onChange={handleChange} required rows={3}
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('city')}</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('district')}</label>
                                    <input type="text" name="district" value={formData.district} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('zipCode')}</label>
                                    <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange}
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                            </div>

                            <button onClick={() => setStep(2)} className="btn btn-primary w-full mt-6 h-12">
                                {t('continueToPayment')}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">{t('paymentMethod')}</h3>

                            <div className="border rounded-lg p-6 bg-muted/30">
                                <p className="text-sm text-muted-foreground mb-4">
                                    {t('paymentDemo')}
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('cardNumber')}</label>
                                        <input type="text" placeholder="1234 5678 9012 3456" disabled
                                            className="w-full border rounded-md p-3 bg-background opacity-60" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t('expiry')}</label>
                                            <input type="text" placeholder="MM/YY" disabled
                                                className="w-full border rounded-md p-3 bg-background opacity-60" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t('cvv')}</label>
                                            <input type="text" placeholder="123" disabled
                                                className="w-full border rounded-md p-3 bg-background opacity-60" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button onClick={() => setStep(1)} className="btn btn-outline flex-1 h-12">
                                    {t('goBack')}
                                </button>
                                <button onClick={handleSubmitOrder} disabled={loading} className="btn btn-primary flex-1 h-12">
                                    {loading ? t('processing') : t('completeOrder')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4">{t('orderSummary')}</h3>

                        <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                            {cart.map((item) => (
                                <div key={`${item.id}-${item.variantId}`} className="flex gap-3 text-sm">
                                    <div className="w-12 h-12 bg-muted rounded flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="font-medium line-clamp-1">{item.name}</p>
                                        <p className="text-muted-foreground">{item.quantity} x {formatPrice(item.price)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('subtotal')}</span>
                                <span>{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('shipping')}</span>
                                <span>{shippingCost === 0 ? t('free') : formatPrice(shippingCost)}</span>
                            </div>
                        </div>
                        <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                            <span>{t('total')}</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
