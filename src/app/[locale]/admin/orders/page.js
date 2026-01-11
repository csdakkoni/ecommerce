'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Package, Truck, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

const statusConfig = {
    pending: { label: 'Beklemede', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Ödendi', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    preparing: { label: 'Hazırlanıyor', icon: Package, color: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'Kargolandı', icon: Truck, color: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'Teslim Edildi', icon: CheckCircle, color: 'bg-green-200 text-green-900' },
    cancelled: { label: 'İptal', icon: XCircle, color: 'bg-red-100 text-red-800' },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data || []);
        }
        setLoading(false);
    }

    const updateOrderStatus = async (orderId, newStatus) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            fetchOrders();
        }
    };

    const updateTrackingInfo = async (orderId, trackingCompany, trackingNumber) => {
        const { error } = await supabase
            .from('orders')
            .update({
                tracking_company: trackingCompany,
                tracking_number: trackingNumber,
                status: 'shipped'
            })
            .eq('id', orderId);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            fetchOrders();
            setSelectedOrder(null);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-bold">Sipariş Yönetimi</h2>
                <p className="text-muted-foreground">Gelen siparişleri görüntüleyin ve yönetin.</p>
            </div>

            <div className="card">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Henüz sipariş bulunmuyor.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="p-4 font-medium text-sm">Sipariş No</th>
                                <th className="p-4 font-medium text-sm">Müşteri</th>
                                <th className="p-4 font-medium text-sm">Tutar</th>
                                <th className="p-4 font-medium text-sm">Durum</th>
                                <th className="p-4 font-medium text-sm">Tarih</th>
                                <th className="p-4 font-medium text-sm text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const StatusIcon = statusConfig[order.status]?.icon || Clock;
                                const statusStyle = statusConfig[order.status]?.color || 'bg-gray-100 text-gray-800';
                                const statusLabel = statusConfig[order.status]?.label || order.status;

                                return (
                                    <tr key={order.id} className="border-b hover:bg-muted/30">
                                        <td className="p-4">
                                            <span className="font-mono text-sm font-semibold">
                                                #{order.id.substring(0, 8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium">
                                                {order.guest_info?.first_name} {order.guest_info?.last_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{order.guest_email}</div>
                                        </td>
                                        <td className="p-4 font-medium">{order.total_amount?.toFixed(2)} ₺</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold">Sipariş Detayı</h3>
                                    <p className="text-sm text-muted-foreground font-mono">#{selectedOrder.id.substring(0, 8).toUpperCase()}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Customer Info */}
                            <div>
                                <h4 className="font-semibold mb-2">Müşteri Bilgileri</h4>
                                <div className="text-sm space-y-1 text-muted-foreground">
                                    <p>{selectedOrder.guest_info?.first_name} {selectedOrder.guest_info?.last_name}</p>
                                    <p>{selectedOrder.guest_email}</p>
                                    <p>{selectedOrder.guest_info?.phone}</p>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <h4 className="font-semibold mb-2">Teslimat Adresi</h4>
                                <p className="text-sm text-muted-foreground">
                                    {selectedOrder.shipping_address?.address}, {selectedOrder.shipping_address?.district}, {selectedOrder.shipping_address?.city}
                                </p>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 className="font-semibold mb-2">Sipariş Kalemleri</h4>
                                <div className="space-y-2">
                                    {selectedOrder.order_items?.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm border-b pb-2">
                                            <span>{item.product_name} {item.variant_name && `(${item.variant_name})`}</span>
                                            <span>{item.quantity} x {item.price} ₺</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-bold pt-2">
                                        <span>Toplam</span>
                                        <span>{selectedOrder.total_amount?.toFixed(2)} ₺</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div>
                                <h4 className="font-semibold mb-2">Durum Güncelle</h4>
                                <select
                                    value={selectedOrder.status}
                                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                                    className="w-full border rounded-md p-2 bg-background"
                                >
                                    {Object.entries(statusConfig).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tracking Info */}
                            <div>
                                <h4 className="font-semibold mb-2">Kargo Bilgisi</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Kargo Firması (Örn: Yurtiçi)"
                                        defaultValue={selectedOrder.tracking_company || ''}
                                        id="trackingCompany"
                                        className="border rounded-md p-2 bg-background"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Takip Numarası"
                                        defaultValue={selectedOrder.tracking_number || ''}
                                        id="trackingNumber"
                                        className="border rounded-md p-2 bg-background"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const company = document.getElementById('trackingCompany').value;
                                        const number = document.getElementById('trackingNumber').value;
                                        updateTrackingInfo(selectedOrder.id, company, number);
                                    }}
                                    className="btn btn-primary mt-4 w-full"
                                >
                                    Kargo Bilgisini Kaydet & Kargolandı Olarak İşaretle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
