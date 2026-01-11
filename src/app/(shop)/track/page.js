'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Package, Truck, CheckCircle, Clock, Search, XCircle } from 'lucide-react';

const statusSteps = [
    { key: 'pending', label: 'Sipariş Alındı', icon: Clock },
    { key: 'paid', label: 'Ödeme Onaylandı', icon: CheckCircle },
    { key: 'preparing', label: 'Hazırlanıyor', icon: Package },
    { key: 'shipped', label: 'Kargoya Verildi', icon: Truck },
    { key: 'delivered', label: 'Teslim Edildi', icon: CheckCircle },
];

export default function TrackOrderPage() {
    const [orderNumber, setOrderNumber] = useState('');
    const [email, setEmail] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setOrder(null);

        // Search by order ID (first 8 chars) or full ID
        const searchId = orderNumber.replace('#', '').toLowerCase();

        const { data, error: fetchError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .or(`id.ilike.${searchId}%,guest_email.eq.${email}`)
            .limit(1)
            .single();

        if (fetchError || !data) {
            setError('Sipariş bulunamadı. Lütfen bilgilerinizi kontrol edin.');
        } else {
            // Verify email matches
            if (data.guest_email?.toLowerCase() !== email.toLowerCase()) {
                setError('E-posta adresi sipariş ile eşleşmiyor.');
            } else {
                setOrder(data);
            }
        }
        setLoading(false);
    };

    const getCurrentStepIndex = () => {
        if (!order) return -1;
        if (order.status === 'cancelled') return -1;
        return statusSteps.findIndex(s => s.key === order.status);
    };

    const currentStep = getCurrentStepIndex();

    return (
        <div className="container py-12 max-w-2xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="h2 mb-4">Sipariş Takip</h1>
                <p className="text-muted-foreground">
                    Siparişinizin durumunu öğrenmek için sipariş numaranızı ve e-posta adresinizi girin.
                </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="card p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Sipariş Numarası</label>
                        <input
                            type="text"
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            placeholder="#A1B2C3D4"
                            required
                            className="w-full border rounded-md p-3 bg-background"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">E-posta Adresi</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@email.com"
                            required
                            className="w-full border rounded-md p-3 bg-background"
                        />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary w-full h-12">
                    {loading ? 'Aranıyor...' : (
                        <>
                            <Search className="w-4 h-4 mr-2" />
                            Siparişi Sorgula
                        </>
                    )}
                </button>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Order Result */}
            {order && (
                <div className="card p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-lg">Sipariş #{order.id.substring(0, 8).toUpperCase()}</h3>
                            <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('tr-TR', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-lg">{order.total_amount?.toFixed(2)} ₺</div>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    {order.status === 'cancelled' ? (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-center gap-3 text-red-700 dark:text-red-400">
                            <XCircle className="w-6 h-6" />
                            <div>
                                <div className="font-semibold">Sipariş İptal Edildi</div>
                                <p className="text-sm">Bu sipariş iptal edilmiştir.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8">
                            <div className="flex items-center justify-between relative">
                                {/* Progress Line */}
                                <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted z-0">
                                    <div
                                        className="h-full bg-primary transition-all duration-500"
                                        style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                                    ></div>
                                </div>

                                {statusSteps.map((step, index) => {
                                    const StepIcon = step.icon;
                                    const isCompleted = index <= currentStep;
                                    const isCurrent = index === currentStep;

                                    return (
                                        <div key={step.key} className="flex flex-col items-center z-10">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCompleted
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                                } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                                                <StepIcon className="w-5 h-5" />
                                            </div>
                                            <span className={`text-xs mt-2 text-center max-w-[80px] ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                                                }`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tracking Info */}
                    {order.tracking_number && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Kargo Bilgisi</div>
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="text-sm text-muted-foreground">Kargo Firması: </span>
                                    <span className="font-semibold">{order.tracking_company || 'Belirtilmedi'}</span>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Takip No: </span>
                                    <span className="font-mono font-semibold">{order.tracking_number}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    <div>
                        <h4 className="font-semibold mb-3">Sipariş Detayı</h4>
                        <div className="space-y-2 border-t pt-3">
                            {order.order_items?.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span>{item.product_name} {item.variant_name && `(${item.variant_name})`}</span>
                                    <span className="text-muted-foreground">{item.quantity} x {item.price} ₺</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold mb-2">Teslimat Adresi</h4>
                        <p className="text-sm text-muted-foreground">
                            {order.shipping_address?.address}, {order.shipping_address?.district}, {order.shipping_address?.city}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
