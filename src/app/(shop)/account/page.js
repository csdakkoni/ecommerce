'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { User, Package, MapPin, LogOut, ChevronRight } from 'lucide-react';

export default function AccountPage() {
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    async function fetchOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (!error) {
            setOrders(data || []);
        }
        setOrdersLoading(false);
    }

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="container py-24 text-center">
                <div className="animate-pulse">Yükleniyor...</div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    return (
        <div className="container py-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Hesabım</h1>
                    <p className="text-muted-foreground">Hoş geldiniz, {user.user_metadata?.first_name || user.email}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar */}
                    <div className="card p-4">
                        <nav className="space-y-1">
                            <Link href="/account" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted font-medium">
                                <User className="w-5 h-5" />
                                Profilim
                            </Link>
                            <Link href="/account/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                <Package className="w-5 h-5" />
                                Siparişlerim
                            </Link>
                            <Link href="/account/addresses" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
                                <MapPin className="w-5 h-5" />
                                Adreslerim
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors w-full text-left"
                            >
                                <LogOut className="w-5 h-5" />
                                Çıkış Yap
                            </button>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Profile Card */}
                        <div className="card p-6">
                            <h2 className="font-semibold text-lg mb-4">Profil Bilgileri</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block mb-1">Ad Soyad</span>
                                    <span className="font-medium">
                                        {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1">E-posta</span>
                                    <span className="font-medium">{user.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="card p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-semibold text-lg">Son Siparişler</h2>
                                <Link href="/account/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                                    Tümünü Gör <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {ordersLoading ? (
                                <p className="text-muted-foreground text-sm">Yükleniyor...</p>
                            ) : orders.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Henüz siparişiniz bulunmuyor.</p>
                            ) : (
                                <div className="space-y-3">
                                    {orders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/track?order=${order.id.substring(0, 8)}&email=${user.email}`}
                                            className="flex justify-between items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div>
                                                <span className="font-mono text-sm font-semibold">
                                                    #{order.id.substring(0, 8).toUpperCase()}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    {new Date(order.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium">{order.total_amount?.toFixed(2)} ₺</div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
