'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order');

    return (
        <div className="container py-24 text-center max-w-xl mx-auto">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="h2 mb-4">Siparişiniz Alındı!</h1>
            <p className="text-muted-foreground mb-8">
                Teşekkür ederiz! Siparişiniz başarıyla oluşturuldu.
                E-posta adresinize sipariş detayları gönderilecektir.
            </p>

            {orderId && (
                <div className="bg-muted rounded-lg p-4 mb-8 text-sm">
                    <span className="text-muted-foreground">Sipariş Numarası: </span>
                    <span className="font-mono font-semibold">{orderId.substring(0, 8).toUpperCase()}</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/products" className="btn btn-primary">
                    Alışverişe Devam Et
                </Link>
                <Link href="/" className="btn btn-outline">
                    Anasayfaya Dön
                </Link>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div className="container py-24 text-center">Yükleniyor...</div>}>
            <CheckoutSuccessContent />
        </Suspense>
    );
}
