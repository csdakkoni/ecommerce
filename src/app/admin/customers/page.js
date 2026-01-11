'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Mail, Phone, MapPin } from 'lucide-react';

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomers();
    }, []);

    async function fetchCustomers() {
        setLoading(true);

        // Get unique customers from orders (guest and registered)
        const { data: orders, error } = await supabase
            .from('orders')
            .select('guest_email, guest_info, user_id, created_at')
            .order('created_at', { ascending: false });

        if (!error && orders) {
            // Group by email to get unique customers
            const customerMap = new Map();

            orders.forEach(order => {
                const email = order.guest_email;
                if (email && !customerMap.has(email)) {
                    customerMap.set(email, {
                        email,
                        name: order.guest_info ? `${order.guest_info.first_name || ''} ${order.guest_info.last_name || ''}`.trim() : 'Bilinmiyor',
                        phone: order.guest_info?.phone || '-',
                        orderCount: 1,
                        lastOrder: order.created_at,
                    });
                } else if (email) {
                    const existing = customerMap.get(email);
                    existing.orderCount += 1;
                }
            });

            setCustomers(Array.from(customerMap.values()));
        }
        setLoading(false);
    }

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold">Müşteriler</h2>
                <p className="text-muted-foreground">Sipariş veren müşterilerin listesi.</p>
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : customers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        Henüz müşteri bulunmuyor.
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="p-4 font-medium text-sm">Müşteri</th>
                                <th className="p-4 font-medium text-sm">E-posta</th>
                                <th className="p-4 font-medium text-sm">Telefon</th>
                                <th className="p-4 font-medium text-sm">Sipariş Sayısı</th>
                                <th className="p-4 font-medium text-sm">Son Sipariş</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((customer, index) => (
                                <tr key={index} className="border-b hover:bg-muted/30">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium">
                                                    {customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </span>
                                            </div>
                                            <span className="font-medium">{customer.name || 'Bilinmiyor'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">{customer.email}</td>
                                    <td className="p-4 text-sm text-muted-foreground">{customer.phone}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                            {customer.orderCount} sipariş
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                        {new Date(customer.lastOrder).toLocaleDateString('tr-TR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
