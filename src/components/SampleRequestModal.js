'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, Send, Scissors, Package } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

/**
 * SampleRequestModal - Request fabric sample form
 * Allows customers to request a physical fabric sample
 */
export default function SampleRequestModal({ product, isOpen, onClose }) {
    const t = useTranslations('Product');
    const locale = useLocale();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        zipCode: '',
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

        // Basic validation
        if (!formData.name || !formData.email || !formData.address || !formData.city) {
            setError(locale === 'tr'
                ? 'Lütfen zorunlu alanları doldurun.'
                : 'Please fill in required fields.');
            setLoading(false);
            return;
        }

        const { error: insertError } = await supabase
            .from('sample_requests')
            .insert([{
                product_id: product.id,
                product_name: product.name,
                customer_name: formData.name,
                customer_email: formData.email,
                customer_phone: formData.phone || null,
                customer_address: formData.address,
                customer_city: formData.city,
                customer_district: formData.district || null,
                customer_zip: formData.zipCode || null,
                message: formData.message || null,
                status: 'pending'
            }]);

        if (insertError) {
            console.error('Sample request error:', insertError);
            setError(locale === 'tr'
                ? 'Talep gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'
                : 'An error occurred. Please try again.');
        } else {
            setSubmitted(true);
        }
        setLoading(false);
    };

    const handleClose = () => {
        setFormData({ name: '', email: '', phone: '', address: '', city: '', district: '', zipCode: '', message: '' });
        setSubmitted(false);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    const labels = {
        title: locale === 'tr' ? 'Numune Talep Et' : 'Request Sample',
        subtitle: locale === 'tr' ? 'Bu kumaştan 5x5 cm numune göndereceğiz.' : 'We will send you a 5x5 cm fabric sample.',
        name: locale === 'tr' ? 'Adınız Soyadınız' : 'Full Name',
        email: locale === 'tr' ? 'E-posta' : 'Email',
        phone: locale === 'tr' ? 'Telefon (Opsiyonel)' : 'Phone (Optional)',
        address: locale === 'tr' ? 'Adres' : 'Address',
        city: locale === 'tr' ? 'İl' : 'City',
        district: locale === 'tr' ? 'İlçe' : 'District',
        zipCode: locale === 'tr' ? 'Posta Kodu' : 'Zip Code',
        message: locale === 'tr' ? 'Not (Opsiyonel)' : 'Note (Optional)',
        submit: locale === 'tr' ? 'Numune Talep Et' : 'Request Sample',
        cancel: locale === 'tr' ? 'İptal' : 'Cancel',
        successTitle: locale === 'tr' ? 'Talebiniz Alındı!' : 'Request Received!',
        successMessage: locale === 'tr'
            ? 'Numune talebiniz başarıyla alındı. En kısa sürede adresinize gönderilecektir.'
            : 'Your sample request has been received. It will be shipped to your address shortly.',
        ok: locale === 'tr' ? 'Tamam' : 'OK',
        free: locale === 'tr' ? 'Ücretsiz numune - Kargo bedava!' : 'Free sample - Free shipping!',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-background rounded-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-start bg-gradient-to-r from-primary/10 to-transparent">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Scissors className="w-5 h-5 text-primary" />
                            {labels.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {labels.subtitle}
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
                            <h3 className="text-xl font-bold mb-2">{labels.successTitle}</h3>
                            <p className="text-muted-foreground mb-6">
                                {labels.successMessage}
                            </p>
                            <button onClick={handleClose} className="btn btn-primary">
                                {labels.ok}
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
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <Package className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-green-600 font-medium">{labels.free}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{labels.name} *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full border rounded-md p-3 bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{labels.email} *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full border rounded-md p-3 bg-background"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{labels.phone}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{labels.address} *</label>
                                <textarea
                                    name="address"
                                    required
                                    rows={2}
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{labels.city} *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        required
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full border rounded-md p-3 bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{labels.district}</label>
                                    <input
                                        type="text"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        className="w-full border rounded-md p-3 bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{labels.zipCode}</label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        className="w-full border rounded-md p-3 bg-background"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{labels.message}</label>
                                <textarea
                                    name="message"
                                    rows={2}
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-3 bg-background"
                                    placeholder={locale === 'tr' ? 'Özel bir talebiniz varsa yazabilirsiniz...' : 'Any special requests...'}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={handleClose} className="btn btn-outline flex-1">
                                    {labels.cancel}
                                </button>
                                <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                                    {loading ? '...' : labels.submit}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
