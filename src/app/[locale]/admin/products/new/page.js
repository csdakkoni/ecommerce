'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MediaUploader from '@/components/MediaUploader';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        price: '',
        sale_price: '',
        fabric_type: '',
        width_cm: '',
        weight_gsm: '',
        pattern: '',
        usage_areas: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug from name
        if (name === 'name') {
            const slug = value.toLowerCase()
                .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ğ/g, 'g')
                .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
                .replace(/ /g, '-').replace(/[^\w-]+/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Convert usage_areas comma-separated string to array
        const usageAreasArray = formData.usage_areas
            ? formData.usage_areas.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        const productData = {
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            price: parseFloat(formData.price) || 0,
            sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
            fabric_type: formData.fabric_type || null,
            width_cm: formData.width_cm ? parseInt(formData.width_cm) : null,
            weight_gsm: formData.weight_gsm ? parseInt(formData.weight_gsm) : null,
            pattern: formData.pattern || null,
            usage_areas: usageAreasArray.length > 0 ? usageAreasArray : null,
            images: images.length > 0 ? images : null,
            is_active: true,
        };

        const { error } = await supabase
            .from('products')
            .insert([productData]);

        if (error) {
            alert('Ürün kaydedilirken hata: ' + error.message);
        } else {
            router.push('/admin/products');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Link href="/admin/products" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Ürünlere Dön
            </Link>

            <h2 className="text-2xl font-bold mb-6">Yeni Kumaş Ekle</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Image Upload Section */}
                <div className="card p-6">
                    <h3 className="font-semibold mb-4">Ürün Görselleri & Videoları</h3>
                    <MediaUploader
                        media={images}
                        onMediaChange={setImages}
                        maxItems={8}
                    />
                </div>

                {/* Basic Info */}
                <div className="card p-6">
                    <h3 className="font-semibold mb-4">Temel Bilgiler</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Ürün Adı *</label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Örn: Saf İpek Şifon - Bordo"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">URL Slug</label>
                            <input
                                type="text"
                                name="slug"
                                required
                                className="w-full border rounded-md p-3 bg-background text-muted-foreground"
                                value={formData.slug}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Açıklama</label>
                            <textarea
                                name="description"
                                rows="4"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ürün hakkında detaylı açıklama..."
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="card p-6">
                    <h3 className="font-semibold mb-4">Fiyatlandırma</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Fiyat (₺) *</label>
                            <input
                                type="number"
                                name="price"
                                step="0.01"
                                required
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">İndirimli Fiyat (₺)</label>
                            <input
                                type="number"
                                name="sale_price"
                                step="0.01"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.sale_price}
                                onChange={handleChange}
                                placeholder="Opsiyonel"
                            />
                        </div>
                    </div>
                </div>

                {/* Fabric Details */}
                <div className="card p-6">
                    <h3 className="font-semibold mb-4">Kumaş Özellikleri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Kumaş Tipi</label>
                            <select
                                name="fabric_type"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.fabric_type}
                                onChange={handleChange}
                            >
                                <option value="">Seçiniz</option>
                                <option value="Pamuk">Pamuk</option>
                                <option value="İpek">İpek</option>
                                <option value="Keten">Keten</option>
                                <option value="Kadife">Kadife</option>
                                <option value="Polyester">Polyester</option>
                                <option value="Yün">Yün</option>
                                <option value="Karışım">Karışım</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Desen</label>
                            <select
                                name="pattern"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.pattern}
                                onChange={handleChange}
                            >
                                <option value="">Seçiniz</option>
                                <option value="Düz">Düz</option>
                                <option value="Çizgili">Çizgili</option>
                                <option value="Kareli">Kareli</option>
                                <option value="Çiçekli">Çiçekli</option>
                                <option value="Geometrik">Geometrik</option>
                                <option value="Desenli">Desenli</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">En (cm)</label>
                            <input
                                type="number"
                                name="width_cm"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.width_cm}
                                onChange={handleChange}
                                placeholder="140"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Ağırlık (gr/m²)</label>
                            <input
                                type="number"
                                name="weight_gsm"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.weight_gsm}
                                onChange={handleChange}
                                placeholder="200"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Kullanım Alanları</label>
                            <input
                                type="text"
                                name="usage_areas"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.usage_areas}
                                onChange={handleChange}
                                placeholder="Giyim, Döşemelik, Perde (virgülle ayırın)"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Link href="/admin/products" className="btn btn-outline">
                        İptal
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? 'Kaydediliyor...' : 'Ürünü Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
}
