'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { MessageCircle, Mail, Clock, CheckCircle, Package, Send, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminInquiriesPage() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, []);

    async function fetchInquiries() {
        setLoading(true);
        const { data, error } = await supabase
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error) {
            setInquiries(data || []);
        }
        setLoading(false);
    }

    const filteredInquiries = inquiries.filter(inq => {
        if (filter === 'all') return true;
        return inq.status === filter;
    });

    const handleReply = async (inquiryId) => {
        if (!replyText.trim()) return;
        setReplying(true);

        const { error } = await supabase
            .from('inquiries')
            .update({
                admin_reply: replyText,
                status: 'replied',
                replied_at: new Date().toISOString()
            })
            .eq('id', inquiryId);

        if (error) {
            alert('Hata: ' + error.message);
        } else {
            setReplyText('');
            setExpandedId(null);
            fetchInquiries();
        }
        setReplying(false);
    };

    const handleStatusChange = async (inquiryId, newStatus) => {
        const { error } = await supabase
            .from('inquiries')
            .update({ status: newStatus })
            .eq('id', inquiryId);

        if (!error) {
            fetchInquiries();
        }
    };

    const statusConfig = {
        pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
        replied: { label: 'Cevaplandı', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        closed: { label: 'Kapatıldı', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    };

    const pendingCount = inquiries.filter(i => i.status === 'pending').length;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageCircle className="w-6 h-6" />
                        Müşteri Soruları
                    </h2>
                    <p className="text-muted-foreground">Ürünler hakkında gelen soruları yönetin.</p>
                </div>
                {pendingCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg">
                        <Clock className="w-4 h-4" />
                        {pendingCount} bekleyen soru
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['all', 'pending', 'replied', 'closed'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                    >
                        {status === 'all' ? 'Tümü' : statusConfig[status]?.label}
                        {status === 'pending' && pendingCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">{pendingCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Inquiries List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="card p-8 text-center text-muted-foreground">Yükleniyor...</div>
                ) : filteredInquiries.length === 0 ? (
                    <div className="card p-8 text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">
                            {filter === 'all' ? 'Henüz soru bulunmuyor.' : 'Bu filtreye uygun soru yok.'}
                        </p>
                    </div>
                ) : (
                    filteredInquiries.map((inquiry) => {
                        const isExpanded = expandedId === inquiry.id;
                        const status = statusConfig[inquiry.status] || statusConfig.pending;

                        return (
                            <div key={inquiry.id} className="card overflow-hidden">
                                {/* Header */}
                                <div
                                    className="p-4 flex items-start justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{inquiry.customer_name}</span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-1">
                                                {inquiry.customer_email}
                                            </p>
                                            {inquiry.product_name && (
                                                <p className="text-sm flex items-center gap-1">
                                                    <Package className="w-3 h-3" />
                                                    {inquiry.product_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(inquiry.created_at).toLocaleDateString('tr-TR')}
                                        </span>
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t p-4 space-y-4">
                                        {/* Customer Message */}
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                            <p className="text-sm font-medium mb-2">Müşteri Mesajı:</p>
                                            <p className="text-sm">{inquiry.message}</p>
                                        </div>

                                        {/* Admin Reply */}
                                        {inquiry.admin_reply && (
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <p className="text-sm font-medium mb-2 text-green-700 dark:text-green-400 flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" /> Cevabınız:
                                                </p>
                                                <p className="text-sm">{inquiry.admin_reply}</p>
                                                {inquiry.replied_at && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {new Date(inquiry.replied_at).toLocaleString('tr-TR')}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Reply Form */}
                                        {inquiry.status !== 'closed' && (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={expandedId === inquiry.id ? replyText : ''}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    rows={3}
                                                    className="w-full border rounded-md p-3 bg-background"
                                                    placeholder={inquiry.admin_reply ? 'Yeni cevap yazın...' : 'Cevabınızı yazın...'}
                                                />
                                                <div className="flex justify-between">
                                                    <div className="flex gap-2">
                                                        {inquiry.status !== 'replied' && (
                                                            <button
                                                                onClick={() => handleStatusChange(inquiry.id, 'closed')}
                                                                className="btn btn-outline text-sm"
                                                            >
                                                                Kapat
                                                            </button>
                                                        )}
                                                        {inquiry.status === 'replied' && (
                                                            <button
                                                                onClick={() => handleStatusChange(inquiry.id, 'closed')}
                                                                className="btn btn-outline text-sm"
                                                            >
                                                                Kapatıldı Olarak İşaretle
                                                            </button>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleReply(inquiry.id)}
                                                        disabled={replying || !replyText.trim()}
                                                        className="btn btn-primary text-sm flex items-center gap-2"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                        {replying ? 'Gönderiliyor...' : 'Cevapla'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
