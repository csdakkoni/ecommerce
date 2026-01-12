'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/navigation';
import { useCart } from '@/context/CartContext';
import { CheckCircle, Package, Truck, Mail, ArrowRight } from 'lucide-react';

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const locale = useLocale();
    const { clearCart } = useCart();

    useEffect(() => {
        // Clear cart on success
        clearCart();
    }, []);

    const labels = {
        title: locale === 'tr' ? 'Siparişiniz Alındı!' : 'Order Confirmed!',
        subtitle: locale === 'tr'
            ? 'Teşekkür ederiz. Siparişiniz başarıyla oluşturuldu.'
            : 'Thank you. Your order has been successfully placed.',
        orderNumber: locale === 'tr' ? 'Sipariş Numarası' : 'Order Number',
        emailSent: locale === 'tr'
            ? 'Sipariş detayları e-posta adresinize gönderildi.'
            : 'Order details have been sent to your email.',
        step1: locale === 'tr' ? 'Sipariş Alındı' : 'Order Received',
        step2: locale === 'tr' ? 'Hazırlanıyor' : 'Processing',
        step3: locale === 'tr' ? 'Kargoya Verildi' : 'Shipped',
        step4: locale === 'tr' ? 'Teslim Edildi' : 'Delivered',
        continueShopping: locale === 'tr' ? 'Alışverişe Devam Et' : 'Continue Shopping',
        viewOrders: locale === 'tr' ? 'Siparişlerimi Gör' : 'View My Orders',
    };

    return (
        <div className="container py-16 max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold mb-2">{labels.title}</h1>
            <p className="text-muted-foreground mb-8">{labels.subtitle}</p>

            {/* Order Number */}
            {orderId && (
                <div className="inline-block bg-muted rounded-lg px-6 py-4 mb-8">
                    <p className="text-sm text-muted-foreground">{labels.orderNumber}</p>
                    <p className="text-2xl font-mono font-bold text-primary">
                        {orderId.substring(0, 8).toUpperCase()}
                    </p>
                </div>
            )}

            {/* Email notification */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-12">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{labels.emailSent}</span>
            </div>

            {/* Order Progress */}
            <div className="flex items-center justify-between mb-12 max-w-md mx-auto">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs mt-2">{labels.step1}</span>
                </div>
                <div className="flex-1 h-1 bg-muted mx-2" />
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-xs mt-2 text-muted-foreground">{labels.step2}</span>
                </div>
                <div className="flex-1 h-1 bg-muted mx-2" />
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-xs mt-2 text-muted-foreground">{labels.step3}</span>
                </div>
                <div className="flex-1 h-1 bg-muted mx-2" />
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-xs mt-2 text-muted-foreground">{labels.step4}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products" className="btn btn-outline flex items-center gap-2">
                    {labels.continueShopping}
                    <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/account/orders" className="btn btn-primary">
                    {labels.viewOrders}
                </Link>
            </div>
        </div>
    );
}
