'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Send, MessageCircle } from 'lucide-react';

export default function ProductInquiryModal({ product, isOpen, onClose }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: insertError } = await supabase
            .from('inquiries')
            .insert([{
                product_id: product.id,
                product_name: product.name,
                customer_name: formData.name,
                customer_email: formData.email,
                customer_phone: formData.phone || null,
                message: formData.message,
                status: 'pending'
            }]);

        if (insertError) {
            setError('Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
            console.error(insertError);
        } else {
            setSubmitted(true);
        }
        setLoading(false);
    };

    const handleClose = () => {
        setFormData({ name: '', email: '', phone: '', message: '' });
        setSubmitted(false);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-background rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-primary" />
                            Bu Ürün Hakkında Soru Sor
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {product.name}
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {submitted ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Mesajınız Gönderildi!</h3>
                            <p className="text-muted-foreground mb-6">
                                En kısa sürede e-posta adresinize cevap göndereceğiz.
                            </p>
                            <button onClick={handleClose} className="btn btn-primary">
                                Tamam
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Product Preview */}
                            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                    {product.images?.[0] ? (
                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                            Görsel
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">{product.price} ₺</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Adınız *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full border rounded-md p-3 bg-background"
                                        placeholder="Ad Soyad"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">E-posta *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full border rounded-md p-3 bg-background"
                                        placeholder="ornek@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Telefon (Opsiyonel)</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                    placeholder="+90 5XX XXX XX XX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Mesajınız *</label>
                                <textarea
                                    name="message"
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                    placeholder="Bu ürün hakkında sormak istediğiniz soruları yazın..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={handleClose} className="btn btn-outline flex-1">
                                    İptal
                                </button>
                                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                                    {loading ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
