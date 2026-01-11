'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CheckoutPage() {
    const { cart, cartTotal, removeFromCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Address, 2: Payment

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        zipCode: '',
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmitOrder = async () => {
        setLoading(true);

        // Create order in Supabase
        const orderData = {
            guest_email: formData.email,
            guest_info: {
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
            },
            shipping_address: {
                address: formData.address,
                city: formData.city,
                district: formData.district,
                zip_code: formData.zipCode,
            },
            billing_address: {
                address: formData.address,
                city: formData.city,
                district: formData.district,
                zip_code: formData.zipCode,
            },
            total_amount: cartTotal + (cartTotal >= 500 ? 0 : 29.90),
            status: 'pending',
        };

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError) {
            alert('Sipariş oluşturulurken hata: ' + orderError.message);
            setLoading(false);
            return;
        }

        // Create order items
        const orderItems = cart.map(item => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            variant_name: item.variantName,
            price: item.price,
            quantity: item.quantity,
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            alert('Sipariş kalemleri kaydedilirken hata: ' + itemsError.message);
            setLoading(false);
            return;
        }

        // Clear cart and redirect
        localStorage.removeItem('grohnfabrics_cart');
        router.push(`/checkout/success?order=${order.id}`);
    };

    if (cart.length === 0) {
        return (
            <div className="container py-24 text-center">
                <h2 className="h2 mb-4">Sepetiniz Boş</h2>
                <p className="text-muted-foreground mb-8">Ödeme yapmak için sepetinize ürün ekleyin.</p>
                <button onClick={() => router.push('/products')} className="btn btn-primary">
                    Alışverişe Başla
                </button>
            </div>
        );
    }

    return (
        <div className="container py-12">
            <h1 className="h2 mb-8">Ödeme</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    {/* Step Indicator */}
                    <div className="flex items-center mb-8 border-b pb-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                            Teslimat Bilgileri
                        </div>
                        <div className="flex-1 h-px bg-border mx-4"></div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</span>
                            Ödeme
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">İletişim Bilgileri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">E-posta</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" placeholder="ornek@email.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ad</label>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Soyad</label>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Telefon</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" placeholder="05XX XXX XX XX" />
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mt-8">Teslimat Adresi</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-1">Adres</label>
                                    <textarea name="address" value={formData.address} onChange={handleChange} required rows={3}
                                        className="w-full border rounded-md p-3 bg-background" placeholder="Mahalle, Sokak, Bina No..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">İl</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">İlçe</label>
                                    <input type="text" name="district" value={formData.district} onChange={handleChange} required
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Posta Kodu</label>
                                    <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange}
                                        className="w-full border rounded-md p-3 bg-background" />
                                </div>
                            </div>

                            <button onClick={() => setStep(2)} className="btn btn-primary w-full mt-6 h-12">
                                Ödemeye Geç
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">Ödeme Yöntemi</h3>

                            {/* Mock Payment Form - Replace with PayTR iFrame */}
                            <div className="border rounded-lg p-6 bg-muted/30">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Bu demo sürümde ödeme simülasyonu yapılmaktadır.
                                    Gerçek entegrasyonda bu alanda PayTR iFrame gösterilecektir.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Kart Numarası</label>
                                        <input type="text" placeholder="1234 5678 9012 3456" disabled
                                            className="w-full border rounded-md p-3 bg-background opacity-60" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Son Kullanma</label>
                                            <input type="text" placeholder="AA/YY" disabled
                                                className="w-full border rounded-md p-3 bg-background opacity-60" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">CVV</label>
                                            <input type="text" placeholder="123" disabled
                                                className="w-full border rounded-md p-3 bg-background opacity-60" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button onClick={() => setStep(1)} className="btn btn-outline flex-1 h-12">
                                    Geri Dön
                                </button>
                                <button onClick={handleSubmitOrder} disabled={loading} className="btn btn-primary flex-1 h-12">
                                    {loading ? 'İşleniyor...' : 'Siparişi Tamamla'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4">Sipariş Özeti</h3>

                        <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                            {cart.map((item) => (
                                <div key={`${item.id}-${item.variantId}`} className="flex gap-3 text-sm">
                                    <div className="w-12 h-12 bg-muted rounded flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <p className="font-medium line-clamp-1">{item.name}</p>
                                        <p className="text-muted-foreground">{item.quantity} x {item.price} ₺</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ara Toplam</span>
                                <span>{cartTotal.toFixed(2)} ₺</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Kargo</span>
                                <span>{cartTotal >= 500 ? 'Ücretsiz' : '29.90 ₺'}</span>
                            </div>
                        </div>
                        <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                            <span>Toplam</span>
                            <span>{(cartTotal + (cartTotal >= 500 ? 0 : 29.90)).toFixed(2)} ₺</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
