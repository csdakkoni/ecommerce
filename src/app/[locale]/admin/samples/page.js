'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Package, Eye, Check, X, Mail, Calendar } from 'lucide-react';

export default function AdminSampleRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        setLoading(true);
        const { data, error } = await supabase
            .from('sample_requests')
            .select(`
                *,
                products:product_id (name, images)
            `)
            .order('created_at', { ascending: false });

        if (!error) setRequests(data || []);
        setLoading(false);
    }

    const updateStatus = async (id, status) => {
        const { error } = await supabase
            .from('sample_requests')
            .update({ status })
            .eq('id', id);

        if (!error) fetchRequests();
    };

    const filteredRequests = filter === 'all'
        ? requests
        : requests.filter(r => r.status === filter);

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        sent: 'bg-blue-100 text-blue-700',
        rejected: 'bg-red-100 text-red-700',
    };

    const statusLabels = {
        pending: 'Bekliyor',
        approved: 'Onaylandı',
        sent: 'Gönderildi',
        rejected: 'Reddedildi',
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Numune Talepleri</h2>
                    <p className="text-muted-foreground">Müşteri numune taleplerini yönetin.</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Filtre:</span>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border rounded-md p-2 bg-background"
                    >
                        <option value="all">Tümü ({requests.length})</option>
                        <option value="pending">Bekleyenler ({requests.filter(r => r.status === 'pending').length})</option>
                        <option value="approved">Onaylananlar</option>
                        <option value="sent">Gönderilenler</option>
                        <option value="rejected">Reddedilenler</option>
                    </select>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        Henüz numune talebi yok.
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredRequests.map((request) => (
                            <div key={request.id} className="p-4 hover:bg-muted/30">
                                <div className="flex items-start gap-4">
                                    {/* Product Image */}
                                    <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                        {request.products?.images?.[0] ? (
                                            <img
                                                src={request.products.images[0]}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">{request.customer_name}</span>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[request.status]}`}>
                                                {statusLabels[request.status]}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {request.products?.name || 'Ürün bulunamadı'}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {request.customer_email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(request.created_at).toLocaleDateString('tr')}
                                            </span>
                                        </div>
                                        {request.notes && (
                                            <p className="text-sm mt-2 p-2 bg-muted/50 rounded">{request.notes}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            📍 {request.shipping_city} - {request.shipping_address}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {request.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(request.id, 'approved')}
                                                    className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md"
                                                    title="Onayla"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(request.id, 'rejected')}
                                                    className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md"
                                                    title="Reddet"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {request.status === 'approved' && (
                                            <button
                                                onClick={() => updateStatus(request.id, 'sent')}
                                                className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm"
                                            >
                                                Gönderildi İşaretle
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
