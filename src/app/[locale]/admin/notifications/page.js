'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, Check, CheckCheck, ShoppingCart, AlertTriangle, MessageSquare, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            setNotifications(data);
        }
        setLoading(false);
    }

    const markAsRead = async (id) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const markAllAsRead = async () => {
        await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const deleteNotification = async (id) => {
        await supabase.from('notifications').delete().eq('id', id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = async () => {
        if (!confirm('Tüm bildirimleri silmek istediğinize emin misiniz?')) return;
        await supabase.from('notifications').delete().neq('id', '');
        setNotifications([]);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'new_order':
                return <ShoppingCart className="w-5 h-5" />;
            case 'low_stock':
                return <AlertTriangle className="w-5 h-5" />;
            case 'new_inquiry':
                return <MessageSquare className="w-5 h-5" />;
            default:
                return <Bell className="w-5 h-5" />;
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'new_order':
                return 'bg-blue-100 text-blue-600';
            case 'low_stock':
                return 'bg-amber-100 text-amber-600';
            case 'new_inquiry':
                return 'bg-purple-100 text-purple-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Az önce';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} gün önce`;

        return date.toLocaleDateString('tr-TR');
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="w-7 h-7" />
                        Bildirimler
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-sm bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-muted-foreground">Tüm sistem bildirimleri</p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="btn btn-outline flex items-center gap-2">
                            <CheckCheck className="w-4 h-4" />
                            Tümünü Okundu İşaretle
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button onClick={clearAll} className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {[
                    { value: 'all', label: `Tümü (${notifications.length})` },
                    { value: 'unread', label: `Okunmamış (${unreadCount})` }
                ].map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${filter === f.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">Bildirim yok</h3>
                        <p className="text-muted-foreground">
                            {filter === 'unread' ? 'Tüm bildirimler okundu' : 'Henüz bildirim bulunmuyor'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`flex items-start gap-4 p-4 transition-colors ${!notification.is_read ? 'bg-primary/5' : 'hover:bg-muted/30'
                                    }`}
                            >
                                <div className={`p-2 rounded-xl ${getIconColor(notification.type)}`}>
                                    {getIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDate(notification.created_at)}
                                        </span>
                                    </div>
                                    {notification.message && (
                                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    {!notification.is_read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                                            title="Okundu işaretle"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
