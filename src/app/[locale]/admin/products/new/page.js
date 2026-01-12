'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from '@/navigation';
import MediaUploader from '@/components/MediaUploader';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [categories, setCategories] = useState([]);
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
        category_id: '',
        has_variants: false,
        // i18n fields
        name_en: '',
        description_en: '',
        price_usd: '',
        price_eur: '',
        // Textile/Sales type fields
        unit_type: 'adet',
        min_order_quantity: '1',
        step_quantity: '1',
        fabric_content: '',
        care_instructions: '',
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        const { data } = await supabase.from('categories').select('*').order('name');
        setCategories(data || []);
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

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
            category_id: formData.category_id || null,
            images: images.length > 0 ? images : null,
            is_active: true,
            has_variants: formData.has_variants,
            // i18n fields
            name_en: formData.name_en || null,
            description_en: formData.description_en || null,
            price_usd: formData.price_usd ? parseFloat(formData.price_usd) : null,
            price_eur: formData.price_eur ? parseFloat(formData.price_eur) : null,
            // Textile/Sales type fields
            unit_type: formData.unit_type || 'adet',
            min_order_quantity: formData.min_order_quantity ? parseFloat(formData.min_order_quantity) : 1,
            step_quantity: formData.step_quantity ? parseFloat(formData.step_quantity) : 1,
            fabric_content: formData.fabric_content || null,
            care_instructions: formData.care_instructions || null,
        };

        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) {
            alert('Ürün kaydedilirken hata: ' + error.message);
            setLoading(false);
        } else {
            // If it has variants, redirect to edit page to add them
            if (formData.has_variants) {
                router.push(`/admin/products/${data.id}/edit`);
            } else {
                router.push('/admin/products');
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <Link href="/admin/products" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Ürünlere Dön
            </Link>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Yeni Kumaş Ekle</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            name="has_variants"
                            checked={formData.has_variants}
                            onChange={handleChange}
                            className="w-4 h-4 rounded text-primary"
                        />
                        <span>Varyantlı Ürün</span>
                    </label>
                </div>
            </div>

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

                        <div>
                            <label className="block text-sm font-medium mb-1">Kategori</label>
                            <select
                                name="category_id"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.category_id}
                                onChange={handleChange}
                            >
                                <option value="">Seçiniz</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

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

                {/* Sales Type / Textile Settings */}
                <div className="card p-6 border-2 border-primary/30 bg-primary/5">
                    <h3 className="font-semibold mb-4 text-primary">📐 Satış Tipi & Metraj Ayarları</h3>
                    <p className="text-sm text-muted-foreground mb-6">Kumaş ürünleri için metraj bazlı satış ayarlarını yapın.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Satış Tipi *</label>
                            <select
                                name="unit_type"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.unit_type}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        unit_type: value,
                                        min_order_quantity: value === 'metre' ? '0.5' : '1',
                                        step_quantity: value === 'metre' ? '0.5' : '1',
                                    }));
                                }}
                            >
                                <option value="adet">📦 Adet Bazlı (Hazır Ürün)</option>
                                <option value="metre">📐 Metre Bazlı (Kumaş)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Min. Sipariş ({formData.unit_type === 'metre' ? 'metre' : 'adet'})
                            </label>
                            <input
                                type="number"
                                name="min_order_quantity"
                                step="0.1"
                                min="0.1"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.min_order_quantity}
                                onChange={handleChange}
                                placeholder={formData.unit_type === 'metre' ? '0.5' : '1'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Artış Miktarı ({formData.unit_type === 'metre' ? 'metre' : 'adet'})
                            </label>
                            <input
                                type="number"
                                name="step_quantity"
                                step="0.1"
                                min="0.1"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.step_quantity}
                                onChange={handleChange}
                                placeholder={formData.unit_type === 'metre' ? '0.5' : '1'}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Müşteri bu miktarın katlarında sipariş verebilir
                            </p>
                        </div>
                    </div>

                    {formData.unit_type === 'metre' && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg text-sm">
                            ✅ Bu ürün <strong>{formData.min_order_quantity} metre</strong>'den başlayarak,
                            <strong> {formData.step_quantity} metre</strong> artışlarla satılacak.
                            <br />Örnek: {formData.min_order_quantity}m, {parseFloat(formData.min_order_quantity) + parseFloat(formData.step_quantity)}m, {parseFloat(formData.min_order_quantity) + parseFloat(formData.step_quantity) * 2}m...
                        </div>
                    )}
                </div>

                {/* Global / i18n Section */}
                <div className="card p-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                    <h3 className="font-semibold mb-4 text-blue-700 dark:text-blue-300">🌍 Global / İngilizce İçerik</h3>
                    <p className="text-sm text-muted-foreground mb-6">Yurt dışından gelen ziyaretçiler bu bilgileri görecek.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Product Name (EN)</label>
                            <input
                                type="text"
                                name="name_en"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.name_en}
                                onChange={handleChange}
                                placeholder={formData.name || 'İngilizce ürün adı'}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description (EN)</label>
                            <textarea
                                name="description_en"
                                rows="3"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.description_en}
                                onChange={handleChange}
                                placeholder="English product description..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Price (USD $)</label>
                            <input
                                type="number"
                                name="price_usd"
                                step="0.01"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.price_usd}
                                onChange={handleChange}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Price (EUR €)</label>
                            <input
                                type="number"
                                name="price_eur"
                                step="0.01"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.price_eur}
                                onChange={handleChange}
                                placeholder="0.00"
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

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Kumaş İçeriği</label>
                            <input
                                type="text"
                                name="fabric_content"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.fabric_content}
                                onChange={handleChange}
                                placeholder="Örn: %100 Pamuk veya %60 Keten, %40 Pamuk"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Bakım Talimatları</label>
                            <textarea
                                name="care_instructions"
                                rows="2"
                                className="w-full border rounded-md p-3 bg-background"
                                value={formData.care_instructions}
                                onChange={handleChange}
                                placeholder="Örn: 30°C'de yıkayın, ütülemeden önce nemli bırakın..."
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
