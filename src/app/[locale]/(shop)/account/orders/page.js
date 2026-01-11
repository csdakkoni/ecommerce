'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function OrdersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    async function fetchOrders() {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, images))')
            .eq('guest_email', user.email)
            .order('created_at', { ascending: false });

        if (!error) {
            setOrders(data || []);
        }
        setLoading(false);
    }

    const statusConfig = {
        pending: { label: 'Beklemede', icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
        paid: { label: 'Ödendi', icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
        preparing: { label: 'Hazırlanıyor', icon: Package, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
        shipped: { label: 'Kargolandı', icon: Truck, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
        delivered: { label: 'Teslim Edildi', icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
        cancelled: { label: 'İptal', icon: XCircle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
    };

    if (authLoading || loading) {
        return (
            <div className="container py-24 text-center">
                <div className="animate-pulse text-muted-foreground">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="container py-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/account" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Hesabıma Dön
                </Link>

                <h1 className="text-3xl font-bold mb-8">Siparişlerim</h1>

                {orders.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h2 className="text-xl font-semibold mb-2">Henüz siparişiniz yok</h2>
                        <p className="text-muted-foreground mb-6">
                            Alışverişe başlayarak ilk siparişinizi verin.
                        </p>
                        <Link href="/products" className="btn btn-primary">
                            Alışverişe Başla
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const status = statusConfig[order.status] || statusConfig.pending;
                            const StatusIcon = status.icon;

                            return (
                                <div key={order.id} className="card overflow-hidden">
                                    {/* Order Header */}
                                    <div className="p-4 border-b bg-muted/30 flex flex-wrap justify-between items-center gap-4">
                                        <div>
                                            <p className="font-medium">Sipariş #{order.id.substring(0, 8).toUpperCase()}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString('tr-TR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                                            <StatusIcon className="w-4 h-4" />
                                            {status.label}
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="p-4">
                                        <div className="space-y-4">
                                            {order.order_items?.slice(0, 3).map((item, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                                        {item.products?.images?.[0] ? (
                                                            <img src={item.products.images[0]} alt={item.products.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="w-6 h-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{item.products?.name || 'Ürün'}</p>
                                                        <p className="text-sm text-muted-foreground">{item.quantity} adet × {item.price?.toFixed(2)} ₺</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {order.order_items?.length > 3 && (
                                                <p className="text-sm text-muted-foreground">
                                                    +{order.order_items.length - 3} ürün daha
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Footer */}
                                    <div className="p-4 border-t bg-muted/30 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Toplam</p>
                                            <p className="font-bold text-lg">{order.total_amount?.toFixed(2)} ₺</p>
                                        </div>
                                        <Link href={`/track?order=${order.id.substring(0, 8)}`} className="btn btn-outline text-sm">
                                            Siparişi Takip Et <ChevronRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
