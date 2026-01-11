'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import MediaUploader from '@/components/MediaUploader';

export default function EditProductPage({ params }) {
    const resolvedParams = use(params);
    const productId = resolvedParams.id;

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        is_active: true,
    });

    useEffect(() => {
        fetchProduct();
        fetchCategories();
    }, [productId]);

    async function fetchCategories() {
        const { data } = await supabase.from('categories').select('*').order('name');
        setCategories(data || []);
    }

    async function fetchProduct() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error || !data) {
            alert('Ürün bulunamadı');
            router.push('/admin/products');
            return;
        }

        setFormData({
            name: data.name || '',
            slug: data.slug || '',
            description: data.description || '',
            price: data.price?.toString() || '',
            sale_price: data.sale_price?.toString() || '',
            fabric_type: data.fabric_type || '',
            width_cm: data.width_cm?.toString() || '',
            weight_gsm: data.weight_gsm?.toString() || '',
            pattern: data.pattern || '',
            usage_areas: data.usage_areas?.join(', ') || '',
            category_id: data.category_id || '',
            is_active: data.is_active ?? true,
        });
        setImages(data.images || []);
        setLoading(false);
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

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
            is_active: formData.is_active,
        };

        const { error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', productId);

        if (error) {
            alert('Ürün güncellenirken hata: ' + error.message);
        } else {
            router.push('/admin/products');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <Link href="/admin/products" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Ürünlere Dön
            </Link>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Ürünü Düzenle</h2>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="rounded"
                    />
                    Aktif
                </label>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="card p-6">
                    <h3 className="font-semibold mb-4">Ürün Görselleri</h3>
                    <MediaUploader media={images} onMediaChange={setImages} maxItems={8} />
                </div>

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
                            />
                        </div>
                    </div>
                </div>

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

                <div className="flex justify-end gap-4">
                    <Link href="/admin/products" className="btn btn-outline">İptal</Link>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
}
