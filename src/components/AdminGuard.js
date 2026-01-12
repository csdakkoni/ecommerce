'use client';

/**
 * Admin Guard Component
 * Client-side protection layer for admin pages
 * Works in conjunction with server-side RLS policies
 */

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ShieldX, Loader2 } from 'lucide-react';
import { Link } from '@/navigation';

export default function AdminGuard({ children }) {
    const router = useRouter();
    const [status, setStatus] = useState('loading'); // loading, authorized, unauthorized, unauthenticated
    const [user, setUser] = useState(null);

    useEffect(() => {
        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setStatus('unauthenticated');
            } else {
                checkUserRole(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function checkAuth() {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            setStatus('unauthenticated');
            return;
        }

        checkUserRole(session.user);
    }

    function checkUserRole(user) {
        setUser(user);
        const role = user.user_metadata?.role;

        if (role === 'admin') {
            setStatus('authorized');
        } else {
            setStatus('unauthorized');
        }
    }

    // Loading state
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Yetki kontrol ediliyor...</p>
                </div>
            </div>
        );
    }

    // Not logged in
    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldX className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Giriş Gerekli</h1>
                    <p className="text-muted-foreground mb-6">
                        Admin paneline erişmek için giriş yapmanız gerekmektedir.
                    </p>
                    <Link href="/login" className="btn btn-primary">
                        Giriş Yap
                    </Link>
                </div>
            </div>
        );
    }

    // Logged in but not admin
    if (status === 'unauthorized') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldX className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Erişim Reddedildi</h1>
                    <p className="text-muted-foreground mb-4">
                        Bu sayfaya erişim yetkiniz bulunmamaktadır.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                        Giriş yapan hesap: <span className="font-medium">{user?.email}</span>
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/" className="btn btn-outline">
                            Ana Sayfa
                        </Link>
                        <button
                            onClick={() => {
                                supabase.auth.signOut();
                                router.push('/login');
                            }}
                            className="btn btn-primary"
                        >
                            Farklı Hesapla Giriş
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Authorized - render children
    return children;
}
