'use client';

import { Link } from '@/navigation';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
    LayoutDashboard, Package, ShoppingCart, FolderTree, Users, LogOut, Menu, X,
    MessageSquare, Boxes, Tag, Wallet, Truck, Settings, Bell, ChevronDown
} from 'lucide-react';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState(['main', 'erp']);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const toggleGroup = (group) => {
        setExpandedGroups(prev =>
            prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
        );
    };

    const navGroups = [
        {
            id: 'main',
            label: 'Mağaza',
            items: [
                { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/admin/products', label: 'Ürünler', icon: Package },
                { href: '/admin/orders', label: 'Siparişler', icon: ShoppingCart },
                { href: '/admin/categories', label: 'Kategoriler', icon: FolderTree },
                { href: '/admin/customers', label: 'Müşteriler', icon: Users },
                { href: '/admin/inquiries', label: 'Sorular', icon: MessageSquare },
            ]
        },
        {
            id: 'erp',
            label: 'ERP',
            items: [
                { href: '/admin/stock', label: 'Stok Yönetimi', icon: Boxes },
                { href: '/admin/coupons', label: 'Kuponlar', icon: Tag },
                { href: '/admin/finance', label: 'Finans', icon: Wallet },
                { href: '/admin/suppliers', label: 'Tedarikçiler', icon: Truck },
            ]
        },
        {
            id: 'system',
            label: 'Sistem',
            items: [
                { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
                { href: '/admin/notifications', label: 'Bildirimler', icon: Bell },
            ]
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
                <div className="animate-pulse text-muted-foreground">Yükleniyor...</div>
            </div>
        );
    }

    // For development, allow access without login
    // In production, uncomment: if (!user) { router.push('/login'); return null; }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-900">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg"
            >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar */}
            <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                    <Link href="/admin" className="text-xl font-bold tracking-tight">
                        Grohn Fabrics Admin
                    </Link>
                </div>

                <nav className="px-3 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    {navGroups.map((group) => (
                        <div key={group.id}>
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                            >
                                {group.label}
                                <ChevronDown className={`w-4 h-4 transition-transform ${expandedGroups.includes(group.id) ? '' : '-rotate-90'}`} />
                            </button>
                            {expandedGroups.includes(group.id) && (
                                <div className="space-y-1 mt-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-zinc-800">
                    {user ? (
                        <div className="flex items-center justify-between">
                            <div className="truncate">
                                <p className="text-sm font-medium truncate">{user.user_metadata?.first_name || 'Admin'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                                title="Çıkış Yap"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="btn btn-primary w-full">
                            Giriş Yap
                        </Link>
                    )}
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 mt-14 md:mt-0">
                {children}
            </main>
        </div>
    );
}
