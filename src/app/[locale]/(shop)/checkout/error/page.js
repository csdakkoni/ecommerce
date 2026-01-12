'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/navigation';
import { XCircle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';

export default function CheckoutErrorPage() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');
    const message = searchParams.get('message');
    const locale = useLocale();

    const errorMessages = {
        no_token: locale === 'tr' ? 'Ödeme oturumu bulunamadı.' : 'Payment session not found.',
        order_not_found: locale === 'tr' ? 'Sipariş bulunamadı.' : 'Order not found.',
        payment_failed: locale === 'tr' ? 'Ödeme işlemi başarısız oldu.' : 'Payment failed.',
        payment_error: locale === 'tr' ? 'Ödeme sırasında bir hata oluştu.' : 'An error occurred during payment.',
        server_error: locale === 'tr' ? 'Sunucu hatası oluştu.' : 'Server error occurred.',
        default: locale === 'tr' ? 'Bir hata oluştu.' : 'An error occurred.'
    };

    const errorTitle = errorMessages[reason] || errorMessages.default;
    const errorDetail = message ? decodeURIComponent(message) : null;

    const labels = {
        title: locale === 'tr' ? 'Ödeme Başarısız' : 'Payment Failed',
        tryAgain: locale === 'tr' ? 'Tekrar Dene' : 'Try Again',
        backToCart: locale === 'tr' ? 'Sepete Dön' : 'Back to Cart',
        contactSupport: locale === 'tr' ? 'Destek Al' : 'Get Support',
        possibleReasons: locale === 'tr' ? 'Olası Nedenler:' : 'Possible Reasons:',
        reason1: locale === 'tr' ? 'Kart bilgileri hatalı olabilir' : 'Card information may be incorrect',
        reason2: locale === 'tr' ? 'Yetersiz bakiye' : 'Insufficient balance',
        reason3: locale === 'tr' ? '3D Secure doğrulaması reddedildi' : '3D Secure verification rejected',
        reason4: locale === 'tr' ? 'Kart limiti aşıldı' : 'Card limit exceeded',
    };

    return (
        <div className="container py-16 max-w-2xl mx-auto text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
            </div>

            <h1 className="text-3xl font-bold mb-2">{labels.title}</h1>
            <p className="text-muted-foreground mb-4">{errorTitle}</p>

            {errorDetail && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg p-4 mb-8 max-w-md mx-auto">
                    <p className="text-sm">{errorDetail}</p>
                </div>
            )}

            {/* Possible Reasons */}
            <div className="bg-muted/50 rounded-lg p-6 mb-8 max-w-md mx-auto text-left">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    {labels.possibleReasons}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• {labels.reason1}</li>
                    <li>• {labels.reason2}</li>
                    <li>• {labels.reason3}</li>
                    <li>• {labels.reason4}</li>
                </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cart" className="btn btn-outline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {labels.backToCart}
                </Link>
                <Link href="/checkout" className="btn btn-primary flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    {labels.tryAgain}
                </Link>
            </div>

            {/* Support Link */}
            <div className="mt-8">
                <Link href="/contact" className="text-sm text-primary hover:underline flex items-center gap-1 justify-center">
                    <HelpCircle className="w-4 h-4" />
                    {labels.contactSupport}
                </Link>
            </div>
        </div>
    );
}
